import Link from "next/link"
import { SAMPLE_INVOICES, invoiceTotal, formatCurrency, formatDate } from "@/lib/sample-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_STYLES: Record<string, string> = {
  DRAFT:            "bg-zinc-800/60 text-zinc-300 border-zinc-700",
  PENDING_APPROVAL: "bg-amber-950/60 text-amber-300 border-amber-800",
  APPROVED:         "bg-teal-950/60 text-teal-300 border-teal-800",
  EXPORTED:         "bg-green-950/60 text-green-300 border-green-800",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT:            "In Progress",
  PENDING_APPROVAL: "Needs Approval",
  APPROVED:         "Approved",
  EXPORTED:         "Sent to Client",
}

export default function InvoiceQueuePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Week of May 6, 2024</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export Batch CSV</Button>
          <Button size="sm" nativeButton={false} render={<Link href="/invoices/inv1" />}>
            New Invoice
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Service Period</TableHead>
              <TableHead>Line Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE_INVOICES.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {inv.customer}
                    {inv.status === "PENDING_APPROVAL" && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Needs Approval</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{inv.invoiceNumber}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(inv.serviceDateStart)} – {formatDate(inv.serviceDateEnd)}
                </TableCell>
                <TableCell className="text-sm">{inv.lineItems.length}</TableCell>
                <TableCell className="font-medium">{formatCurrency(invoiceTotal(inv))}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${STATUS_STYLES[inv.status]}`}
                  >
                    {STATUS_LABELS[inv.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/invoices/${inv.id}`} />}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/invoices/${inv.id}/preview`} />}>
                      Preview
                    </Button>
                    {inv.status === "APPROVED" && (
                      <Button variant="outline" size="sm">Export CSV</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
