# QuickQB

Invoicing workflow and billing operations tool for ops managers.

Ops managers use QuickQB to build invoice data, preview it, and export a QuickBooks-compatible CSV that is imported directly into QB to create invoices. QuickQB handles the data-entry and review workflow; QuickBooks handles invoicing and accounting.

---

## Status

**Phase 1 — Spec updated (2026-04-30). Awaiting QB import template and data exports from Laura before scaffold begins.**

---

## Key Features (Phase 1)

- Build invoice data with per-customer billing rules
- Weekly invoice batching
- Per-client approval gates
- End-of-month sales program renewal checks
- Credits, pro-ration, early termination fees, and burst hours as separate line items
- One line item per person with overtime days in description
- Invoice preview before export
- **Export QB-importable CSV** — single invoice or full weekly batch
- Clone previous invoice
- Auto-calculate service dates (leap-year-aware)
- Paste-from-Excel support
- AI-assisted billing change logic (optional)

## Planned (Phase 2)

- Payment tracking and paid date recording

---

## Project Documentation

See [PROJECT.md](./PROJECT.md) for the full project source of truth, including scope, architecture notes, rules, open questions, and next priorities.
