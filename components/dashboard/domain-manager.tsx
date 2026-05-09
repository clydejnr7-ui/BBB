"use client"

import { useState } from "react"
import { Globe, CheckCircle2, XCircle, Loader2, Trash2, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface DomainManagerProps {
  siteId: string
  initialDomain?: string | null
  initialVerified?: boolean
}

export function DomainManager({ siteId, initialDomain, initialVerified }: DomainManagerProps) {
  const [open, setOpen] = useState(false)
  const [domain, setDomain] = useState(initialDomain || "")
  const [savedDomain, setSavedDomain] = useState(initialDomain || "")
  const [verified, setVerified] = useState(initialVerified || false)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  async function saveDomain() {
    if (!domain.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to save domain"); return }
      setSavedDomain(data.domain)
      setDomain(data.domain)
      setVerified(false)
      toast.success("Domain saved! Now configure your DNS.")
    } finally {
      setSaving(false)
    }
  }

  async function verifyDomain() {
    setVerifying(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/domain/verify`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Verification failed"); return }
      setVerified(data.verified)
      if (data.verified) { toast.success(data.message) } else { toast.error(data.message) }
    } finally {
      setVerifying(false)
    }
  }

  async function removeDomain() {
    setRemoving(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to remove domain"); return }
      setSavedDomain("")
      setDomain("")
      setVerified(false)
      setOpen(false)
      toast.success("Custom domain removed")
    } finally {
      setRemoving(false)
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Globe className="mr-2 h-3 w-3" />
        {savedDomain ? (
          <span className="truncate">{savedDomain}</span>
        ) : (
          "Add Custom Domain"
        )}
        {savedDomain && (
          <Badge
            variant={verified ? "default" : "secondary"}
            className="ml-auto text-[10px] px-1 py-0"
          >
            {verified ? "Live" : "Pending"}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Custom Domain</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>

      {/* Domain input */}
      <div className="flex gap-2">
        <Input
          placeholder="yourdomain.com"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          className="text-sm h-8"
          onKeyDown={e => e.key === "Enter" && saveDomain()}
        />
        <Button size="sm" className="h-8 px-3" onClick={saveDomain} disabled={saving || !domain.trim()}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </Button>
      </div>

      {savedDomain && (
        <>
          {/* Status */}
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${verified ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}`}>
            {verified
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Domain is live at <strong>{savedDomain}</strong></>
              : <><XCircle className="h-3.5 w-3.5" /> DNS not verified yet</>
            }
          </div>

          {/* DNS Instructions */}
          {!verified && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                DNS Setup — do both steps
              </p>

              {/* Step 1: Vercel */}
              <div className="text-xs bg-background border rounded-lg p-3 space-y-1">
                <p className="font-semibold">Step 1 — Add domain in Vercel</p>
                <p className="text-muted-foreground">
                  Go to your{" "}
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    Vercel project → Settings → Domains
                  </a>
                  {" "}and add <strong>{savedDomain}</strong>
                </p>
              </div>

              {/* Step 2: DNS */}
              <div className="text-xs bg-background border rounded-lg p-3 space-y-3">
                <p className="font-semibold">Step 2 — Add a DNS record at your registrar</p>

                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Option A — CNAME (recommended for subdomains like www)</p>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                    <div className="bg-muted rounded px-2 py-1">Type: <strong>CNAME</strong></div>
                    <div className="bg-muted rounded px-2 py-1">Name: <strong>{savedDomain.startsWith("www.") ? "www" : "@"}</strong></div>
                    <div className="bg-muted rounded px-2 py-1 flex items-center justify-between gap-1">
                      <span className="truncate">cname.vercel-dns.com</span>
                      <button onClick={() => copyText("cname.vercel-dns.com")} className="shrink-0 text-primary hover:text-primary/70">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Option B — A record (for root domains)</p>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                    <div className="bg-muted rounded px-2 py-1">Type: <strong>A</strong></div>
                    <div className="bg-muted rounded px-2 py-1">Name: <strong>@</strong></div>
                    <div className="bg-muted rounded px-2 py-1 flex items-center justify-between gap-1">
                      <span>76.76.21.21</span>
                      <button onClick={() => copyText("76.76.21.21")} className="shrink-0 text-primary hover:text-primary/70">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-[11px]">DNS changes can take up to 48 hours to propagate.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={verifyDomain}
              disabled={verifying}
            >
              {verifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {verifying ? "Checking..." : "Verify DNS"}
            </Button>
            {verified && (
              <a
                href={`https://${savedDomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={removeDomain}
              disabled={removing}
            >
              {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
