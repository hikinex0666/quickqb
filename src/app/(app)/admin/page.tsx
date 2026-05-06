"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function AdminPage() {
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("INV-2026-034")
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-lg font-semibold mb-1">Admin Settings</h1>
      <p className="text-xs text-muted-foreground mb-6">Global configuration for QuickQB.</p>

      <Separator className="mb-6" />

      <section className="space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice Numbering</h2>

        <div className="max-w-xs">
          <p className="text-xs text-muted-foreground mb-1.5">Next Invoice Number</p>
          <p className="text-[11px] text-muted-foreground/60 mb-2 leading-snug">
            Each new invoice is assigned this number, then it increments by 1 automatically.
          </p>
          <div className="flex gap-2">
            <Input
              className="h-8 text-sm w-48"
              value={nextInvoiceNumber}
              onChange={(e) => { setNextInvoiceNumber(e.target.value); setSaved(false) }}
              placeholder="INV-2026-001"
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
