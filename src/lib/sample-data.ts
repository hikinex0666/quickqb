export type InvoiceStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "EXPORTED"
export type LineItemType = "PERSON" | "CREDIT" | "PRORATION" | "EARLY_TERMINATION" | "BURST_HOURS" | "OTHER"

export interface SampleLineItem {
  id: string
  type: LineItemType
  personName?: string
  description: string
  overtimeDays?: number
  quantity: number
  unitPrice: number
  amount: number
  qbItem?: string
  qbClass?: string
  serviceDate?: string
}

export interface SampleInvoice {
  id: string
  customerId: string
  invoiceNumber: string
  invoiceDate: string
  serviceDateStart: string
  serviceDateEnd: string
  status: InvoiceStatus
  weekBatchDate: string
  customer: string
  clientMessage?: string
  lineItems: SampleLineItem[]
}

export const OPS_MANAGERS: readonly string[] = [
  "Camille Bartolome",
  "Diana Mayugo",
  "Alyssa Catoy",
  "Anjali Katrodia",
  "Ashley Laguda",
  "Daniella Cruz",
  "Patricia Sifuentes",
  "Julia Goncalves",
]

export interface SampleCustomer {
  id: string
  name: string
  qbCustomerId: string
  cycleDayOfMonth: number | null
  requiresApproval: boolean
  hasSalesProgram: boolean
  opsManager: string | null
}

export const SAMPLE_CUSTOMERS: SampleCustomer[] = [
  { id: "c1", name: "Acme Corporation",   qbCustomerId: "QB-001", cycleDayOfMonth: 5,    requiresApproval: true,  hasSalesProgram: false, opsManager: "Ashley Laguda"     },
  { id: "c2", name: "Beta Technologies",  qbCustomerId: "QB-002", cycleDayOfMonth: 3,    requiresApproval: false, hasSalesProgram: true,  opsManager: "Camille Bartolome"  },
  { id: "c3", name: "Gamma LLC",          qbCustomerId: "QB-003", cycleDayOfMonth: null, requiresApproval: false, hasSalesProgram: false, opsManager: "Diana Mayugo"       },
  { id: "c4", name: "Delta Partners",     qbCustomerId: "QB-004", cycleDayOfMonth: 7,    requiresApproval: true,  hasSalesProgram: true,  opsManager: "Alyssa Catoy"       },
  { id: "c5", name: "Echo Services",      qbCustomerId: "QB-005", cycleDayOfMonth: 2,    requiresApproval: false, hasSalesProgram: false, opsManager: "Anjali Katrodia"    },
]

export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    id: "inv1",
    customerId: "c1",
    invoiceNumber: "INV-2026-031",
    invoiceDate: "2026-05-01",
    serviceDateStart: "2026-04-01",
    serviceDateEnd: "2026-04-30",
    status: "DRAFT",
    weekBatchDate: "2026-05-05",
    customer: "Acme Corporation",
    clientMessage: "April staffing services",
    lineItems: [
      { id: "li1", type: "PERSON", personName: "John Smith",  description: "Staff Augmentation — John Smith",          overtimeDays: 0, quantity: 160, unitPrice: 150, amount: 24000, qbItem: "Staff Augmentation", qbClass: "Engineering" },
      { id: "li2", type: "PERSON", personName: "Jane Doe",    description: "Staff Augmentation — Jane Doe (2 OT days)", overtimeDays: 2, quantity: 168, unitPrice: 150, amount: 25200, qbItem: "Staff Augmentation", qbClass: "Engineering" },
      { id: "li3", type: "BURST_HOURS",                       description: "Burst capacity — weekend surge",                             quantity:   8, unitPrice: 225, amount:  1800, qbItem: "Burst Hours",        qbClass: "Engineering" },
    ],
  },
  {
    id: "inv2",
    customerId: "c2",
    invoiceNumber: "INV-2026-032",
    invoiceDate: "2026-05-01",
    serviceDateStart: "2026-04-01",
    serviceDateEnd: "2026-04-30",
    status: "PENDING_APPROVAL",
    weekBatchDate: "2026-05-05",
    customer: "Beta Technologies",
    lineItems: [
      { id: "li4", type: "PERSON", personName: "Carlos Rivera", description: "Staff Augmentation — Carlos Rivera",         overtimeDays: 0, quantity: 160, unitPrice: 175, amount: 28000, qbItem: "Staff Augmentation", qbClass: "Design" },
      { id: "li5", type: "CREDIT",                              description: "Credit — billing adjustment April",                          quantity:   1, unitPrice: -500, amount:  -500, qbItem: "Credit",             qbClass: "Design" },
    ],
  },
  {
    id: "inv3",
    customerId: "c4",
    invoiceNumber: "INV-2026-033",
    invoiceDate: "2026-05-01",
    serviceDateStart: "2026-04-01",
    serviceDateEnd: "2026-04-30",
    status: "APPROVED",
    weekBatchDate: "2026-05-05",
    customer: "Delta Partners",
    lineItems: [
      { id: "li6", type: "PERSON", personName: "Sarah Kim", description: "Staff Augmentation — Sarah Kim (1 OT day)", overtimeDays: 1, quantity: 164, unitPrice: 200, amount: 32800, qbItem: "Staff Augmentation", qbClass: "Management" },
      { id: "li7", type: "PRORATION",                       description: "Pro-ration — partial month start",                           quantity:   1, unitPrice: 900, amount:   900, qbItem: "Pro-ration",         qbClass: "Management" },
    ],
  },
  {
    id: "inv4",
    customerId: "c5",
    invoiceNumber: "INV-2026-030",
    invoiceDate: "2026-05-01",
    serviceDateStart: "2026-04-01",
    serviceDateEnd: "2026-04-30",
    status: "EXPORTED",
    weekBatchDate: "2026-05-05",
    customer: "Echo Services",
    clientMessage: "April services — exported",
    lineItems: [
      { id: "li8", type: "PERSON", personName: "Mike Torres", description: "Staff Augmentation — Mike Torres", overtimeDays: 0, quantity: 160, unitPrice: 130, amount: 20800, qbItem: "Staff Augmentation", qbClass: "Operations" },
    ],
  },
]

export const SAMPLE_QB_ITEMS = [
  { id: "qi1", name: "Staff Augmentation",  sku: "SA-001", defaultRate: 150  },
  { id: "qi2", name: "Overtime Hours",       sku: "OT-001", defaultRate: 225  },
  { id: "qi3", name: "Burst Hours",          sku: "BH-001", defaultRate: 225  },
  { id: "qi4", name: "Credit",               sku: "CR-001", defaultRate: null },
  { id: "qi5", name: "Pro-ration",           sku: "PR-001", defaultRate: null },
  { id: "qi6", name: "Early Termination Fee",sku: "ET-001", defaultRate: null },
]

export const SAMPLE_QB_CLASSES = [
  { id: "qc1", name: "Engineering", qbClassId: "ENG" },
  { id: "qc2", name: "Design",      qbClassId: "DSN" },
  { id: "qc3", name: "Management",  qbClassId: "MGT" },
  { id: "qc4", name: "Operations",  qbClassId: "OPS" },
]

export const SAMPLE_IMPORT_HISTORY = [
  { id: "ih1", importedAt: "2026-04-15T10:30:00Z", importedBy: "laura@hikinex.com", sourceFile: "qb-customers-apr2026.csv", recordType: "CUSTOMERS", recordCount: 12 },
  { id: "ih2", importedAt: "2026-04-15T10:32:00Z", importedBy: "laura@hikinex.com", sourceFile: "qb-items-apr2026.csv",     recordType: "ITEMS",     recordCount: 6  },
  { id: "ih3", importedAt: "2026-04-15T10:33:00Z", importedBy: "laura@hikinex.com", sourceFile: "qb-classes-apr2026.csv",   recordType: "CLASSES",   recordCount: 4  },
]

// ── Queue helpers ──────────────────────────────────────────────────────────────

/** Returns how many days until a given day-of-month falls (within the next 7 days), or null if it doesn't. */
export function daysUntilCycle(cycleDayOfMonth: number): number | null {
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDate() === cycleDayOfMonth) return i
  }
  return null
}

export function isDueThisWeek(cycleDayOfMonth: number | null): boolean {
  if (cycleDayOfMonth === null) return false
  return daysUntilCycle(cycleDayOfMonth) !== null
}

export function cycleCountdownLabel(days: number): string {
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `in ${days} days`
}

/** Returns "May 5" style label for a cycle day in the current (or next) month. */
export function cycleDateLabel(cycleDayOfMonth: number): string {
  const today = new Date()
  const d = new Date(today.getFullYear(), today.getMonth(), cycleDayOfMonth)
  if (d < today) d.setMonth(d.getMonth() + 1)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ── Shared formatters ──────────────────────────────────────────────────────────

export function invoiceTotal(invoice: SampleInvoice): number {
  return invoice.lineItems.reduce((sum, li) => sum + li.amount, 0)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
