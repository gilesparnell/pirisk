/**
 * Copies all data from the source user to the target user.
 * Creates duplicate clients, projects, entries, invoices, and line items
 * with new IDs but identical content.
 *
 * Usage:
 *   source .env.local && npx tsx scripts/sync-user-data.ts
 */

import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const SOURCE_EMAIL = process.argv[2] || "allerick@pirisk.com.au";
const TARGET_EMAIL = process.argv[3] || "gilesparnell@gmail.com";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  // ── Find users ──────────────────────────────────────────────
  const users = await db.execute("SELECT id, email, name FROM users");
  const sourceUser = users.rows.find((r) => r.email === SOURCE_EMAIL);
  let targetUser = users.rows.find((r) => r.email === TARGET_EMAIL);

  if (!sourceUser) {
    console.error(`Source user ${SOURCE_EMAIL} not found`);
    process.exit(1);
  }

  // Create target user if they don't exist yet
  if (!targetUser) {
    const targetId = randomUUID();
    await db.execute({
      sql: "INSERT INTO users (id, email, name, role, status, created_at) VALUES (?, ?, ?, 'user', 'active', ?)",
      args: [targetId, TARGET_EMAIL, "Giles Parnell", new Date().toISOString()],
    });
    // Also add to allowed_emails
    await db.execute({
      sql: "INSERT OR IGNORE INTO allowed_emails (id, email, created_at) VALUES (?, ?, ?)",
      args: [randomUUID(), TARGET_EMAIL, new Date().toISOString()],
    });
    targetUser = { id: targetId, email: TARGET_EMAIL, name: "Giles Parnell" };
    console.log(`Created target user: ${TARGET_EMAIL} (${targetId})`);
  }

  const sourceId = sourceUser.id as string;
  const targetId = targetUser.id as string;

  console.log(`Source: ${SOURCE_EMAIL} (${sourceId})`);
  console.log(`Target: ${TARGET_EMAIL} (${targetId})`);

  // ── Clear existing target data (so re-runs are idempotent) ──
  console.log("\nClearing existing target data...");
  await db.execute({ sql: "DELETE FROM entries WHERE user_id = ?", args: [targetId] });
  await db.execute({ sql: "DELETE FROM invoice_line_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = ?)", args: [targetId] });
  await db.execute({ sql: "DELETE FROM invoices WHERE user_id = ?", args: [targetId] });
  await db.execute({ sql: "DELETE FROM projects WHERE client_id IN (SELECT id FROM clients WHERE user_id = ?)", args: [targetId] });
  await db.execute({ sql: "DELETE FROM clients WHERE user_id = ?", args: [targetId] });

  // ── Copy clients ────────────────────────────────────────────
  const clientIdMap = new Map<string, string>(); // old → new
  const srcClients = await db.execute({
    sql: "SELECT * FROM clients WHERE user_id = ?",
    args: [sourceId],
  });

  for (const c of srcClients.rows) {
    const newId = randomUUID();
    clientIdMap.set(c.id as string, newId);
    await db.execute({
      sql: `INSERT INTO clients (id, user_id, name, contact_name, contact_email, contact_phone, rate_type, rate, color, xero_contact_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newId, targetId, c.name, c.contact_name, c.contact_email, c.contact_phone, c.rate_type, c.rate, c.color, c.xero_contact_id, c.created_at, c.updated_at],
    });
  }
  console.log(`Copied ${srcClients.rows.length} clients`);

  // ── Copy projects ───────────────────────────────────────────
  const projectIdMap = new Map<string, string>(); // old → new
  const srcProjects = await db.execute("SELECT * FROM projects");

  for (const p of srcProjects.rows) {
    const newClientId = clientIdMap.get(p.client_id as string);
    if (!newClientId) continue; // not a source user's project
    const newId = randomUUID();
    projectIdMap.set(p.id as string, newId);
    await db.execute({
      sql: `INSERT INTO projects (id, client_id, name, code, status, budget_hours, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newId, newClientId, p.name, p.code, p.status, p.budget_hours, p.created_at, p.updated_at],
    });
  }
  console.log(`Copied ${projectIdMap.size} projects`);

  // ── Copy invoices ───────────────────────────────────────────
  const invoiceIdMap = new Map<string, string>();
  const srcInvoices = await db.execute({
    sql: "SELECT * FROM invoices WHERE user_id = ?",
    args: [sourceId],
  });

  for (const inv of srcInvoices.rows) {
    const newId = randomUUID();
    const newClientId = clientIdMap.get(inv.client_id as string);
    if (!newClientId) continue;
    invoiceIdMap.set(inv.id as string, newId);
    await db.execute({
      sql: `INSERT INTO invoices (id, user_id, client_id, invoice_number, status, issue_date, due_date, subtotal, gst, total, notes, xero_invoice_id, paid_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [newId, targetId, newClientId, `${inv.invoice_number}-${TARGET_EMAIL.split("@")[0].slice(-2).toUpperCase()}`, inv.status, inv.issue_date, inv.due_date, inv.subtotal, inv.gst, inv.total, inv.notes, inv.xero_invoice_id, inv.paid_at, inv.created_at, inv.updated_at],
    });
  }
  console.log(`Copied ${invoiceIdMap.size} invoices`);

  // ── Copy invoice line items ─────────────────────────────────
  let lineItemCount = 0;
  for (const [oldInvId, newInvId] of invoiceIdMap) {
    const items = await db.execute({
      sql: "SELECT * FROM invoice_line_items WHERE invoice_id = ?",
      args: [oldInvId],
    });
    for (const item of items.rows) {
      await db.execute({
        sql: `INSERT INTO invoice_line_items (id, invoice_id, description, quantity, quantity_unit, unit_price, amount, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), newInvId, item.description, item.quantity, item.quantity_unit, item.unit_price, item.amount, item.sort_order],
      });
      lineItemCount++;
    }
  }
  console.log(`Copied ${lineItemCount} invoice line items`);

  // ── Copy entries ────────────────────────────────────────────
  const srcEntries = await db.execute({
    sql: "SELECT * FROM entries WHERE user_id = ?",
    args: [sourceId],
  });

  let entryCount = 0;
  for (const e of srcEntries.rows) {
    const newProjectId = projectIdMap.get(e.project_id as string);
    if (!newProjectId) continue;
    const newInvoiceId = e.invoice_id ? invoiceIdMap.get(e.invoice_id as string) ?? null : null;
    await db.execute({
      sql: `INSERT INTO entries (id, user_id, project_id, date, hours, description, entry_type, billable, non_billable_reason, mileage_km, invoice_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), targetId, newProjectId, e.date, e.hours, e.description, e.entry_type, e.billable, e.non_billable_reason, e.mileage_km, newInvoiceId, e.created_at, e.updated_at],
    });
    entryCount++;
  }
  console.log(`Copied ${entryCount} entries`);

  // ── Copy business profile ──────────────────────────────────
  const srcProfile = await db.execute({
    sql: "SELECT * FROM business_profiles WHERE user_id = ?",
    args: [sourceId],
  });

  if (srcProfile.rows.length > 0) {
    const p = srcProfile.rows[0];
    // Update existing or insert
    await db.execute({ sql: "DELETE FROM business_profiles WHERE user_id = ?", args: [targetId] });
    await db.execute({
      sql: `INSERT INTO business_profiles (id, user_id, business_name, abn, address, phone, email, logo_url, standard_day_hours, mileage_rate, gst_rate, invoice_prefix, payment_terms_days, bank_name, bank_bsb, bank_account, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), targetId, p.business_name, p.abn, p.address, p.phone, p.email, p.logo_url, p.standard_day_hours, p.mileage_rate, p.gst_rate, p.invoice_prefix, p.payment_terms_days, p.bank_name, p.bank_bsb, p.bank_account, p.created_at, p.updated_at],
    });
    console.log("Copied business profile");
  }

  console.log("\nDone! Both users now have the same data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
