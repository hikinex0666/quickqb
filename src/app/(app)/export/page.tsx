"use client"

import { useState, useMemo } from "react"
import {
  SAMPLE_INVOICES, SAMPLE_QB_ITEMS, SAMPLE_QB_CLASSES,
  formatCurrency, type InvoiceStatus,
} from "@/lib/sample-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT:            "In Progress",
  PENDING_APPROVAL: "Needs Approval",
  APPROVED:         "Approved",
  EXPORTED:         "Sent to Client",
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${mm}/${dd}/${d.getFullYear()}`
}

type ExportRow = {
  key:           string
  invoiceId:     string
  invoiceStatus: InvoiceStatus
  date:          string
  num:           string
  customer:      string
  description:   string
  sku:           string
  product:       string
  qty:           number
  salesPrice:    number
  amount:        number
  class:         string
  arPaid:        string
  serviceDate:   string
  clientMessage: string
}

function buildRows(): ExportRow[] {
  return SAMPLE_INVOICES.flatMap((inv) =>
    inv.lineItems.map((li, i) => {
      const sku = SAMPLE_QB_ITEMS.find((qi) => qi.name === li.qbItem)?.sku ?? ""
      return {
        key:           `${inv.id}-${li.id}`,
        invoiceId:     inv.id,
        invoiceStatus: inv.status,
        date:          inv.invoiceDate,
        num:           inv.invoiceNumber,
        customer:      inv.customer,
        description:   li.description,
        sku,
        product:       li.qbItem ?? "",
        qty:           li.quantity,
        salesPrice:    li.unitPrice,
        amount:        li.amount,
        class:         li.qbClass ?? "",
        arPaid:        "",
        serviceDate:   inv.serviceDateStart,
        clientMessage: i === 0 ? (inv.clientMessage ?? "") : "",
      }
    })
  )
}

const ALL_CUSTOMERS = [...new Set(SAMPLE_INVOICES.map((inv) => inv.customer))]
const ALL_PRODUCTS  = SAMPLE_QB_ITEMS.map((qi) => qi.name)
const ALL_CLASSES   = SAMPLE_QB_CLASSES.map((qc) => qc.name)
const ALL_STATUSES  = Object.keys(STATUS_LABELS) as InvoiceStatus[]

export default function ExportReviewPage() {
  const [rows,          setRows]          = useState<ExportRow[]>(buildRows)
  const [search,        setSearch]        = useState("")
  const [filterCustomer, setFilterCustomer] = useState("ALL")
  const [filterStatus,   setFilterStatus]   = useState("ALL")
  const [filterProduct,  setFilterProduct]  = useState("ALL")
  const [filterClass,    setFilterClass]    = useState("ALL")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      if (filterCustomer !== "ALL" && r.customer !== filterCustomer) return false
      if (filterStatus   !== "ALL" && r.invoiceStatus !== filterStatus) return false
      if (filterProduct  !== "ALL" && r.product !== filterProduct) return false
      if (filterClass    !== "ALL" && r.class !== filterClass) return false
      if (q && !r.customer.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.num.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, filterCustomer, filterStatus, filterProduct, filterClass])

  function updateRow(key: string, field: keyof ExportRow, value: string | number) {
    setRows((prev) => prev.map((r) => {
      if (r.key !== key) return r
      const updated = { ...r, [field]: value }
      if (field === "qty" || field === "salesPrice") {
        updated.amount = Number(updated.qty) * Number(updated.salesPrice)
      }
      return updated
    }))
  }

  const grandTotal = filtered.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 border-b bg-background px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold">QB Export Review</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and edit all line items before exporting to QuickBooks.</p>
        </div>
        <Button size="sm" className="text-xs shrink-0">Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b bg-background px-6 py-3 flex flex-wrap items-center gap-3">
        <Input
          className="h-8 w-48 text-xs"
          placeholder="Search customer, description, #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={filterCustomer} onValueChange={(v) => v && setFilterCustomer(v)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Customer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All customers</SelectItem>
            {ALL_CUSTOMERS.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterProduct} onValueChange={(v) => v && setFilterProduct(v)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Product/Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All products</SelectItem>
            {ALL_PRODUCTS.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterClass} onValueChange={(v) => v && setFilterClass(v)}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All classes</SelectItem>
            {ALL_CLASSES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {(search || filterCustomer !== "ALL" || filterStatus !== "ALL" || filterProduct !== "ALL" || filterClass !== "ALL") && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => { setSearch(""); setFilterCustomer("ALL"); setFilterStatus("ALL"); setFilterProduct("ALL"); setFilterClass("ALL") }}
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} row{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-wide">
              {["Date","Num","Customer","Status","Memo / Description","SKU","Product / Service","Qty","Sales Price","Class","Amount","A/R Paid","Service Date","Client/Vendor Message"].map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-medium whitespace-nowrap border-b border-zinc-700 first:sticky first:left-0 first:z-20">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-zinc-400 italic">No rows match the current filters.</td>
              </tr>
            )}
            {filtered.map((r, i) => (
              <tr key={r.key} className={i % 2 === 0 ? "bg-white hover:bg-zinc-50" : "bg-zinc-50 hover:bg-zinc-100"}>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">{fmtDate(r.date)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-500 font-mono">{r.num}</td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-800 font-medium">{r.customer}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    r.invoiceStatus === "APPROVED" ? "bg-teal-100 text-teal-700" :
                    r.invoiceStatus === "PENDING_APPROVAL" ? "bg-amber-100 text-amber-700" :
                    r.invoiceStatus === "EXPORTED" ? "bg-green-100 text-green-700" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>{STATUS_LABELS[r.invoiceStatus]}</span>
                </td>
                <td className="px-2 py-1.5 min-w-[200px] max-w-[280px]">
                  <Textarea
                    className="text-xs border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 w-full resize-none min-h-0 leading-snug"
                    rows={1}
                    value={r.description}
                    onChange={(e) => {
                      e.target.style.height = "auto"
                      e.target.style.height = e.target.scrollHeight + "px"
                      updateRow(r.key, "description", e.target.value)
                    }}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-400">{r.sku}</td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">{r.product}</td>
                <td className="px-2 py-2">
                  <input
                    className="w-16 text-xs text-right bg-transparent outline-none cursor-text focus:text-blue-500"
                    type="number"
                    value={r.qty}
                    onChange={(e) => updateRow(r.key, "qty", Number(e.target.value))}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className="w-20 text-xs text-right bg-transparent outline-none cursor-text focus:text-blue-500"
                    type="number"
                    value={r.salesPrice}
                    onChange={(e) => updateRow(r.key, "salesPrice", Number(e.target.value))}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-500">{r.class}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-zinc-900">{formatCurrency(r.amount)}</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-400">{fmtDate(r.serviceDate)}</td>
                <td className="px-3 py-2 text-zinc-400 max-w-[220px] truncate">{r.clientMessage}</td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                <td colSpan={10} className="px-3 py-2.5 text-xs text-muted-foreground">
                  {filtered.length} row{filtered.length !== 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2.5 text-right text-sm font-semibold text-zinc-900 whitespace-nowrap">
                  {formatCurrency(grandTotal)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
