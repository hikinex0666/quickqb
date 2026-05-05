# QuickQB — Project Source of Truth

_Last updated: 2026-05-05 — Added: Dashboard landing page (replaces Queue), business-friendly status labels, dark-mode status badge styles_

---

## Purpose

QuickQB is an internal web app for building, reviewing, and exporting invoice data for QuickBooks. Each client account has a billing cycle date. Ops managers work from a weekly queue of accounts whose cycle date is coming up, prep the invoice data, and export a QuickBooks-compatible CSV that is imported directly into QB to create the invoices there.

**The primary output of Phase 1 is a QB-importable CSV file — not a finalized record inside QuickQB.**

**The primary UX is a weekly work queue** — not a generic invoice list. The app surfaces which accounts need attention this week based on each client's cycle date.

QuickQB handles the data-entry and review workflow. QuickBooks handles the actual invoicing, payment tracking, and accounting.

---

## UI Theme

- **Dark mode by default** — `dark` class applied to `<html>` globally; no light/dark toggle needed for MVP
- **Primary accent: teal** — used for buttons, active nav state, focus rings, and interactive highlights
- Status badge colors (amber, blue, green) are kept intentionally light/saturated for visibility on dark backgrounds
- The live invoice preview panel uses a white background — it represents the client-facing document, not the app UI

---

## Stack (Approved 2026-04-30)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (internal — Google SSO or email/password) |
| AI assist | Claude API (Anthropic) — optional, never on critical path |
| Hosting | Railway or Render |

---

## MVP Scope (Phase 1)

**In scope:**
- **Weekly account queue** as the home screen — surfaces accounts whose cycle date falls within the current week
- Per-customer cycle date (`cycleDayOfMonth`) drives queue visibility
- Clicking an account opens a **split workspace**: left = QB import data entry, right = live invoice preview
- Clone previous invoice as starting point for new invoice prep
- Service date auto-calculation: prev end date + 1 day → + 1 month, leap-year-aware
- Per-customer approval gate before export
- End-of-month renewal check warning for sales program customers
- Line item types enforced: PERSON, CREDIT, PRORATION, EARLY_TERMINATION, BURST_HOURS, OTHER
- One line item per person; description includes overtime days
- Paste-from-Excel into line items table
- **Export QB-importable CSV** — single invoice or full weekly batch
- Reference data import: QB items, customers, classes (CSV/Excel upload)
- Per-customer flags: `requires_approval`, `has_sales_program`, `cycleDayOfMonth`
- Basic internal auth
- AI billing assist — optional panel in editor; app fully functional without it

**Out of scope (Phase 1):**
- Payment tracking / paid date → Phase 2
- Direct QuickBooks API write-back → not planned
- Customer-facing portal → not planned
- Email notifications → not planned for MVP
- PDF export → deferred
- Role-based permissions beyond basic auth → deferred
- Audit log → deferred

---

## Final Database Schema

```prisma
model Customer {
  id               String    @id @default(cuid())
  name             String
  qbCustomerId     String?   @unique
  cycleDayOfMonth  Int?                             // day of month billing cycle falls (1–31)
  requiresApproval Boolean   @default(false)
  hasSalesProgram  Boolean   @default(false)
  opsManager       String?                          // assigned ops manager display name; drives dashboard filter
  invoices         Invoice[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Invoice {
  id               String        @id @default(cuid())
  customer         Customer      @relation(fields: [customerId], references: [id])
  customerId       String
  invoiceNumber    String        @unique
  invoiceDate      DateTime                        -- QB "Date" column; when invoice is issued
  serviceDateStart DateTime
  serviceDateEnd   DateTime
  clientMessage    String?                         -- QB "Client/Vendor Message" column
  status           InvoiceStatus @default(DRAFT)
  weekBatchDate    DateTime
  clonedFrom       Invoice?      @relation("InvoiceClones", fields: [clonedFromId], references: [id])
  clonedFromId     String?
  clones           Invoice[]     @relation("InvoiceClones")
  lineItems        LineItem[]
  approvedBy       String?
  approvedAt       DateTime?
  renewalCheckedAt DateTime?
  exportedAt       DateTime?
  createdBy        String
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

enum InvoiceStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  EXPORTED
}

model LineItem {
  id           String       @id @default(cuid())
  invoice      Invoice      @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  invoiceId    String
  type         LineItemType
  description  String                              -- QB "Memo/Description" column
  personName   String?
  overtimeDays Int?
  quantity     Decimal      @db.Decimal(10, 4)    -- QB "Qty" column
  unitPrice    Decimal      @db.Decimal(10, 2)    -- QB "Sales Price" column
  amount       Decimal      @db.Decimal(10, 2)    -- QB "Amount" column; stored, not derived
  qbItem       QBItem?      @relation(fields: [qbItemId], references: [id])
  qbItemId     String?                             -- maps to QB "Product/Service" + "SKU"
  qbClass      QBClass?     @relation(fields: [qbClassId], references: [id])
  qbClassId    String?                             -- QB "Class" column; at row level
  serviceDate  DateTime?                           -- QB "Service Date" column; falls back to Invoice.serviceDateStart if null
  sortOrder    Int
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

enum LineItemType {
  PERSON
  CREDIT
  PRORATION
  EARLY_TERMINATION
  BURST_HOURS
  OTHER
}

model QBItem {
  id          String     @id @default(cuid())
  qbItemId    String     @unique
  name        String                              -- QB "Product/Service" column
  sku         String?                             -- QB "SKU" column
  defaultRate Decimal?   @db.Decimal(10, 2)
  lineItems   LineItem[]
}

model QBClass {
  id        String     @id @default(cuid())
  qbClassId String     @unique
  name      String                               -- QB "Class" column; must match exactly
  lineItems LineItem[]
}

model ReferenceImport {
  id          String        @id @default(cuid())
  importedAt  DateTime      @default(now())
  importedBy  String
  sourceFile  String
  recordType  ReferenceType
  recordCount Int
}

enum ReferenceType {
  CUSTOMERS
  ITEMS
  CLASSES
  INVOICES
}
```

**Schema decisions:**
- `cycleDayOfMonth` on Customer — integer 1–31; drives weekly queue logic; nullable so accounts can be added before cycle date is confirmed
- `invoiceNumber` — plain numeric string (e.g. `"116137"`); unique across all invoices; auto-generated at clone/create by parsing the customer's previous invoice number as integer and adding 1; ops manager can override (DRAFT only)
- `opsManager` on Customer — stored as a display name string (not a FK to a User table in Phase 1); nullable; drives the dashboard filter so each manager can view only their accounts; Phase 2 can migrate to a proper User relation when auth is fully wired
- `amount` stored (not derived) — exported invoices are immutable records
- `onDelete: Cascade` on LineItem — deleting a DRAFT invoice cleans up its line items
- `clonedFromId` self-relation — full clone chain is queryable
- `renewalCheckedAt` on Invoice — records when ops manager confirmed renewal check
- `exportedAt` timestamps when CSV was generated; status moves to EXPORTED
- `invoiceDate` on Invoice is distinct from service dates — it is the date QB puts on the invoice header
- `clientMessage` on Invoice maps to QB's "Client/Vendor Message" field
- `qbClassId` on LineItem (not Invoice) — the real QB format confirmed class is at row level
- `serviceDate` on LineItem is optional — falls back to `Invoice.serviceDateStart` at export time if null
- `sku` on QBItem — needed for the QB "SKU" column in export
- Customer flags are data-driven, toggled per customer without a deploy

---

## Invoice Status Workflow

```
            ┌──────────────────────────────────┐
            │                                  │
   create   ▼    submit (requires_approval)    │
  ──────► DRAFT ───────────────────────────► PENDING_APPROVAL
            │                                         │
            │ submit (!requires_approval)             │ approve
            │                                         ▼
            └────────────────────────────────────► APPROVED
                                                      │
                                                      │ export CSV
                                                      ▼
                                                  EXPORTED
```

**State rules:**
| Status | Editable | Deletable | Actions available |
|---|---|---|---|
| DRAFT | Yes | Yes | Submit, Delete |
| PENDING_APPROVAL | No | No | Approve (record approver name) |
| APPROVED | No | No | Export CSV (single), Export Batch |
| EXPORTED | No | No | Clone only, Re-export CSV |

- Deletion only allowed on DRAFT
- Export requires: status = APPROVED; if `hasSalesProgram`, `renewalCheckedAt` must be set
- Approval records `approvedBy` (name string) and `approvedAt`
- Re-export is allowed on EXPORTED invoices (idempotent — same CSV regenerated)
- Exporting sets `exportedAt` and transitions status to EXPORTED

---

## QB CSV Export Requirements

The CSV export must match the confirmed row-based QuickBooks import format. One CSV row per line item. Invoice number repeats across all rows belonging to the same invoice.

**Confirmed column order:**
```
Date | Transaction Type | Num | Customer | Memo/Description | SKU | Product/Service | Qty | Sales Price | Class | Amount | A/R Paid | Service Date | Client/Vendor Message
```

**Stored vs derived at export time:**

| QB Column | Source | How |
|---|---|---|
| Date | `Invoice.invoiceDate` | Stored |
| Transaction Type | — | Hardcoded `"Invoice"` |
| Num | `Invoice.invoiceNumber` | Stored |
| Customer | `Customer.name` | Joined via `Invoice.customerId` |
| Memo/Description | `LineItem.description` | Stored |
| SKU | `QBItem.sku` | Joined via `LineItem.qbItemId` |
| Product/Service | `QBItem.name` | Joined via `LineItem.qbItemId` |
| Qty | `LineItem.quantity` | Stored |
| Sales Price | `LineItem.unitPrice` | Stored |
| Class | `QBClass.name` | Joined via `LineItem.qbClassId` |
| Amount | `LineItem.amount` | Stored |
| A/R Paid | — | Always blank |
| Service Date | `LineItem.serviceDate` | Stored per row; falls back to `Invoice.serviceDateStart` if null |
| Client/Vendor Message | `Invoice.clientMessage` | Stored; written on first row of each invoice only |

**Export behavior:**
- One CSV row per line item; invoice number (`Num`) repeats for multi-row invoices
- Single export: all line items for one invoice, ordered by `sortOrder`
- Batch export: all APPROVED invoices for a selected week, grouped by invoice, ordered by `sortOrder` within each
- Filename: `quickqb-export-[batch-date].csv` (batch) or `quickqb-[invoiceNumber].csv` (single)
- `Client/Vendor Message` written only on the first row of each invoice group; blank on subsequent rows

**Pre-export validation (block export if any fail):**
- All line items must have `qbItemId` set — Product/Service is required by QB
- Customer name must match a known QB customer (enforced by reference data)
- If `qbClassId` is set, class name must match a known QB class
- `Invoice.invoiceDate` must be set

**Open question — still to confirm:**
- Does QB treat `Client/Vendor Message` on first row only, or does it need to repeat on every row?

---

## Page / Screen Map

```
/                              → redirect → /dashboard
/login                         → Auth (NextAuth)
/dashboard                     → Screen 1: Dashboard (billing overview + invoice table)
/invoices/[id]                 → Screen 2: Invoice Workspace (split layout)
/invoices/[id]/preview         → Screen 2b: Full-screen Invoice Preview + Export (optional standalone)
/customers                     → Screen 3: Customer Settings
/reference                     → Screen 4: Reference Data & Imports
```

**Screen 1 — Dashboard** _(home screen)_
- Header: "Dashboard" title + current billing month label
- **Ops Manager filter** (top-right of page): dropdown to show all managers or one specific manager; filters both the summary cards and the invoice table
- **Summary cards (4):** Due This Week (with total $), Coming Up (next week count), Needs Approval (count + customer names), Sent to Client (count + total); all scoped to the current filter
- **Invoice table:** all invoices sorted by urgency (Needs Approval → In Progress → Approved → Sent to Client)
  - Columns: Billing Date (with cycle-date urgency badge), Account (with Approval Required flag), **Ops Manager**, Amount, Status, Action
- Ops manager opens the app and immediately sees: what needs attention now, what is coming up, and current state of all invoices

**Status display labels (business-friendly):**
| Internal status | Display label |
|---|---|
| DRAFT | In Progress |
| PENDING_APPROVAL | Needs Approval |
| APPROVED | Approved |
| EXPORTED | Sent to Client |

**Screen 2 — Invoice Workspace** _(split layout)_
- **Left panel — QB Data Entry:**
  - Invoice header fields: invoice number, invoice date, service dates (auto-filled, editable), week batch, client/vendor message
  - Line items table: type, person name, description, qty, unit price, Product/Service (QB item), Class, service date (per row), overtime days, amount
  - Toolbar: Add Row (by type), Paste from Excel, Reorder
  - Running total (live)
  - AI assist panel (collapsed, hidden if key not set)
  - Footer: Save Draft, Submit / Approve / Export CSV (context-sensitive based on status)
- **Right panel — Live Invoice Preview:**
  - Branded Hikinex invoice layout, updates live as left panel changes
  - Shows all fields and line items as they will appear to the client
  - Read-only; no actions on the right panel itself
- Split is approximately 55% left / 45% right; right panel scrolls independently

**Screen 2b — Full-screen Invoice Preview + Export** _(optional, reached from workspace)_
- Same branded invoice layout as the right panel, but full-width
- Renewal check acknowledgement checkbox (shown only if `hasSalesProgram`)
- Footer actions: Back to Workspace | Submit for Approval | Export CSV

**Screen 3 — Customer Settings**
- List of all customers with QB customer ID
- Editable per-customer fields: **Ops Manager** (dropdown), Cycle Day of Month (number input, 1–31), Requires Approval (toggle), Has Sales Program (toggle)
- Link per row: View invoice history for this customer

**Screen 4 — Reference Data & Imports**
- Tabs: Items | Customers | Classes | Import History
- Upload button per tab: accepts CSV or Excel
- Table view of current reference data (read-only)
- Import history log: timestamp, who imported, file name, record count

---

## API Route Map

**Queue**
```
GET    /api/queue                            list accounts due this week (query: weekOf date)
                                             returns customers with cycleDayOfMonth in next 7 days
                                             + their current invoice status for this cycle
```

**Invoices**
```
GET    /api/invoices                         list (query: status, weekBatchDate, customerId)
POST   /api/invoices                         create new DRAFT
GET    /api/invoices/[id]                    get invoice + line items
PATCH  /api/invoices/[id]                    update header fields (DRAFT only)
DELETE /api/invoices/[id]                    delete (DRAFT only)
POST   /api/invoices/[id]/clone              clone → new DRAFT with next service dates
POST   /api/invoices/[id]/submit             DRAFT → PENDING_APPROVAL or APPROVED
POST   /api/invoices/[id]/approve            PENDING_APPROVAL → APPROVED (body: approvedBy)
POST   /api/invoices/[id]/renewal-check      record renewalCheckedAt on invoice
GET    /api/invoices/[id]/export             generate + download QB CSV for single invoice
                                             sets exportedAt, status → EXPORTED
```

**Batch Export**
```
GET    /api/invoices/export-batch            query: weekBatchDate
                                             generates single CSV for all APPROVED invoices
                                             in the batch; sets exportedAt on each
```

**Line Items**
```
POST   /api/invoices/[id]/line-items             add line item
PATCH  /api/invoices/[id]/line-items/[lid]       update line item
DELETE /api/invoices/[id]/line-items/[lid]       delete line item
POST   /api/invoices/[id]/line-items/reorder     update sortOrder (body: ordered id array)
POST   /api/invoices/[id]/line-items/paste       parse pasted Excel rows → preview; client confirms
```

**Customers**
```
GET    /api/customers                        list all
PATCH  /api/customers/[id]                   update cycleDayOfMonth, requiresApproval, hasSalesProgram
```

**Reference**
```
GET    /api/reference/items                  list QB items
GET    /api/reference/classes                list QB classes
POST   /api/reference/import                 upload CSV/Excel → parse → upsert reference rows
GET    /api/reference/imports                import history log
```

**AI Assist (optional)**
```
POST   /api/ai-assist                        body: { description: string, customerId: string }
                                             returns: suggested LineItem[] or 501 if unconfigured
```

---

## Exact Sample Data Request to Laura / Team

**CSV export format: confirmed** — real QB import sample received. Column order and row structure are known (see QB CSV Export Requirements above).

**Still needed from Laura:**

| # | What to request | Columns needed | Purpose |
|---|---|---|---|
| 1 | All invoices from the previous month | Use real QB export if possible: Date, Num, Customer, Memo/Description, SKU, Product/Service, Qty, Sales Price, Class, Amount, Service Date | Primary seed data; clone source; also validates our export matches real QB output |
| 2 | QB Items list | Item name, SKU, default rate | Seeds `QBItem` table including SKU field |
| 3 | QB Customers list | Customer name, QB customer ID | Seeds `Customer` table |
| 4 | QB Classes list | Class name, QB class ID | Seeds `QBClass` table |
| 5 | One invoice with a credit line item | Same export format as #1 | Confirms sign convention for credits (negative amount or separate item?) |
| 6 | One invoice with pro-ration | Same export format as #1 | Confirms proration row format |
| 7 | Customers requiring approval before billing | Customer name | Sets `requiresApproval` flag on import |
| 8 | Customers with a sales program | Customer name | Sets `hasSalesProgram` flag on import |
| 9 | Billing cycle date per customer | Customer name + day of month (e.g. "15th") | Seeds `cycleDayOfMonth`; required for weekly queue to work |

**One remaining format question to confirm with Laura:**
- Does QB expect `Client/Vendor Message` on the first row of each invoice only, or repeated on every row?

---

## Recommended Order of Implementation

**Pass 1 — Foundation**
1. Scaffold: Next.js + TypeScript + Tailwind + shadcn/ui + Prisma + NextAuth
2. Prisma schema + initial migration
3. Seed script consuming Laura's exports
4. Prisma client singleton (`lib/db.ts`)
5. Date logic (`lib/dates.ts`): service date +1 month, leap year handling — with unit tests

**Pass 2 — Reference Data**
6. Screen 5: Reference Data & Imports (CSV upload → upsert items/customers/classes)
7. Screen 4: Customer Settings (toggle approval/sales program flags)

**Pass 3 — Core Invoice Flow**
8. Screen 1: Invoice Queue (list, filter, status badges)
9. Screen 2: Invoice Editor — manual line item entry
10. Service date auto-fill on new/clone
11. Clone invoice endpoint + button
12. Screen 3: Invoice Preview

**Pass 4 — Billing Rules + Export**
13. Paste-from-Excel (clipboard parse → preview → confirm)
14. Approval workflow: submit → pending → approve
15. Sales program renewal check gate on export
16. QB CSV export: single invoice + batch export
17. All invoice status transitions wired end-to-end

**Pass 5 — Polish + Optional**
18. Running totals, sort order, line item drag-to-reorder
19. Weekly batch view / filter on queue
20. AI assist panel (if API key available; no-op otherwise)

---

## Scaffold Plan (First Build Pass)

When approved, execute in this order:

1. `npx create-next-app@latest . --typescript --tailwind --app --eslint`
2. Install shadcn/ui: `npx shadcn@latest init`
3. Install Prisma: `npm install prisma @prisma/client` → `npx prisma init`
4. Install NextAuth: `npm install next-auth`
5. Write `prisma/schema.prisma` (full schema above)
6. Run `npx prisma migrate dev --name init`
7. Create folder structure (see below)
8. Add `lib/db.ts` — Prisma client singleton
9. Add `lib/dates.ts` — service date math stub
10. Add `lib/billing.ts` — approval/renewal check logic stub
11. Add `lib/export.ts` — QB CSV generation logic (format TBD pending Laura's template)
12. Add `lib/ai.ts` — Claude API wrapper (returns `null` if `ANTHROPIC_API_KEY` unset)
13. Add placeholder page components for all 5 screens
14. Add placeholder API route files for all route groups
15. Add `.env.example` with required keys

**Folder structure:**
```
quickqb/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx                    (Queue)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx                (Editor)
│   │   │       └── preview/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── reference/page.tsx
│   │   └── api/
│   │       ├── invoices/
│   │       │   ├── route.ts
│   │       │   ├── export-batch/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── clone/route.ts
│   │       │       ├── submit/route.ts
│   │       │       ├── approve/route.ts
│   │       │       ├── renewal-check/route.ts
│   │       │       ├── export/route.ts
│   │       │       └── line-items/
│   │       │           ├── route.ts
│   │       │           ├── reorder/route.ts
│   │       │           ├── paste/route.ts
│   │       │           └── [lid]/route.ts
│   │       ├── customers/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── reference/
│   │       │   ├── items/route.ts
│   │       │   ├── classes/route.ts
│   │       │   ├── import/route.ts
│   │       │   └── imports/route.ts
│   │       └── ai-assist/route.ts
│   ├── components/
│   │   ├── ui/                             (shadcn auto-generated)
│   │   ├── invoice/
│   │   │   ├── InvoiceTable.tsx
│   │   │   ├── LineItemRow.tsx
│   │   │   ├── LineItemPasteImport.tsx
│   │   │   └── InvoicePreview.tsx
│   │   └── shared/
│   │       ├── StatusBadge.tsx
│   │       └── PageHeader.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── dates.ts
│   │   ├── billing.ts
│   │   ├── export.ts
│   │   └── ai.ts
│   └── types/
│       └── invoice.ts
├── data/                                   (gitignored — Laura's exports go here)
│   └── .gitkeep
├── PROJECT.md
├── README.md
├── .env.example
└── package.json
```

---

## Rules / Logic

- **Cycle date queue**: an account appears in the weekly queue when its `cycleDayOfMonth` falls within the next 7 calendar days from today; accounts with no `cycleDayOfMonth` are shown separately as "Unconfigured"; already-EXPORTED accounts for the current cycle are shown collapsed at the bottom as "Done"
- **Cycle date edge cases**: day 29–31 — if the month doesn't have that day, use the last day of the month (same as service date math)
- **Service date**: `serviceDateEnd + 1 day` = new `serviceDateStart`; `serviceDateStart + 1 month` = new `serviceDateEnd`; leap-year-aware (e.g. Jan 31 → Feb 28/29)
- **Invoice date**: `invoiceDate` is the date placed on the QB invoice header (the "Date" column); set manually by ops manager, not auto-calculated
- **Invoice frequency**: weekly batch; `weekBatchDate` groups invoices by send week
- **Approval gate**: if `customer.requiresApproval`, invoice must pass through PENDING_APPROVAL → APPROVED before export is allowed
- **Sales program renewal**: if `customer.hasSalesProgram`, `renewalCheckedAt` must be set before export is allowed
- **Line items**: each of CREDIT, PRORATION, EARLY_TERMINATION, BURST_HOURS is its own row with its own `type`; PERSON rows carry `personName` and `overtimeDays`; every row must map to a QB Product/Service item
- **Class**: assigned per line item row (not per invoice); optional, but must match a known QB class name exactly if set
- **Service Date per row**: stored on `LineItem.serviceDate`; if null, export uses `Invoice.serviceDateStart`
- **Invoice number auto-generation**: at clone/create time, find the customer's most recent `invoiceNumber`, parse as integer, increment by 1 (e.g. `"116136"` → `"116137"`); if no previous invoice exists, ops manager enters the starting number manually; the field remains editable (DRAFT only) for corrections
- **Clone**: copies all header fields (including `invoiceDate`, `clientMessage`) with recalculated service dates; copies all line items as new rows; status starts as DRAFT; `invoiceNumber` is auto-incremented from the source invoice's number
- **Deletion**: only DRAFT invoices can be deleted
- **Export**: sets `exportedAt`, transitions status to EXPORTED; re-export is allowed (idempotent — same CSV regenerated)
- **CSV fidelity**: Customer name, Product/Service name, and Class name in the export must exactly match the corresponding QB reference records — validated before export is triggered

---

## Data Source for Building Invoices

The most recent invoice for each account (provided by Laura as a QB export) is the **baseline record** used for:
- **Cloning**: line items, descriptions, QB item mappings, rates, and class assignments are copied as the starting point for the next invoice
- **Structure reference**: the previous invoice defines what line items to expect (people on the account, standard adjustments, etc.)
- **Auto-numbering**: the previous invoice's number is used to compute the next invoice number (see Invoice Numbering below)

This baseline data will be imported once (via the Reference Data import screen) before ops managers begin building invoices for the first cycle.

---

## Inputs / Data Sources

| Source | Description | Status |
|---|---|---|
| Previous month's invoices | Export from Laura; **serves as clone baseline + seed data**; one invoice per active account | Pending |
| QB Items list | Item name, SKU, default rate | Pending |
| QB Customers list | Customer name, QB customer ID | Pending |
| QB Classes list | Class name, QB class ID | Pending |
| QB import CSV format | Column order and structure confirmed from real sample | **Done** |
| Ops manager input | Manual entry + Excel paste in UI | In scope |

---

## Current Status

- **Phase**: Pre-development — spec finalized with confirmed QB CSV format; awaiting scaffold approval
- **App**: Not yet built
- **Data**: QB CSV format confirmed; awaiting invoice/reference data exports from Laura

---

## Known Issues

- None yet

---

## Next Priorities

1. Get data exports from Laura: previous month's invoices, QB items (with SKU), customers, classes
2. Confirm `Client/Vendor Message` row behavior with Laura (first row only vs. repeats)
3. Approve scaffold step → begin Pass 1 build

---

## Open Questions

- Does QB expect `Client/Vendor Message` on the first row of each invoice only, or repeated on every row?
- What does "approval" look like in practice — who approves, is a name field sufficient or do we need a reason?
- What format does the Excel paste take (column order, headers present)?
- Phase 2: how will paid status be determined — manual entry in QuickQB, QB sync, or bank feed?

---

## Phase Roadmap

| Phase | Description |
|---|---|
| Phase 1 | MVP — invoice data entry, preview, QB-importable CSV export |
| Phase 2 | Payment tracking — identify paid invoices, record paid date |
