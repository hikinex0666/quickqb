import Link from "next/link"
import {
  SAMPLE_CUSTOMERS, SAMPLE_INVOICES,
  isDueThisWeek, daysUntilCycle, cycleCountdownLabel, cycleDateLabel,
  invoiceTotal, formatCurrency, formatDate,
  type SampleCustomer, type SampleInvoice, type InvoiceStatus,
} from "@/lib/sample-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT:            "bg-zinc-800/60 text-zinc-300 border-zinc-700",
  PENDING_APPROVAL: "bg-amber-950/60 text-amber-300 border-amber-800",
  APPROVED:         "bg-teal-950/60 text-teal-300 border-teal-800",
  EXPORTED:         "bg-green-950/60 text-green-300 border-green-800",
}
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:            "In Progress",
  PENDING_APPROVAL: "Needs Approval",
  APPROVED:         "Approved",
  EXPORTED:         "Sent to Client",
}

function weekLabel(): string {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${fmt(today)} – ${fmt(end)}, ${today.getFullYear()}`
}

function AccountRow({
  customer, invoice, days,
}: {
  customer: SampleCustomer
  invoice: SampleInvoice | undefined
  days: number
}) {
  const status = invoice?.status
  const total = invoice ? invoiceTotal(invoice) : null
  const urgency = days === 0 ? "border-l-red-400" : days === 1 ? "border-l-orange-300" : "border-l-transparent"

  return (
    <div className={`flex items-center gap-4 px-5 py-4 border-b last:border-b-0 border-l-4 ${urgency} hover:bg-muted/20 transition-colors`}>
      {/* Cycle countdown */}
      <div className="w-24 shrink-0 text-center">
        <p className="text-xs text-muted-foreground">{cycleDateLabel(customer.cycleDayOfMonth!)}</p>
        <p className={`text-xs font-medium mt-0.5 ${days === 0 ? "text-red-600" : days === 1 ? "text-orange-500" : "text-zinc-500"}`}>
          {cycleCountdownLabel(days)}
        </p>
      </div>

      <Separator orientation="vertical" className="h-10" />

      {/* Customer info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{customer.name}</span>
          {customer.requiresApproval && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Approval Required</span>
          )}
          {customer.hasSalesProgram && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Sales Program</span>
          )}
        </div>
        {invoice ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            {invoice.invoiceNumber} · {formatDate(invoice.serviceDateStart)} – {formatDate(invoice.serviceDateEnd)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">No invoice started for this cycle</p>
        )}
      </div>

      {/* Status + total */}
      <div className="flex items-center gap-4 shrink-0">
        {status ? (
          <>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </Badge>
            {total !== null && (
              <span className="text-sm font-medium w-24 text-right">{formatCurrency(total)}</span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">Not started</span>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0 flex gap-2">
        {status === "APPROVED" && (
          <Button variant="outline" size="sm" className="text-xs">Export CSV</Button>
        )}
        {invoice ? (
          <Button size="sm" className="text-xs" nativeButton={false} render={<Link href={`/invoices/${invoice.id}`} />}>
            {status === "DRAFT" ? "Continue" : status === "PENDING_APPROVAL" ? "Review" : "Open"}
          </Button>
        ) : (
          <Button size="sm" className="text-xs" nativeButton={false} render={<Link href="/invoices/inv1" />}>
            Start Invoice
          </Button>
        )}
      </div>
    </div>
  )
}

export default function QueuePage() {
  const invoiceByCustomer = Object.fromEntries(
    SAMPLE_INVOICES.map((inv) => [inv.customerId, inv])
  )

  const dueThisWeek = SAMPLE_CUSTOMERS
    .filter((c) => isDueThisWeek(c.cycleDayOfMonth))
    .map((c) => ({ customer: c, invoice: invoiceByCustomer[c.id], days: daysUntilCycle(c.cycleDayOfMonth!)! }))
    .filter((row) => row.invoice?.status !== "EXPORTED")
    .sort((a, b) => a.days - b.days)

  const done = SAMPLE_CUSTOMERS
    .filter((c) => isDueThisWeek(c.cycleDayOfMonth) && invoiceByCustomer[c.id]?.status === "EXPORTED")
    .map((c) => ({ customer: c, invoice: invoiceByCustomer[c.id]!, days: daysUntilCycle(c.cycleDayOfMonth!)! }))

  const unconfigured = SAMPLE_CUSTOMERS.filter((c) => c.cycleDayOfMonth === null)

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{weekLabel()}</p>
        </div>
        <Button variant="outline" size="sm">Export Batch CSV</Button>
      </div>

      {/* ── Due This Week ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Due This Week</h2>
          <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">{dueThisWeek.length}</span>
        </div>
        {dueThisWeek.length > 0 ? (
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
            {dueThisWeek.map(({ customer, invoice, days }) => (
              <AccountRow key={customer.id} customer={customer} invoice={invoice} days={days} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-5 py-6 text-center text-sm text-muted-foreground">
            No accounts due this week.
          </div>
        )}
      </div>

      {/* ── Done This Cycle ── */}
      {done.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">Done This Cycle</h2>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{done.length}</span>
          </div>
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden opacity-70">
            {done.map(({ customer, invoice, days }) => (
              <AccountRow key={customer.id} customer={customer} invoice={invoice} days={days} />
            ))}
          </div>
        </div>
      )}

      {/* ── Unconfigured ── */}
      {unconfigured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Unconfigured</h2>
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-medium">{unconfigured.length}</span>
          </div>
          <div className="rounded-lg border border-dashed bg-background overflow-hidden">
            {unconfigured.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0">
                <span className="text-sm text-muted-foreground flex-1">{c.name}</span>
                <span className="text-xs text-muted-foreground italic">No cycle date set</span>
                <Button variant="ghost" size="sm" className="text-xs" nativeButton={false} render={<Link href="/customers" />}>
                  Configure →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
