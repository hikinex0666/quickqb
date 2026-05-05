import Link from "next/link"
import { SAMPLE_INVOICES } from "@/lib/sample-data"
import { InvoicePreview, type InvoicePreviewData } from "@/components/invoice/InvoicePreview"
import { Button } from "@/components/ui/button"

export default async function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = SAMPLE_INVOICES.find((inv) => inv.id === id) ?? SAMPLE_INVOICES[0]

  const data: InvoicePreviewData = {
    invoiceNumber:    invoice.invoiceNumber,
    invoiceDate:      invoice.invoiceDate,
    serviceDateStart: invoice.serviceDateStart,
    serviceDateEnd:   invoice.serviceDateEnd,
    customer:         invoice.customer,
    clientMessage:    invoice.clientMessage,
    lineItems: invoice.lineItems.map((li) => ({
      id:          li.id,
      description: li.description,
      quantity:    li.quantity,
      unitPrice:   li.unitPrice,
      amount:      li.amount,
    })),
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <Link href={`/invoices/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Edit
        </Link>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <Button variant="outline" size="sm" className="text-xs">Submit for Approval</Button>
          )}
          {invoice.status === "PENDING_APPROVAL" && (
            <Button variant="outline" size="sm" className="text-xs">Approve</Button>
          )}
          {(invoice.status === "APPROVED" || invoice.status === "EXPORTED") && (
            <Button size="sm" className="text-xs">Export CSV</Button>
          )}
        </div>
      </div>

      <InvoicePreview data={data} />

      <div className="mt-4 rounded-lg border border-dashed bg-muted/30 px-5 py-3 text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-zinc-600">CSV export columns: </span>
        Date · Transaction Type · Num · Customer · Memo/Description · SKU · Product/Service · Qty · Sales Price · Class · Amount · A/R Paid · Service Date · Client/Vendor Message
      </div>

    </div>
  )
}
