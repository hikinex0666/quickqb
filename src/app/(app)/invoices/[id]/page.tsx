"use client"

import Link from "next/link"
import { use, useState, useCallback } from "react"
import {
  SAMPLE_INVOICES, SAMPLE_QB_ITEMS, SAMPLE_QB_CLASSES,
  formatCurrency, type SampleLineItem, type InvoiceStatus,
} from "@/lib/sample-data"
import { InvoicePreview, type PreviewLineItem } from "@/components/invoice/InvoicePreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function InvoiceWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const base = SAMPLE_INVOICES.find((inv) => inv.id === id) ?? SAMPLE_INVOICES[0]

  const [customer,         setCustomer]        = useState(base.customer)
  const [invoiceNumber,    setInvoiceNumber]   = useState(base.invoiceNumber)
  const [invoiceDate,      setInvoiceDate]     = useState(base.invoiceDate)
  const [serviceDateStart, setServiceStart]    = useState(base.serviceDateStart)
  const [serviceDateEnd,   setServiceEnd]      = useState(base.serviceDateEnd)
  const [clientMessage,    setClientMessage]   = useState(base.clientMessage ?? "")
  const [lineItems,        setLineItems]       = useState<SampleLineItem[]>(base.lineItems)

  const previewData = {
    invoiceNumber,
    invoiceDate,
    serviceDateStart,
    serviceDateEnd,
    customer,
    clientMessage: clientMessage || undefined,
    lineItems: lineItems.map<PreviewLineItem>((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      amount: li.amount,
    })),
  }

  const total = lineItems.reduce((s, li) => s + li.amount, 0)

  const addRow = useCallback((type: SampleLineItem["type"]) => {
    setLineItems((prev) => [...prev, {
      id: `new-${Date.now()}`, type, description: "",
      quantity: 1, unitPrice: 0, amount: 0,
    }])
  }, [])

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

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="shrink-0 h-14 border-b bg-background flex items-center justify-between px-5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
            ← Dashboard
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold truncate">{invoiceNumber}</span>
          <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_STYLES[base.status]}`}>
            {STATUS_LABELS[base.status]}
          </Badge>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="text-xs">Save Draft</Button>
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

      {/* ── Split workspace ── */}
      <div className="flex flex-1 items-start overflow-hidden min-h-0">

        {/* Left — QB data entry */}
        <div className="flex-[55] h-full overflow-y-auto border-r p-6 space-y-5 min-w-0">

          {/* Invoice header fields */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Customer</Label>
                <Select value={customer} onValueChange={(v) => v && setCustomer(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Acme Corporation","Beta Technologies","Gamma LLC","Delta Partners","Echo Services"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Invoice #</Label>
                <Input className="h-9" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Invoice Date</Label>
                <Input className="h-9" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Service Start</Label>
                <Input className="h-9" type="date" value={serviceDateStart} onChange={(e) => setServiceStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Service End</Label>
                <Input className="h-9" type="date" value={serviceDateEnd} onChange={(e) => setServiceEnd(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Client / Vendor Message</Label>
                <Input className="h-9" value={clientMessage} onChange={(e) => setClientMessage(e.target.value)} placeholder="Message shown on invoice…" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Line items */}
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

            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Description</th>
                    <th className="text-left px-3 py-2 font-medium w-28">Product/Service</th>
                    <th className="text-left px-3 py-2 font-medium w-24">Class</th>
                    <th className="text-right px-3 py-2 font-medium w-12">Qty</th>
                    <th className="text-right px-3 py-2 font-medium w-20">Rate</th>
                    <th className="text-right px-3 py-2 font-medium w-20">Amount</th>
                    <th className="w-6 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((item, i) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                            {item.type.replace("_", " ")}
                          </span>
                          <Input
                            className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 bg-transparent px-1 min-w-0"
                            value={item.description}
                            placeholder="Description"
                            onChange={(e) => updateRow(i, "description", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <Select defaultValue={item.qbItem}>
                          <SelectTrigger className="h-7 text-xs w-full">
                            <SelectValue placeholder="Item" />
                          </SelectTrigger>
                          <SelectContent>
                            {SAMPLE_QB_ITEMS.map((qi) => (
                              <SelectItem key={qi.id} value={qi.name} className="text-xs">{qi.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-1.5">
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
                      <td className="px-3 py-1.5">
                        <Input
                          className="h-7 text-xs text-right w-full"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateRow(i, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          className="h-7 text-xs text-right w-full"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateRow(i, "unitPrice", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => removeRow(i)}
                          className="text-muted-foreground hover:text-destructive text-base leading-none"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lineItems.length === 0 && (
                <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                  No line items yet. Use "+ Add row" to start.
                </div>
              )}
            </div>

            <div className="flex justify-end mt-2 px-1">
              <div className="text-xs text-muted-foreground">
                Total <span className="font-semibold text-sm text-foreground ml-2">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {/* AI assist */}
          <section>
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

        {/* Right — Live invoice preview */}
        <div className="flex-[45] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/20 p-5 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Live Preview</p>
          <InvoicePreview data={previewData} />
          <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
            Preview updates as you edit. CSV export will include all 14 QB import columns.
          </p>
        </div>

      </div>
    </div>
  )
}
