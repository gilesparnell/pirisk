import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// ─── Users & Auth ───────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  role: text("role", { enum: ["admin", "user"] })
    .notNull()
    .default("user"),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("active"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const allowedEmails = sqliteTable("allowed_emails", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  addedBy: text("added_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Business Profile ───────────────────────────────────────

export const businessProfiles = sqliteTable("business_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull().default(""),
  abn: text("abn"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  standardDayHours: real("standard_day_hours").notNull().default(8),
  mileageRate: real("mileage_rate").notNull().default(0.91),
  gstRate: real("gst_rate").notNull().default(0.1),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  paymentTermsDays: integer("payment_terms_days").notNull().default(30),
  bankName: text("bank_name"),
  bankBsb: text("bank_bsb"),
  bankAccount: text("bank_account"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ─── Clients & Projects ─────────────────────────────────────

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  rateType: text("rate_type", { enum: ["hourly", "daily"] })
    .notNull()
    .default("hourly"),
  rate: real("rate").notNull().default(275),
  color: text("color").notNull().default("#2D7A7C"),
  xeroContactId: text("xero_contact_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    status: text("status", { enum: ["active", "completed", "on_hold"] })
      .notNull()
      .default("active"),
    budgetHours: real("budget_hours"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("idx_projects_client").on(table.clientId)]
);

// ─── Time Entries ───────────────────────────────────────────

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    hours: real("hours").notNull(),
    description: text("description"),
    entryType: text("entry_type", {
      enum: ["voice", "manual", "timer"],
    })
      .notNull()
      .default("manual"),
    billable: integer("billable", { mode: "boolean" }).notNull().default(true),
    nonBillableReason: text("non_billable_reason"),
    mileageKm: real("mileage_km"),
    invoiceId: text("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_entries_user_date").on(table.userId, table.date),
    index("idx_entries_project").on(table.projectId),
    index("idx_entries_invoice").on(table.invoiceId),
  ]
);

// ─── Invoices ───────────────────────────────────────────────

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    status: text("status", {
      enum: ["draft", "sent", "paid", "overdue", "void"],
    })
      .notNull()
      .default("draft"),
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date").notNull(),
    subtotal: real("subtotal").notNull().default(0),
    gst: real("gst").notNull().default(0),
    total: real("total").notNull().default(0),
    notes: text("notes"),
    xeroInvoiceId: text("xero_invoice_id"),
    paidAt: text("paid_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_invoices_client").on(table.clientId),
    index("idx_invoices_status").on(table.status),
  ]
);

export const invoiceLineItems = sqliteTable(
  "invoice_line_items",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: real("quantity").notNull(),
    quantityUnit: text("quantity_unit", { enum: ["hours", "days", "km"] })
      .notNull()
      .default("hours"),
    unitPrice: real("unit_price").notNull(),
    amount: real("amount").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("idx_line_items_invoice").on(table.invoiceId)]
);

// ─── Sequences (for invoice numbering) ──────────────────────

export const sequences = sqliteTable("sequences", {
  entity: text("entity").primaryKey(),
  value: integer("value").notNull().default(0),
});

// ─── Xero Integration ───────────────────────────────────────

export const xeroConnections = sqliteTable("xero_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull(),
  tenantName: text("tenant_name"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: text("expires_at").notNull(),
  scopes: text("scopes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
