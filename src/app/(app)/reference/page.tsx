import { SAMPLE_QB_ITEMS, SAMPLE_QB_CLASSES, SAMPLE_CUSTOMERS, SAMPLE_IMPORT_HISTORY, formatCurrency } from "@/lib/sample-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

const RECORD_TYPE_STYLES: Record<string, string> = {
  CUSTOMERS: "bg-blue-50 text-blue-700 border-blue-200",
  ITEMS: "bg-green-50 text-green-700 border-green-200",
  CLASSES: "bg-purple-50 text-purple-700 border-purple-200",
  INVOICES: "bg-orange-50 text-orange-700 border-orange-200",
}

export default function ReferencePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Reference Data</h1>
          <p className="text-sm text-muted-foreground mt-0.5">QuickBooks items, customers, and classes</p>
        </div>
        <Button size="sm">Import CSV / Excel</Button>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="mb-4">
          <TabsTrigger value="items">Items ({SAMPLE_QB_ITEMS.length})</TabsTrigger>
          <TabsTrigger value="customers">Customers ({SAMPLE_CUSTOMERS.length})</TabsTrigger>
          <TabsTrigger value="classes">Classes ({SAMPLE_QB_CLASSES.length})</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Product/Service Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Default Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_QB_ITEMS.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.sku ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {item.defaultRate != null ? formatCurrency(item.defaultRate) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Customer Name</TableHead>
                  <TableHead>QB Customer ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_CUSTOMERS.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.qbCustomerId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Class Name</TableHead>
                  <TableHead>QB Class ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_QB_CLASSES.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{cls.qbClassId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Imported By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_IMPORT_HISTORY.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.sourceFile}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${RECORD_TYPE_STYLES[entry.recordType]}`}>
                        {entry.recordType}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.recordCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.importedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(entry.importedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
