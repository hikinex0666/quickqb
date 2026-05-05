import { formatCurrency, formatDate } from "@/lib/sample-data"
import { Separator } from "@/components/ui/separator"

const HIKINEX = {
  name: "Hikinex",
  address: "123 Business Parkway, Suite 400",
  city: "San Diego, CA 92101",
  phone: "(619) 555-0100",
  email: "billing@hikinex.com",
  website: "www.hikinex.com",
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export interface PreviewLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface InvoicePreviewData {
  invoiceNumber: string
  invoiceDate: string
  serviceDateStart: string
  serviceDateEnd: string
  customer: string
  clientMessage?: string
  lineItems: PreviewLineItem[]
}

export function InvoicePreview({ data }: { data: InvoicePreviewData }) {
  const subtotal = data.lineItems.reduce((s, li) => s + li.amount, 0)
  const dueDateStr = addDays(data.invoiceDate, 30)

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden text-sm">

      {/* Brand header */}
      <div className="bg-zinc-900 px-7 py-4 flex items-center justify-between">
        <div>
          <span className="text-white text-xl font-bold tracking-tight">{HIKINEX.name}</span>
          <p className="text-zinc-400 text-xs mt-0.5">{HIKINEX.website}</p>
        </div>
        <span className="text-zinc-300 text-2xl font-light tracking-widest">INVOICE</span>
      </div>

      <div className="px-7 py-5">

        {/* Company contact + metadata */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-zinc-600 space-y-0.5 text-xs leading-5">
            <p className="text-zinc-900 font-medium text-sm">{HIKINEX.name}</p>
            <p>{HIKINEX.address}</p>
            <p>{HIKINEX.city}</p>
            <p>{HIKINEX.phone}</p>
            <p>{HIKINEX.email}</p>
          </div>
          <div className="text-xs text-right">
            <table className="ml-auto">
              <tbody>
                {[
                  ["Invoice #", data.invoiceNumber],
                  ["Date",      formatDate(data.invoiceDate)],
                  ["Due Date",  formatDate(dueDateStr)],
                  ["Terms",     "Net 30"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="text-zinc-500 pr-5 pb-1">{label}</td>
                    <td className={`pb-1 ${label === "Invoice #" ? "font-semibold text-zinc-900" : "text-zinc-700"}`}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="mb-5" />

        {/* Bill To */}
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1.5">Bill To</p>
          <p className="text-zinc-900 font-semibold">{data.customer}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Account on file</p>
        </div>

        {/* Line items */}
        <table className="w-full text-xs mb-0">
          <thead>
            <tr className="bg-zinc-900 text-white">
              <th className="text-left px-3 py-2 font-medium rounded-tl">Description</th>
              <th className="text-right px-3 py-2 font-medium w-10">Qty</th>
              <th className="text-right px-3 py-2 font-medium w-20">Rate</th>
              <th className="text-right px-3 py-2 font-medium w-24 rounded-tr">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-zinc-400 italic">
                  No line items yet
                </td>
              </tr>
            ) : (
              data.lineItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                  <td className="px-3 py-2.5 text-zinc-800">{item.description || <span className="text-zinc-300 italic">—</span>}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-600">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-zinc-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mt-3 mb-5">
          <div className="w-48 text-xs">
            <div className="flex justify-between py-1 text-zinc-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-zinc-500">
              <span>Tax (0%)</span><span>{formatCurrency(0)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between py-1 font-semibold text-zinc-900">
              <span>Total</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-zinc-900">
              <span>Balance Due</span><span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Footer */}
        <div className="flex justify-between items-end text-xs text-zinc-500">
          <div className="space-y-0.5">
            <p>
              <span className="font-medium text-zinc-700">Service Period: </span>
              {formatDate(data.serviceDateStart)} – {formatDate(data.serviceDateEnd)}
            </p>
            {data.clientMessage && (
              <p>
                <span className="font-medium text-zinc-700">Note: </span>
                {data.clientMessage}
              </p>
            )}
          </div>
          <p className="text-zinc-400 italic">Thank you for your business.</p>
        </div>

      </div>
    </div>
  )
}
