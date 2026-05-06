"use client"

import Link from "next/link"
import { use, useState, useCallback, useEffect, useRef } from "react"
import {
  SAMPLE_INVOICES, SAMPLE_QB_ITEMS, SAMPLE_QB_CLASSES,
  formatCurrency, type SampleLineItem, type InvoiceStatus,
} from "@/lib/sample-data"
import { InvoicePreview, type PreviewLineItem } from "@/components/invoice/InvoicePreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

const LINE_ITEM_TYPES = [
  { value: "PERSON",            label: "Person"            },
  { value: "CREDIT",            label: "Credit"            },
  { value: "PRORATION",         label: "Pro-ration"        },
  { value: "EARLY_TERMINATION", label: "Early Termination" },
  { value: "BURST_HOURS",       label: "Burst Hours"       },
  { value: "OTHER",             label: "Other"             },
]

function subOneMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

function addOneMonth(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function toCycleEnd(serviceDate: string): string {
  const d = new Date(serviceDate + "T12:00:00")
  d.setMonth(d.getMonth() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function workingDays(start: string, end: string): number {
  if (!start || !end) return 0
  let count = 0
  const d = new Date(start + "T12:00:00")
  const endD = new Date(end + "T12:00:00")
  while (d <= endD) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

function shortDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T12:00:00")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${mm}/${dd}/${d.getFullYear()}`
}

function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function buildClientMessage(serviceDate: string): string {
  if (!serviceDate) return ""
  const start = new Date(serviceDate + "T12:00:00")
  const end   = new Date(serviceDate + "T12:00:00")
  end.setMonth(end.getMonth() + 1)
  end.setDate(end.getDate() - 1)
  const fmtStart = start.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const fmtEnd   = end.toLocaleDateString("en-US",   { month: "long", day: "numeric", year: "numeric" })
  return `Hikinex Subscription Services from ${fmtStart} to ${fmtEnd}`
}

export default function InvoiceWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const base = SAMPLE_INVOICES.find((inv) => inv.id === id) ?? SAMPLE_INVOICES[0]

  const [customer,      setCustomer]      = useState(base.customer)
  const [invoiceDate,   setInvoiceDate]   = useState(base.invoiceDate)
  const [lineItems,     setLineItems]     = useState<SampleLineItem[]>(() =>
    base.lineItems.map((li) => ({
      ...li,
      serviceDate: li.serviceDate ? addOneMonth(li.serviceDate) : addOneMonth(base.invoiceDate),
    }))
  )
  const [invoiceNumber,  setInvoiceNumber]  = useState(base.invoiceNumber)
  const [clientMessage, setClientMessage] = useState(() => {
    const svcDate = base.lineItems[0]?.serviceDate
      ? addOneMonth(base.lineItems[0].serviceDate)
      : addOneMonth(base.invoiceDate)
    return buildClientMessage(svcDate)
  })

  const lastClientMessage = buildClientMessage(base.lineItems[0]?.serviceDate ?? "")

  const lastMonthData = {
    invoiceDate:   subOneMonth(base.invoiceDate),
    customer:      base.customer,
    clientMessage: lastClientMessage || undefined,
    lineItems: base.lineItems.map<PreviewLineItem>((li) => ({
      id: li.id, description: li.description,
      quantity: li.quantity, unitPrice: li.unitPrice, amount: li.amount,
    })),
  }

  const currentMonthData = {
    invoiceDate,
    customer,
    clientMessage: clientMessage || undefined,
    lineItems: lineItems.map<PreviewLineItem>((li) => ({
      id: li.id, description: li.description,
      quantity: li.quantity, unitPrice: li.unitPrice, amount: li.amount,
    })),
  }

  const total = lineItems.reduce((s, li) => s + li.amount, 0)

  const addRow = useCallback((type: SampleLineItem["type"]) => {
    setLineItems((prev) => [...prev, {
      id: `new-${Date.now()}`, type, description: "",
      quantity: 1, unitPrice: 0, amount: 0,
      serviceDate: lineItems[0]?.serviceDate ?? addOneMonth(invoiceDate),
    }])
  }, [invoiceDate, lineItems])

  const updateRow = useCallback((index: number, field: keyof SampleLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev]
      const row = { ...next[index], [field]: value }
      if (field === "quantity" || field === "unitPrice") {
        row.amount = Number(row.quantity) * Number(row.unitPrice)
      }
      next[index] = row
      return next
    })
  }, [])

  const removeRow = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── Pro-rate calculator ──────────────────────────────────────────────────────
  const [calcRowIndex, setCalcRowIndex] = useState<number | null>(null)
  const [calcType,     setCalcType]     = useState<"ADD" | "CREDIT">("ADD")
  const [calcStart,    setCalcStart]    = useState("")
  const [calcEnd,      setCalcEnd]      = useState("")

  const calcItem       = calcRowIndex !== null ? lineItems[calcRowIndex] : null
  // Current cycle = service date → service date + 1 month - 1 day
  const calCycleStart  = calcItem?.serviceDate ?? ""
  const calCycleEnd    = calCycleStart ? toCycleEnd(calCycleStart) : ""
  // Previous cycle = one month before the service date
  const prevCycleStart = calCycleStart ? subOneMonth(calCycleStart) : ""
  const prevCycleEnd   = calCycleStart ? dayBefore(calCycleStart)   : ""

  // Which cycle does the entered start date fall in?
  const startInPrevCycle = !!(calcStart && prevCycleStart && calcStart >= prevCycleStart && calcStart < calCycleStart)
  const activeCycleStart = startInPrevCycle ? prevCycleStart : calCycleStart
  const activeCycleEnd   = startInPrevCycle ? prevCycleEnd   : calCycleEnd
  const calCycleDays     = workingDays(activeCycleStart, activeCycleEnd)
  const calPeriodDays    = workingDays(calcStart, calcEnd)
  const calQty           = calCycleDays > 0 ? Math.round((calPeriodDays / calCycleDays) * 10000) / 10000 : 0

  // Start can reach back into the previous cycle; end is capped by whichever cycle start landed in
  const validMin = prevCycleStart
  const validMax = calCycleEnd
  const endMax   = activeCycleEnd || calCycleEnd

  let calcError = ""
  if (calcStart && calcEnd && calcStart > calcEnd) {
    calcError = "Start date must be before end date."
  } else if (calcStart && validMin && calcStart < validMin) {
    calcError = `Start cannot be before ${shortDate(validMin)}.`
  } else if (calcEnd && endMax && calcEnd > endMax) {
    calcError = `End cannot be after ${shortDate(endMax)} — stays within one cycle. Add a second line for the next cycle.`
  }

  const openCalc = useCallback((index: number) => {
    setCalcRowIndex((prev) => (prev === index ? null : index))
    setCalcType("ADD")
    setCalcStart("")
    setCalcEnd("")
  }, [])

  const applyProRate = useCallback((action: "APPLY" | "NEW") => {
    if (calcRowIndex === null || !calcStart || !calcEnd || calCycleDays === 0) return
    const suffix = calcType === "ADD"
      ? `Prorated from ${shortDate(calcStart)} - ${shortDate(calcEnd)}`
      : `Credit ${shortDate(calcStart)}-${shortDate(calcEnd)}`

    if (action === "NEW") {
      // Create a new line item for the previous cycle, inherit product/rate/class from parent
      setLineItems((prev) => {
        const parent = prev[calcRowIndex]
        const newRow: SampleLineItem = {
          id:          `new-${Date.now()}`,
          type:        parent.type,
          description: suffix,
          quantity:    calQty,
          unitPrice:   parent.unitPrice,
          amount:      +(calQty * parent.unitPrice).toFixed(2),
          qbItem:      parent.qbItem,
          qbClass:     parent.qbClass,
          serviceDate: prevCycleStart,
        }
        return [...prev, newRow]
      })
    } else {
      // Update the existing row in place
      setLineItems((prev) => {
        const next = [...prev]
        const row  = { ...next[calcRowIndex] }
        row.quantity    = calQty
        row.amount      = +(calQty * row.unitPrice).toFixed(2)
        row.description = row.description ? `${row.description} | ${suffix}` : suffix
        next[calcRowIndex] = row
        return next
      })
    }

    setCalcRowIndex(null)
    setCalcStart("")
    setCalcEnd("")
  }, [calcRowIndex, calcType, calcStart, calcEnd, calCycleDays, calQty, prevCycleStart])

  // ── Unsaved-changes guard ────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const mounted = useRef(false)

  // Mark dirty on any editable state change, but skip the initial render
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    setIsDirty(true)
  }, [customer, invoiceDate, invoiceNumber, clientMessage, lineItems])

  // Warn on browser refresh / tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Intercept ALL in-app link clicks (covers sidebar nav) via capture phase
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]")
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href || href.startsWith("#")) return
      if (!window.confirm("You have unsaved changes. Leave this page?")) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [isDirty])

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="shrink-0 h-14 border-b bg-background flex items-center justify-between px-5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
            ← Dashboard
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold truncate">{customer}</span>
          <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_STYLES[base.status]}`}>
            {STATUS_LABELS[base.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="text-[11px] text-amber-500 font-medium">Unsaved changes</span>
          )}
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsDirty(false)}>Save Draft</Button>
          {base.status === "DRAFT" && (
            <Button variant="outline" size="sm" className="text-xs">Submit for Approval</Button>
          )}
          {base.status === "PENDING_APPROVAL" && (
            <Button variant="outline" size="sm" className="text-xs">Approve</Button>
          )}
          {(base.status === "APPROVED" || base.status === "EXPORTED") && (
            <Button size="sm" className="text-xs">Export CSV</Button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

          {/* Two side-by-side invoice previews */}
          <section className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Last Month{" "}
                <span className="text-[10px] font-normal normal-case tracking-normal opacity-60">— reference only</span>
              </p>
              <InvoicePreview data={lastMonthData} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                This Month{" "}
                <span className="text-[10px] font-normal normal-case tracking-normal opacity-60">— updates live</span>
              </p>
              <InvoicePreview data={currentMonthData} />
            </div>
          </section>

          <Separator />

          {/* Invoice details — compact inline strip */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Invoice Details</h2>
            <div className="flex gap-8 text-xs">
              <div className="flex-[2] min-w-0">
                <p className="text-[10px] text-muted-foreground mb-1">Customer</p>
                <Select value={customer} onValueChange={(v) => v && setCustomer(v)}>
                  <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Acme Corporation","Beta Technologies","Gamma LLC","Delta Partners","Echo Services"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 shrink-0">
                <p className="text-[10px] text-muted-foreground mb-1">Invoice #</p>
                <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="w-36 shrink-0">
                <p className="text-[10px] text-muted-foreground mb-1">Invoice Date</p>
                <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="flex-[3] min-w-0">
                <p className="text-[10px] text-muted-foreground mb-1">Client / Vendor Message</p>
                <Input className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0" value={clientMessage} onChange={(e) => setClientMessage(e.target.value)} />
              </div>
            </div>
          </section>

          <Separator />

          {/* Editable line items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line Items</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7">Paste from Excel</Button>
                <Select onValueChange={(v) => addRow(v as SampleLineItem["type"])}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue placeholder="+ Add row" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_ITEM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-max w-full text-xs">
                <thead className="border-b">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium w-36">Service Date</th>
                    <th className="text-left px-4 py-2.5 font-medium w-40">Product/Service</th>
                    <th className="text-left px-4 py-2.5 font-medium w-24">SKU</th>
                    <th className="text-left px-4 py-2.5 font-medium">Description</th>
                    <th className="text-right px-2 py-2.5 font-medium w-16">Qty</th>
                    <th className="text-right px-2 py-2.5 font-medium w-24">Rate</th>
                    <th className="text-right px-4 py-2.5 font-medium w-24">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium w-28">Class</th>
                    <th className="w-8 px-2"></th>
                    <th className="w-8 px-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((item, i) => {
                    const sku = SAMPLE_QB_ITEMS.find((qi) => qi.name === item.qbItem)?.sku ?? ""
                    return (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <Input
                            className="h-7 text-xs w-full border-0 shadow-none focus-visible:ring-0 bg-transparent px-0"
                            type="date"
                            value={item.serviceDate ?? ""}
                            onChange={(e) => updateRow(i, "serviceDate", e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <Select defaultValue={item.qbItem}>
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {SAMPLE_QB_ITEMS.map((qi) => (
                                <SelectItem key={qi.id} value={qi.name} className="text-xs">{qi.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {sku || <span className="italic opacity-40">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          <Textarea
                            className="text-xs border-0 shadow-none focus-visible:ring-0 bg-transparent px-0 w-full resize-none min-h-0 leading-snug"
                            rows={1}
                            value={item.description}
                            placeholder="Description"
                            onChange={(e) => {
                              e.target.style.height = "auto"
                              e.target.style.height = e.target.scrollHeight + "px"
                              updateRow(i, "description", e.target.value)
                            }}
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            className="w-full text-xs text-right bg-transparent outline-none cursor-text focus:text-blue-400"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRow(i, "quantity", Number(e.target.value))}
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            className="w-full text-xs text-right bg-transparent outline-none cursor-text focus:text-blue-400"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateRow(i, "unitPrice", Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Select defaultValue={item.qbClass}>
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                              {SAMPLE_QB_CLASSES.map((qc) => (
                                <SelectItem key={qc.id} value={qc.name} className="text-xs">{qc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => removeRow(i)}
                            className="text-muted-foreground hover:text-destructive text-base leading-none"
                          >×</button>
                        </td>
                        <td className="px-1 py-2.5">
                          <button
                            onClick={() => openCalc(i)}
                            title="Pro-rate calculator"
                            className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded transition-colors ${calcRowIndex === i ? "bg-teal-900 text-teal-300" : "text-muted-foreground hover:text-foreground"}`}
                          >%</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {lineItems.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No line items yet. Use "+ Add row" to start.
                </div>
              )}
            </div>

            {/* Pro-rate calculator panel */}
            {calcRowIndex !== null && calcItem && (
              <div className="mt-4 border-t pt-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Pro-Rate Calculator</span>
                  <button onClick={() => setCalcRowIndex(null)} className="text-muted-foreground hover:text-foreground text-base leading-none">×</button>
                </div>

                {/* Cycle reference */}
                <div className="flex gap-5 text-[11px]">
                  <span className={startInPrevCycle ? "text-muted-foreground/40" : "text-muted-foreground"}>
                    Current:&nbsp;
                    <span className={startInPrevCycle ? "" : "text-foreground font-medium"}>
                      {shortDate(calCycleStart)} – {shortDate(calCycleEnd)}
                    </span>
                    <span className="opacity-50 ml-1">({workingDays(calCycleStart, calCycleEnd)} days)</span>
                  </span>
                  <span className={startInPrevCycle ? "text-muted-foreground" : "text-muted-foreground/40"}>
                    Previous:&nbsp;
                    <span className={startInPrevCycle ? "text-foreground font-medium" : ""}>
                      {shortDate(prevCycleStart)} – {shortDate(prevCycleEnd)}
                    </span>
                    <span className="opacity-50 ml-1">({workingDays(prevCycleStart, prevCycleEnd)} days)</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <button
                    onClick={() => { setCalcType("ADD"); setCalcStart(""); setCalcEnd("") }}
                    className={`px-3 py-1 rounded font-medium transition-colors ${calcType === "ADD" ? "bg-teal-900/60 text-teal-300" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                  >Add</button>
                  <button
                    onClick={() => { setCalcType("CREDIT"); setCalcStart(""); setCalcEnd("") }}
                    className={`px-3 py-1 rounded font-medium transition-colors ${calcType === "CREDIT" ? "bg-amber-900/60 text-amber-300" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
                  >Credit</button>
                </div>

                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Start Date</p>
                    <Input
                      className="h-8 text-xs w-36"
                      type="date"
                      min={validMin}
                      max={validMax}
                      value={calcStart}
                      onChange={(e) => { setCalcStart(e.target.value); setCalcEnd("") }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      End Date
                      {calcStart && <span className="ml-1 opacity-50">(max {shortDate(endMax)})</span>}
                    </p>
                    <Input
                      className="h-8 text-xs w-36"
                      type="date"
                      min={calcStart || activeCycleStart}
                      max={endMax}
                      value={calcEnd}
                      onChange={(e) => setCalcEnd(e.target.value)}
                    />
                  </div>
                  {calcStart && calcEnd && !calcError && calCycleDays > 0 && (
                    <div className="pb-1 space-y-0.5">
                      <p className="text-muted-foreground">Period: <span className="text-foreground font-medium">{calPeriodDays} working days</span></p>
                      <p className="text-muted-foreground">Prorate QTY: <span className="text-foreground font-semibold">{calQty}</span> <span className="opacity-50">({calPeriodDays}/{calCycleDays})</span></p>
                      <p className="text-muted-foreground/70 italic">
                        {calcType === "ADD" ? `Prorated from ${shortDate(calcStart)} - ${shortDate(calcEnd)}` : `Credit ${shortDate(calcStart)}-${shortDate(calcEnd)}`}
                      </p>
                    </div>
                  )}
                </div>

                {calcError && (
                  <p className="text-red-400 text-[11px]">⚠ {calcError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm" variant="outline" className="text-xs h-7"
                    disabled={!calcStart || !calcEnd || calPeriodDays === 0 || !!calcError}
                    onClick={() => applyProRate("APPLY")}
                  >Apply to Row</Button>
                  <Button
                    size="sm" className="text-xs h-7"
                    disabled={!calcStart || !calcEnd || calPeriodDays === 0 || !!calcError}
                    onClick={() => applyProRate("NEW")}
                  >Create New Line</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCalcRowIndex(null)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-2 px-1">
              <div className="text-xs text-muted-foreground">
                Total <span className="font-semibold text-sm text-foreground ml-2">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {/* AI assist */}
          <section className="pb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Billing Assist</h2>
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Optional</span>
            </div>
            <div className="flex gap-2">
              <Textarea
                className="text-xs resize-none"
                rows={2}
                placeholder="Describe a billing change and AI will suggest line items…"
              />
              <Button variant="outline" size="sm" className="shrink-0 self-start text-xs">Suggest</Button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
