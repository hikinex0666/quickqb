"use client"

import { useState } from "react"
import { SAMPLE_CUSTOMERS, OPS_MANAGERS, type SampleCustomer } from "@/lib/sample-data"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<SampleCustomer[]>(SAMPLE_CUSTOMERS)

  function toggle(id: string, field: "requiresApproval" | "hasSalesProgram") {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c))
    )
  }

  function setOpsManager(id: string, value: string) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, opsManager: value === "unassigned" ? null : value } : c))
    )
  }

  function setCycleDay(id: string, value: string) {
    const parsed = value === "" ? null : Math.min(31, Math.max(1, parseInt(value, 10)))
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cycleDayOfMonth: isNaN(parsed as number) ? null : parsed } : c))
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure per-customer billing rules</p>
      </div>

      <div className="rounded-lg border bg-background shadow-xs overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left px-6 py-3 font-medium">Customer</th>
              <th className="text-left px-6 py-3 font-medium">Ops Manager</th>
              <th className="text-left px-6 py-3 font-medium">QB Customer ID</th>
              <th className="text-center px-6 py-3 font-medium">Cycle Day</th>
              <th className="text-center px-6 py-3 font-medium">Requires Approval</th>
              <th className="text-center px-6 py-3 font-medium">Sales Program</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-muted/20">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{customer.name}</span>
                    {customer.requiresApproval && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        Approval Required
                      </Badge>
                    )}
                    {customer.hasSalesProgram && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Sales Program
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Select
                    value={customer.opsManager ?? "unassigned"}
                    onValueChange={(v) => v && setOpsManager(customer.id, v)}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs italic text-muted-foreground">Unassigned</SelectItem>
                      {OPS_MANAGERS.map((name) => (
                        <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                  {customer.qbCustomerId}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      className="h-8 w-16 text-center text-xs"
                      value={customer.cycleDayOfMonth ?? ""}
                      placeholder="—"
                      onChange={(e) => setCycleDay(customer.id, e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      id={`approval-${customer.id}`}
                      checked={customer.requiresApproval}
                      onCheckedChange={() => toggle(customer.id, "requiresApproval")}
                    />
                    <Label htmlFor={`approval-${customer.id}`} className="sr-only">
                      Requires Approval
                    </Label>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      id={`sales-${customer.id}`}
                      checked={customer.hasSalesProgram}
                      onCheckedChange={() => toggle(customer.id, "hasSalesProgram")}
                    />
                    <Label htmlFor={`sales-${customer.id}`} className="sr-only">
                      Has Sales Program
                    </Label>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Invoices
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
