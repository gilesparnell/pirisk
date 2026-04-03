# PiTime — Technical Specification
## Voice-Activated Timesheet & Invoice App for Construction Commercial Consultants

---

## 1. Overview

PiTime is a browser-based React app (.jsx artifact) that lets a solo construction commercial consultant capture time entries via natural language (dictated through Wispr Flow), automatically categorise them using Claude's API, track billable vs non-billable hours across multiple clients and projects, generate simple monthly invoices with supporting timesheets, and view a dashboard of utilisation and revenue.

**Target user:** A consultant who works across multiple construction clients (builders, developers, strata companies), bills different hourly rates per client, manages multiple projects per client (e.g. 3 active sites for one builder), and needs to produce monthly PDF-ready invoices with detailed timesheet attachments.

**Key design principle:** The app is the smart front door for time capture. It is NOT an accounting tool. It will eventually integrate with Xero for invoicing, payments, and accounting. For now, it generates its own simple invoices.

---

## 2. Architecture

```
Wispr Flow (OS-level voice-to-text)
    ↓ types clean text into browser
PiTime React App (.jsx artifact)
    ├── Single smart input field (receives dictated text)
    ├── Claude API call (parses text → structured entry)
    ├── Persistent storage (window.storage API)
    ├── Timesheet / entries log
    ├── Invoice generator (simple, in-app)
    └── Dashboard (charts + metrics)
```

**No backend.** All data persists via the artifact `window.storage` API (key-value, JSON serialised). Claude API calls are made client-side using the Anthropic API endpoint (no API key needed in artifacts).

---

## 3. Data Model

### 3.1 Business Profile
```json
{
  "businessName": "PiRisk Management",
  "abn": "12 345 678 901",
  "contactName": "Full Name",
  "email": "allerick@pirisk.com.au",
  "phone": "+61 401 805 618",
  "address": "Northern Beaches, Sydney NSW",
  "bankBsb": "000-000",
  "bankAccount": "12345678",
  "bankName": "Bank Name",
  "defaultPaymentTerms": 30,
  "logoUrl": ""
}
```
Storage key: `pt-business`

### 3.2 Clients
```json
{
  "id": "c_abc123",
  "name": "Meriton Group",
  "contactName": "John Smith",
  "email": "john@meriton.com.au",
  "hourlyRate": 275,
  "paymentTermsDays": 30,
  "projects": [
    { "id": "p_xyz789", "name": "Bondi Tower", "status": "active" },
    { "id": "p_xyz790", "name": "Mascot Stage 2", "status": "active" }
  ],
  "status": "active",
  "createdAt": "2025-01-15T00:00:00Z"
}
```
Storage key: `pt-clients` (array of client objects)

### 3.3 Time Entries
```json
{
  "id": "e_def456",
  "clientId": "c_abc123",
  "clientName": "Meriton Group",
  "projectId": "p_xyz789",
  "projectName": "Bondi Tower",
  "task": "Contract Review",
  "hours": 2.5,
  "billable": true,
  "notes": "Reviewed head contract clause 37 re EOT entitlements",
  "date": "2025-04-03",
  "time": "09:30",
  "timestamp": "2025-04-03T09:30:00Z",
  "source": "voice"
}
```
Storage key: `pt-entries` (array of entry objects)

Notes:
- `billable: false` is used for quick phone calls, internal admin, etc. These are tracked but excluded from invoices.
- `source` can be "voice" (AI-parsed), "timer" (start/stop), or "manual" (form entry).
- Hours are always rounded to nearest 0.25 (15 min increments).

### 3.4 Invoices
```json
{
  "id": "inv_ghi012",
  "number": "INV-2025-04-001",
  "clientId": "c_abc123",
  "clientName": "Meriton Group",
  "month": "2025-04",
  "entries": ["e_def456", "e_def457"],
  "lineItems": [
    {
      "projectName": "Bondi Tower",
      "task": "Contract Review",
      "hours": 2.5,
      "rate": 275,
      "amount": 687.50,
      "notes": "Reviewed head contract clause 37..."
    }
  ],
  "subtotal": 5500.00,
  "gst": 550.00,
  "total": 6050.00,
  "status": "draft",
  "createdAt": "2025-05-01T00:00:00Z",
  "dueDate": "2025-05-31",
  "paidDate": null
}
```
Storage key: `pt-invoices` (array of invoice objects)

Invoice statuses: `draft` → `sent` → `paid` → `overdue`
- Overdue = status is "sent" AND current date > dueDate

---

## 4. Features — Detailed

### 4.1 Smart Voice Input (Core Feature)

**How it works:**
1. User has Wispr Flow running at OS level.
2. PiTime presents a single large text input field ("What did you work on?").
3. User holds Wispr Flow hotkey, speaks naturally, e.g.:
   - "Two and a half hours on the Meriton Bondi Tower project, contract review, reviewed head contract clause 37 re EOT entitlements"
   - "Quick 10-minute call with Probuild about the Mascot defects, don't bill"
   - "3 hours site inspection at Lendlease Darling Square"
4. Wispr Flow types the clean text into the input field.
5. User presses Enter or clicks "Log".
6. App sends text + client/project context to Claude API for parsing.
7. Claude returns structured JSON.
8. App shows a confirmation card with parsed fields — user can tweak and confirm.
9. Entry is saved.

**Claude API call spec:**
- Endpoint: `https://api.anthropic.com/v1/messages`
- Model: `claude-sonnet-4-20250514`
- System prompt should include:
  - The full list of current clients (names only)
  - The full list of projects per client (names only)
  - The task categories list
  - Instructions to return JSON only, no markdown fences
  - Instructions to fuzzy-match client/project names (e.g. "Meriton" matches "Meriton Group")
  - Instructions to detect billable vs non-billable signals ("don't bill", "non-billable", "quick call", "no charge")
  - Instructions to extract hours, defaulting to 0.25 for very short items if not stated
  - Instructions to extract a task category, best-matching from the list
  - Instructions to extract any remaining text as notes

- Expected response format:
```json
{
  "clientName": "Meriton Group",
  "projectName": "Bondi Tower",
  "task": "Contract Review",
  "hours": 2.5,
  "billable": true,
  "notes": "Reviewed head contract clause 37 re EOT entitlements",
  "confidence": "high"
}
```

- If confidence is "low" (ambiguous client, no clear hours), the UI should highlight the uncertain fields in amber for user review.
- If no client matches, show a dropdown to select manually.
- If a new project name is mentioned that doesn't exist, offer to create it.

**Fallback:** If Claude API fails or is slow, show the manual entry form (dropdowns for client, project, task + hours input + notes).

### 4.2 Manual Entry (Fallback / Alternative)

Standard form with:
- Client dropdown (grouped by active/inactive)
- Project dropdown (filtered by selected client)
- Task category dropdown
- Hours input (number, step 0.25, min 0.25)
- Billable toggle (default: on)
- Notes text input
- Date picker (default: today)
- Submit button

### 4.3 Timer Mode

- Start/stop button that tracks elapsed time.
- When stopped, converts elapsed seconds to hours rounded to 0.25.
- Pre-fills the hours field.
- User still needs to select/confirm client, project, task.
- Timer persists if user switches tabs within the app.

### 4.4 Client & Project Management

**Clients tab:**
- Add client: name, contact name, email, hourly rate
- Edit client (inline)
- Archive client (soft delete — set status to "inactive", hide from dropdowns but preserve data)
- Each client has a sub-list of projects

**Projects (nested under each client):**
- Add project: name
- Set project status: active / completed / on-hold
- Only active projects appear in time entry dropdowns

### 4.5 Timesheet View

- Default view: current month, all clients
- Filters: month picker, client dropdown, project dropdown, billable/non-billable toggle
- Table columns: Date, Client, Project, Task, Hours, Billable (✓/✗), Amount, Notes, Actions (edit/delete)
- Sorted by date descending (most recent first)
- Summary row at top: total hours, billable hours, non-billable hours, total billable amount
- Inline edit: click a row to edit any field
- Delete: with confirmation

### 4.6 Invoice Generation

**Flow:**
1. User navigates to Invoices tab
2. Selects month and client
3. App shows all BILLABLE entries for that client/month, grouped by project
4. User clicks "Generate Invoice"
5. App creates an invoice object with:
   - Auto-generated invoice number: `INV-YYYY-MM-NNN` (sequential per month)
   - Line items grouped by project, then by task
   - Subtotal, GST (10%), Total
   - Due date = invoice creation date + payment terms days
6. Invoice is saved with status "draft"

**Invoice display (on-screen, printable via browser):**
```
┌─────────────────────────────────────────────┐
│  [LOGO]  PiRisk Management                  │
│  ABN: 12 345 678 901                        │
│  Northern Beaches, Sydney NSW               │
│  allerick@pirisk.com.au | +61 401 805 618   │
├─────────────────────────────────────────────┤
│  INVOICE                                     │
│  Invoice #: INV-2025-04-001                  │
│  Date: 1 May 2025                            │
│  Due: 31 May 2025                            │
│  Payment Terms: Net 30                       │
├─────────────────────────────────────────────┤
│  Bill To:                                    │
│  Meriton Group                               │
│  John Smith                                  │
│  john@meriton.com.au                         │
├─────────────────────────────────────────────┤
│  BONDI TOWER                                 │
│  ┌──────────┬──────────┬───────┬───────────┐ │
│  │ Date     │ Task     │ Hours │ Amount    │ │
│  ├──────────┼──────────┼───────┼───────────┤ │
│  │ 03/04/25 │ Contract │ 2.5   │ $687.50   │ │
│  │          │ Review   │       │           │ │
│  │ 07/04/25 │ EOT      │ 4.0   │ $1,100.00 │ │
│  │          │ Assess.  │       │           │ │
│  └──────────┴──────────┴───────┴───────────┘ │
│                                              │
│  MASCOT STAGE 2                              │
│  ┌──────────┬──────────┬───────┬───────────┐ │
│  │ ...      │ ...      │ ...   │ ...       │ │
│  └──────────┴──────────┴───────┴───────────┘ │
├─────────────────────────────────────────────┤
│                    Subtotal:    $5,500.00    │
│                    GST (10%):     $550.00    │
│                    TOTAL:       $6,050.00    │
├─────────────────────────────────────────────┤
│  Bank Details:                               │
│  BSB: 000-000  Account: 12345678             │
│  Account Name: PiRisk Management             │
│  Bank: [Bank Name]                           │
│  Reference: INV-2025-04-001                  │
└─────────────────────────────────────────────┘
```

**Invoice status management:**
- Draft → Sent (manual toggle, user marks when emailed)
- Sent → Paid (manual toggle, user marks when payment received, records paid date)
- Sent → Overdue (automatic — if current date > due date and not paid)
- Show overdue invoices prominently in dashboard

### 4.7 Dashboard

**Top-level metrics (current month):**
- Total hours logged
- Billable hours
- Non-billable hours
- Billable amount ($)
- Utilisation rate (billable hours / total hours × 100%)
- Non-billable leakage ($ value of non-billable hours at each client's rate)

**Charts (use Recharts):**
1. **Revenue by client** (bar chart, current month)
2. **Hours by project** (bar chart, current month)
3. **Monthly revenue trend** (line chart, last 6 months)
4. **Billable vs non-billable split** (bar chart, stacked, last 3 months)

**Outstanding invoices:**
- List of all unpaid invoices (sent + overdue)
- Show: invoice number, client, amount, due date, days overdue (if applicable)
- Overdue invoices highlighted in red
- Total outstanding amount

---

## 5. UI / UX Design Direction

**Aesthetic:** Industrial-utilitarian. This is a tool for someone on construction sites — it should feel sturdy, functional, and fast. Not corporate SaaS, not playful. Think dark nav, clean white content areas, bold type, high contrast.

**Typography:**
- Headings: "Outfit" (Google Fonts) — geometric, sturdy, modern
- Body: "Source Sans 3" — highly readable, professional
- Monospace (numbers/amounts): "JetBrains Mono"

**Colour palette:**
- Primary: `#0A1628` (dark navy — nav, headers)
- Accent: `#E8590C` (construction orange — CTAs, active states)
- Success: `#2B8A3E` (green — paid, billable)
- Warning: `#E67700` (amber — overdue, low confidence)
- Danger: `#C92A2A` (red — delete, errors)
- Surface: `#FFFFFF` (cards)
- Background: `#F1F3F5` (page background)
- Muted text: `#868E96`
- Border: `#DEE2E6`

**Layout:**
- Fixed top bar with app name and key stats (today's hours, this month's revenue)
- Tab navigation below: Log Time | Timesheet | Invoices | Dashboard | Clients | Settings
- Content area below tabs
- Mobile-responsive (the user may use this on a phone at a construction site)

**Key UX details:**
- The "Log Time" tab should be the default/home view
- The smart input field should be LARGE and prominent — it's the primary interaction
- After AI parsing, show a confirmation card with all parsed fields. Use colour coding:
  - Green border = high confidence match
  - Amber border = low confidence / needs review
  - Red border = no match found
- One-tap confirm to save the entry
- Toast notifications for saves, errors
- All money amounts in AUD, formatted with $ and commas
- All dates in Australian format (DD/MM/YYYY) for display, ISO for storage

---

## 6. Technical Implementation Notes

### 6.1 React Artifact Constraints
- Single .jsx file (all components in one file)
- No separate CSS files — use inline styles or a styles object
- Available libraries: React (with hooks), Recharts, lucide-react, lodash, d3
- Storage: `window.storage` API (get, set, delete, list) — all async, all need try/catch
- No localStorage/sessionStorage
- No external API calls except to `https://api.anthropic.com/v1/messages`

### 6.2 Storage Strategy
- Batch related data into single keys to minimise storage calls:
  - `pt-business` → single business profile object
  - `pt-clients` → array of all clients (with nested projects)
  - `pt-entries` → array of all time entries
  - `pt-invoices` → array of all invoices
- Load all data on app mount, hold in state, write-through on changes
- Show loading spinner until all storage reads complete

### 6.3 Claude API Integration
```javascript
const parseTimeEntry = async (text, clients) => {
  const clientContext = clients
    .filter(c => c.status === "active")
    .map(c => `- ${c.name} (projects: ${c.projects.filter(p => p.status === "active").map(p => p.name).join(", ")})`)
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a timesheet parser for a construction commercial consultant. Parse the user's natural language time entry into structured JSON.

ACTIVE CLIENTS AND PROJECTS:
${clientContext}

TASK CATEGORIES:
${TASK_CATEGORIES.join(", ")}

RULES:
- Fuzzy match client names (e.g. "Meriton" → "Meriton Group")
- Fuzzy match project names (e.g. "Bondi" → "Bondi Tower")
- Extract hours. If not stated, default to 0.25 for phone calls, 1.0 for meetings, leave null if truly unclear.
- Round hours to nearest 0.25.
- Best-match task to a category from the list.
- Detect non-billable signals: "don't bill", "non-billable", "no charge", "quick call", "internal", "admin".
- If non-billable signal detected, set billable to false.
- Extract remaining descriptive text as notes.
- Set confidence to "high" if client + hours are clear, "medium" if one is ambiguous, "low" if both are unclear.

Respond with ONLY a JSON object, no markdown fences, no explanation:
{
  "clientName": string or null,
  "projectName": string or null,
  "task": string,
  "hours": number or null,
  "billable": boolean,
  "notes": string,
  "confidence": "high" | "medium" | "low"
}`,
      messages: [{ role: "user", content: text }],
    }),
  });

  const data = await response.json();
  const text_content = data.content.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text_content.replace(/```json|```/g, "").trim());
};
```

### 6.4 Invoice Number Generation
- Format: `INV-YYYYMM-NNN`
- NNN = sequential within the month, across all clients
- On generation, scan existing invoices for the same month, find the max NNN, increment
- Example: `INV-202504-001`, `INV-202504-002`

### 6.5 GST Calculation
- GST = subtotal × 0.10
- Total = subtotal + GST
- Assume all services are GST-applicable (consultant is GST-registered)

### 6.6 Overdue Detection
- Run on every render of the invoices/dashboard view
- If invoice.status === "sent" && new Date() > new Date(invoice.dueDate) → display as overdue
- Do NOT auto-update the stored status (keep it as "sent" so the user can still mark paid)

---

## 7. Tab-by-Tab Component Breakdown

### Tab 1: Log Time (default)
- `SmartInput` — large text area with "What did you work on?" placeholder
- `ConfirmationCard` — shows parsed fields after AI returns, with edit capability
- `QuickStats` — today's entries (small list), today's total hours
- `TimerWidget` — start/stop timer, shows elapsed time, feeds hours into entry

### Tab 2: Timesheet
- `TimesheetFilters` — month picker, client dropdown, billable filter
- `TimesheetSummary` — total hours, billable hours, non-billable hours, amount
- `TimesheetTable` — sortable table of entries with inline edit/delete
- Entries grouped by date (date headers)

### Tab 3: Invoices
- `InvoiceGenerator` — month picker, client picker, preview of billable entries, generate button
- `InvoicePreview` — formatted invoice view (printable via Ctrl+P / browser print)
- `InvoiceList` — all generated invoices with status badges, toggle paid/sent

### Tab 4: Dashboard
- `MetricCards` — row of key metrics (hours, revenue, utilisation, leakage)
- `RevenueByClientChart` — Recharts bar chart
- `HoursByProjectChart` — Recharts bar chart
- `MonthlyTrendChart` — Recharts line chart
- `BillableBreakdownChart` — Recharts stacked bar
- `OutstandingInvoices` — list of unpaid, with overdue highlighting

### Tab 5: Clients
- `ClientList` — list of clients with expand/collapse for projects
- `ClientForm` — add/edit client (inline or modal)
- `ProjectList` — nested under each client, add/edit/archive projects

### Tab 6: Settings
- `BusinessProfileForm` — edit business details (name, ABN, bank, etc.)
- `DataManagement` — export all data as JSON, import, reset

---

## 8. Edge Cases to Handle

1. **Unknown client in voice entry** — show "Client not found" with a dropdown to select or create new
2. **Unknown project in voice entry** — offer to create a new project under the matched client
3. **No hours stated** — prompt user to enter hours manually, highlight the field
4. **Claude API timeout/failure** — fall back to manual form, show non-intrusive error
5. **Duplicate entry prevention** — if an entry with same client + project + task + hours + date exists within the last 5 minutes, warn before saving
6. **Invoice for month with no entries** — disable generate button, show message
7. **Client with no active projects** — prompt to add a project before logging time
8. **Non-billable entries on invoice view** — show them greyed out as "not included" so user has context, but exclude from totals
9. **Editing an entry that's already on an invoice** — warn the user that this will affect the invoice totals, suggest regenerating
10. **Month boundaries** — entry date is what determines which month an entry belongs to, not the timestamp it was logged

---

## 9. Future Integration Points (Do Not Build Yet)

These are noted for architectural awareness — design the data model to accommodate them but don't implement:

- **Xero sync:** Push invoices to Xero via API. Client objects should map to Xero Contact IDs. Invoice line items should map to Xero Invoice LineItems.
- **Stripe payments:** Add a "Pay Now" link to invoices. Not needed for construction clients who pay via bank transfer.
- **PDF export:** Generate proper PDF invoices. For now, browser print (Ctrl+P → Save as PDF) is sufficient.
- **Email integration:** Send invoices directly from the app.
- **Receipt/expense capture:** Photograph receipts and attach to entries.
- **Multi-user:** Currently single-user. Data model supports one business profile.

---

## 10. Acceptance Criteria

The app is complete when:

- [ ] User can dictate a time entry via Wispr Flow into a text field
- [ ] Claude API parses the text into client, project, task, hours, billable, notes
- [ ] Parsed entry shows a confirmation card with confidence indicators
- [ ] User can confirm, edit, or discard the parsed entry
- [ ] Manual entry form works as fallback
- [ ] Timer mode works (start/stop → hours)
- [ ] Clients can be added/edited/archived with multiple projects each
- [ ] Projects can be added/edited per client with active/completed/on-hold status
- [ ] Different hourly rates per client
- [ ] Entries flagged as billable or non-billable
- [ ] Timesheet view with filters, inline edit, delete
- [ ] Invoice generation per client per month with line items grouped by project
- [ ] Invoice shows business details, ABN, bank details, GST, payment terms
- [ ] Invoice status tracking: draft / sent / paid / overdue
- [ ] Dashboard shows: hours, revenue, utilisation, billable vs non-billable, outstanding invoices
- [ ] Charts render correctly with Recharts
- [ ] All data persists across sessions via window.storage
- [ ] App is mobile-responsive (usable on phone at a construction site)
- [ ] Graceful fallback when Claude API is unavailable
