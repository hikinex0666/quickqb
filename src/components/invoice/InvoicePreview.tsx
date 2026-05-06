import { formatCurrency, formatDate } from "@/lib/sample-data"
import { Separator } from "@/components/ui/separator"

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
  invoiceDate: string
  customer: string
  clientMessage?: string
  lineItems: PreviewLineItem[]
}

export function InvoicePreview({ data }: { data: InvoicePreviewData }) {
  const subtotal = data.lineItems.reduce((s, li) => s + li.amount, 0)
  const dueDateStr = addDays(data.invoiceDate, 30)

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden text-sm">

      {/* Header — Bill To + metadata */}
      <div className="px-7 py-5 flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1.5">Bill To</p>
          <p className="text-zinc-900 font-semibold text-base">{data.customer}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Account on file</p>
        </div>
        <div className="text-xs text-right">
          <table className="ml-auto">
            <tbody>
              {[
                ["Date",     formatDate(data.invoiceDate)],
                ["Due Date", formatDate(dueDateStr)],
                ["Terms",    "Net 30"],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="text-zinc-500 pr-5 pb-1">{label}</td>
                  <td className="pb-1 text-zinc-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Separator />

      <div className="px-7 py-5">

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
            {data.clientMessage && (
              <tr>
                <td colSpan={4} className="px-3 pt-3 pb-2 text-zinc-500 italic border-t border-zinc-100">
                  {data.clientMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mt-3 mb-5">
          <div className="text-xs flex items-center gap-3 font-semibold text-zinc-900">
            <span>Total</span><span>{formatCurrency(subtotal)}</span>
          </div>
        </div>


      </div>
    </div>
  )
}
