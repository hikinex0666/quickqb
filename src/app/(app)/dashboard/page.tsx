"use client"

import Link from "next/link"
import { useState } from "react"
import {
  SAMPLE_CUSTOMERS, SAMPLE_INVOICES, OPS_MANAGERS,
  isDueThisWeek, daysUntilCycle, invoiceTotal, formatCurrency, formatDate,
  type InvoiceStatus,
} from "@/lib/sample-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${mm}/${dd}/${d.getFullYear()}`
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:            "In Progress",
  PENDING_APPROVAL: "Needs Approval",
  APPROVED:         "Approved",
  EXPORTED:         "Sent to Client",
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT:            "bg-zinc-800/60 text-zinc-300 border-zinc-700",
  PENDING_APPROVAL: "bg-amber-950/60 text-amber-300 border-amber-800",
  APPROVED:         "bg-teal-950/60 text-teal-300 border-teal-800",
  EXPORTED:         "bg-green-950/60 text-green-300 border-green-800",
}

const ACTION_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:            "Continue",
  PENDING_APPROVAL: "Review",
  APPROVED:         "Export CSV",
  EXPORTED:         "View",
}

const STATUS_ORDER: Record<InvoiceStatus, number> = {
  PENDING_APPROVAL: 0,
  DRAFT:            1,
  APPROVED:         2,
  EXPORTED:         3,
}

function StatCard({ label, value, detail, accent = "border-l-zinc-700" }: {
  label: string
  value: string | number
  detail: string
  accent?: string
}) {
  return (
    <div className={`rounded-lg border bg-card px-5 py-4 border-l-4 ${accent}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{detail}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [opsFilter, setOpsFilter] = useState<string>("all")

  const customerById = Object.fromEntries(SAMPLE_CUSTOMERS.map((c) => [c.id, c]))
  const invoiceByCustomer = Object.fromEntries(SAMPLE_INVOICES.map((inv) => [inv.customerId, inv]))

  const visibleCustomers = SAMPLE_CUSTOMERS.filter(
    (c) => opsFilter === "all" || c.opsManager === opsFilter
  )
  const visibleCustomerIds = new Set(visibleCustomers.map((c) => c.id))
  const visibleInvoices = SAMPLE_INVOICES.filter((inv) => visibleCustomerIds.has(inv.customerId))

  // Summary stats scoped to current filter
  const thisWeekCustomers = visibleCustomers.filter((c) => isDueThisWeek(c.cycleDayOfMonth))
  const thisWeekInvoices  = thisWeekCustomers.map((c) => invoiceByCustomer[c.id]).filter(Boolean)
  const thisWeekTotal     = thisWeekInvoices.reduce((s, inv) => s + invoiceTotal(inv), 0)

  const nextWeekCustomers = visibleCustomers.filter((c) => {
    if (c.cycleDayOfMonth === null) return false
    const today = new Date()
    for (let i = 7; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      if (d.getDate() === c.cycleDayOfMonth) return true
    }
    return false
  })

  const needsApproval = visibleInvoices.filter((inv) => inv.status === "PENDING_APPROVAL")
  const sentToClient  = visibleInvoices.filter((inv) => inv.status === "EXPORTED")
  const sentTotal     = sentToClient.reduce((s, inv) => s + invoiceTotal(inv), 0)

  const sortedInvoices = [...visibleInvoices].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  )

  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Billing overview · {month}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-muted-foreground">Ops Manager</span>
          <Select value={opsFilter} onValueChange={(v) => v && setOpsFilter(v)}>
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="All Managers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Managers</SelectItem>
              {OPS_MANAGERS.map((name) => (
                <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Due This Week"
          value={thisWeekCustomers.length}
          detail={thisWeekInvoices.length > 0
            ? `${formatCurrency(thisWeekTotal)} across ${thisWeekInvoices.length} invoice${thisWeekInvoices.length !== 1 ? "s" : ""}`
            : "No invoices started yet"}
          accent="border-l-teal-500"
        />
        <StatCard
          label="Coming Up"
          value={nextWeekCustomers.length}
          detail={nextWeekCustomers.length > 0
            ? nextWeekCustomers.map((c) => c.name).join(", ")
            : "Nothing due next week"}
        />
        <StatCard
          label="Needs Approval"
          value={needsApproval.length}
          detail={needsApproval.length > 0
            ? needsApproval.map((inv) => inv.customer).join(", ")
            : "All invoices up to date"}
          accent={needsApproval.length > 0 ? "border-l-amber-500" : "border-l-zinc-700"}
        />
        <StatCard
          label="Sent to Client"
          value={sentToClient.length}
          detail={sentToClient.length > 0
            ? `${formatCurrency(sentTotal)} exported this cycle`
            : "No invoices sent yet"}
          accent={sentToClient.length > 0 ? "border-l-green-500" : "border-l-zinc-700"}
        />
      </div>

      {/* Invoice table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All Invoices
          {opsFilter !== "all" && (
            <span className="ml-2 normal-case font-normal text-muted-foreground/60">
              — {opsFilter}
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" className="text-xs">Export Batch CSV</Button>
      </div>
      <div className="rounded-lg border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left px-5 py-3 font-medium">Billing Date</th>
              <th className="text-left px-5 py-3 font-medium">Account</th>
              <th className="text-left px-5 py-3 font-medium">Ops Manager</th>
              <th className="text-right px-5 py-3 font-medium">Amount</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No invoices found
                  {opsFilter !== "all" && ` for ${opsFilter}`}.
                </td>
              </tr>
            ) : (
              sortedInvoices.map((inv) => {
                const customer = customerById[inv.customerId]
                const days = customer?.cycleDayOfMonth != null
                  ? daysUntilCycle(customer.cycleDayOfMonth)
                  : null

                return (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span>{fmtDate(inv.invoiceDate)}</span>
                        {days !== null && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded leading-none ${
                            days === 0
                              ? "bg-red-950/50 text-red-400"
                              : days === 1
                                ? "bg-orange-950/50 text-orange-400"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days}d`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inv.customer}</span>
                        {customer?.requiresApproval && (
                          <span className="text-[10px] bg-amber-950/40 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                            Approval Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {customer?.opsManager ?? (
                        <span className="italic text-muted-foreground/40">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                      {formatCurrency(invoiceTotal(inv))}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLES[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={inv.status === "PENDING_APPROVAL" ? "default" : "ghost"}
                        className="text-xs"
                        nativeButton={false}
                        render={<Link href={`/invoices/${inv.id}`} />}
                      >
                        {ACTION_LABELS[inv.status]}
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
