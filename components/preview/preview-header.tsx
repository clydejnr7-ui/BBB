"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, ArrowLeft, Download, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"
import type { GeneratedSite } from "@/lib/types"

interface PreviewHeaderProps {
  site: GeneratedSite
}

export function PreviewHeader({ site }: PreviewHeaderProps) {
  function copyPreviewLink() {
    const url = `${window.location.origin}/preview/${site.preview_slug}`
    navigator.clipboard.writeText(url)
    toast.success("Preview link copied to clipboard")
  }

  function downloadHtml() {
    const blob = new Blob([site.html_code], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${site.name.toLowerCase().replace(/\s+/g, "-")}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("HTML file downloaded")
  }

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/sites">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sites
            </Button>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-sm font-medium">{site.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {site.style}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(site.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyPreviewLink}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadHtml}>
            <Download className="mr-2 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
