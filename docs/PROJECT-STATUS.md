# PiTime — Project Status

> **Client:** PiRisk Management (Allerick)
> **Project:** PiTime — Voice-Activated Timesheet & Invoice App
> **Stack:** Next.js 15 | TypeScript | Turso (libSQL) | Drizzle ORM | NextAuth v5 | Tailwind CSS 4
> **Repo:** pirisk
> **Last updated:** 2026-04-04

---

## Phase Overview

| # | Phase | Status | Tests | Notes |
|---|-------|--------|-------|-------|
| 0 | Netlify → Vercel Migration | ✅ Complete | 14 | Marketing site converted to Next.js + Tailwind |
| 1 | Auth + DB Foundation | ✅ Complete | 12 | Google OAuth, Turso schema deployed, allowlist seeded |
| 2 | Core Time Entry | ✅ Complete | 40 | CRUD + inline edit, voice parser with fuzzy/Levenshtein matching, word-form numbers up to hundreds |
| 3 | Clients & Projects | ✅ Complete | 16 | Full CRUD — add, edit, delete (with timesheet guard), project management |
| 4 | Invoices | ✅ Complete | 10 | Generation, line items, GST calc, sequential numbering. UI wired — create, list, status transitions |
| 5 | Dashboard & Charts | ✅ Complete | 19 | Real stats, recent entries, quick entry link + Recharts (weekly hours, revenue by client, aged receivables) |
| 6 | Settings & Polish | ✅ Complete | 8 | Business profile, invoice settings, bank details persisted to DB. Keyboard shortcuts, logout modal |
| 7 | Xero Integration | ⬜ Not started | — | OAuth2, contact sync, invoice push, payment webhook |
| 8 | E2E Verification | ✅ Complete | 21 | Playwright: auth, navigation, all pages, forms, mobile responsive |

**Total tests passing: 147 unit + 21 E2E = 168 total**

---

## What's Built

### Infrastructure
- [x] Next.js 15 scaffold with Turbo, Tailwind CSS 4, Vitest, Playwright
- [x] Turso database created (Mumbai region — closest to Sydney)
- [x] Full Drizzle schema deployed (10 tables)
- [x] Google OAuth via NextAuth v5 (JWT sessions, 24h expiry)
- [x] Email allowlist access control (allerick@pirisk.com.au, giles@parnellsystems.com)
- [x] Route protection middleware (`/app/*` requires auth)
- [x] Dev login for local testing
- [x] Port 3001 (avoids conflict with other local projects)

### Marketing Site (`/`)
- [x] Hero section with gradient text
- [x] 6 service cards (Distressed Project Turnaround, Contract Management, etc.)
- [x] About section with stats (20+ years, $67M+ recovered, 100% client focused)
- [x] Contact section with form, phone, email, Grace AI button
- [x] Footer with brand and navigation
- [x] Responsive navbar with PiTime link

### PiTime App (`/app/*`)
- [x] Sidebar navigation (Dashboard, Time Entries, Clients, Invoices, Settings)
- [x] Mobile-responsive app shell with hamburger menu
- [x] Login page with Google sign-in + dev login
- [x] Keyboard shortcuts (Ctrl+N → new entry, ? → help, Esc → close)
- [x] Keyboard icon in header to open shortcuts help
- [x] Logout modal ("Logging out of PiTime — Giles for President!")
- [x] Sign-out via proper server action (no headers error)

### Dashboard (`/app`) — Fully Wired
- [x] Stat cards: today's hours, week total, unbilled amount, outstanding invoices
- [x] Recent entries list (last 5 from the week)
- [x] Quick Time Entry card with link to `/app/entries?new=1` (auto-opens form)
- [x] Weekly Hours bar chart (Mon-Sun, recharts)
- [x] Revenue by Client horizontal bar chart
- [x] Aged Receivables bar chart (Current, 1-30, 31-60, 60+ days)

### Clients (`/app/clients`) — Fully Wired
- [x] Server component fetches clients on page load
- [x] Add Client form with validation (name required, rate > 0)
- [x] Client list with expandable cards showing contact details
- [x] Edit client inline (name, contact, rate type, rate)
- [x] Delete client with confirmation + timesheet guard (cannot delete if has time entries)
- [x] Per-client project management (add project with name + code)
- [x] Project status badges (active/completed/on_hold)
- [x] Rate type display (hourly/daily with AUD amount)

### Time Entries (`/app/entries`) — Fully Wired
- [x] Server component fetches today's entries + clients with projects
- [x] Auto-open form when arriving from dashboard (`?new=1`)
- [x] Voice/quick entry input with Parse button (autoFocus)
- [x] Voice parser with fuzzy matching:
  - Levenshtein distance for spelling variations (Tessie → Tess, Akme → Acme)
  - PascalCase/camelCase name splitting (TessTantrums → Tess + Tantrums)
  - Prefix matching (Bob → Bobby)
  - Punctuation stripping (commas, periods in input)
- [x] Word-form number parsing: one through twenty, tens (thirty–ninety), compounds (forty five), hundreds (a hundred and sixty, three hundred and twenty)
- [x] Parse result feedback (shows what was matched/missed)
- [x] Client dropdown filters project dropdown to active projects only
- [x] Manual form with date, hours, description, mileage, billable toggle
- [x] Form validation (project required, hours > 0 and ≤ 24)
- [x] Entry list showing today's entries with client/project names
- [x] Delete entries with confirmation
- [x] Inline edit entries (hours, description, mileage, billable)

### Invoices (`/app/invoices`) — Fully Wired
- [x] Server component fetches invoices + clients on page load
- [x] Create invoice form (select client, issue date, due date, notes)
- [x] Auto-generated invoice numbers (INV-YYYYMM-NNN)
- [x] Invoice list with status badges (draft/sent/paid/overdue/void)
- [x] Auto-detect overdue invoices (past due date)
- [x] Status transition buttons (draft→sent, sent→paid, void)
- [x] GST calculation (10% on subtotal)
- [x] Invoice detail/print view (`/app/invoices/[id]`) with professional layout
- [x] Print CSS for PDF/paper output

### Settings (`/app/settings`) — Fully Wired
- [x] Server component fetches/creates business profile on page load
- [x] Business profile form (name, ABN, address, email, phone)
- [x] Invoice settings (standard day hours, mileage rate, GST rate, prefix, payment terms)
- [x] Bank details (bank name, BSB, account number)
- [x] Save with success/error feedback (green "Saved" indicator)
- [x] Xero connect button (placeholder for Phase 7)

### Server Actions (tested with in-memory SQLite)
- [x] **Users:** isEmailAllowed, upsertUser, getUserByEmail, addAllowedEmail, removeAllowedEmail (12 tests)
- [x] **Entries:** createEntry, getEntriesByDate, getEntriesByDateRange, updateEntry, deleteEntry (11 tests)
- [x] **Clients:** createClient, getClientsByUser, updateClient, deleteClient (with timesheet guard), createProject, getProjectsByClient, updateProject (13 tests)
- [x] **Invoices:** generateInvoiceNumber, createInvoice, getInvoicesByUser, updateInvoiceStatus, addLineItem, getLineItems, calculateInvoiceTotals (10 tests)
- [x] **Settings:** getOrCreateProfile, updateProfile — business profile CRUD (8 tests)
- [x] **Voice Parser:** parseVoiceEntry — fuzzy/Levenshtein matching, PascalCase splitting, word-form numbers (34 tests)
- [x] **Client Form Validation:** name required, rate validation (7 tests)
- [x] **Entry Form Validation:** project required, hours validation (7 tests)
- [x] **Dashboard Stats:** computeDashboardStats — today/week hours, unbilled, outstanding (6 tests)

### App-Level Server Actions (auth + DB wrappers)
- [x] **Clients:** fetchClients, addClient, editClient, removeClient, addProject, fetchProjectsForClient
- [x] **Entries:** fetchClientsWithProjects, fetchEntriesForDate, fetchEntriesByRange, addEntry, addVoiceEntry, parseVoiceInput, removeEntry
- [x] **Invoices:** fetchInvoices, fetchClients, fetchInvoiceWithLineItems, createInvoiceForClient, addInvoiceLineItem, changeInvoiceStatus
- [x] **Settings:** fetchProfile, saveProfile
- [x] **Dashboard:** fetchDashboardData
- [x] **Auth:** signOutAction (proper server action)

---

## What's Next

### Phase 7: Xero Integration
- [ ] OAuth2 connect flow (granular scopes)
- [ ] Contact sync (clients → Xero contacts)
- [ ] Invoice push (PiTime invoices → Xero)
- [ ] Payment webhook (Xero payment → mark invoice paid)
- [ ] Token refresh management

### Phase 8: Verification (complete)
- [x] Playwright E2E: 21 tests covering auth, navigation, all pages, forms, validation
- [x] Mobile responsive verification (iPhone viewport)
- [x] Edge cases covered in unit tests (GST calculation, voice parsing, entry validation)

### Nice-to-Have (complete)
- [x] Invoice detail/print view (`/app/invoices/[id]`) with professional layout + print CSS
- [x] Entry editing (inline edit in entry list — hours, description, mileage, billable)
- [x] Recharts dashboard charts (weekly hours, revenue by client, aged receivables)
- [ ] More keyboard shortcuts (navigation, quick actions)

---

## Database Schema

```
users ← allowed_emails
  ↓
business_profiles
  ↓
clients → projects → entries
  ↓                    ↓
invoices ←─────────────┘
  ↓
invoice_line_items

sequences (invoice numbering)
xero_connections (OAuth tokens)
```

### Key Design Decisions
- **Rate types:** Clients have `rateType` (hourly/daily) + `rate` — daily invoices convert hours via `standardDayHours`
- **Invoice numbering:** `INV-YYYYMM-NNN` with atomic sequence counter per month
- **GST:** 10% on all line items including mileage ($0.91/km ATO rate)
- **Voice input:** Wispr Flow (OS-level speech-to-text) types into browser → local fuzzy parser matches client/project/hours
- **Fuzzy matching:** Levenshtein distance (edit distance) + prefix matching + PascalCase splitting
- **Delete guard:** Clients with time entries cannot be deleted

---

## Credentials & Config

| Service | Status | Region |
|---------|--------|--------|
| Turso DB | ✅ Connected | Mumbai (aws-ap-south-1) |
| Google OAuth | ✅ Connected | — |
| AUTH_SECRET | ✅ Generated | — |
| Anthropic API | ⬜ Not configured | — |
| Xero API | ⬜ Not configured | — |
| Vercel | ⬜ Not deployed | — |

---

## Running Locally

```bash
cd client-sites/pirisk
npm run dev          # http://localhost:3001
npm run test         # 122 tests
npm run build        # production build
```
