"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Monitor, Tablet, Smartphone, Code, Eye, Copy, Check, Columns2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PreviewFrameProps {
  htmlCode: string
}

type DeviceType = "desktop" | "tablet" | "mobile"
type ViewMode = "preview" | "code" | "split"

const deviceSizes: Record<DeviceType, { width: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
}

export function PreviewFrame({ htmlCode }: PreviewFrameProps) {
  const [device, setDevice] = useState<DeviceType>("desktop")
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const blob = new Blob([htmlCode], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [htmlCode])

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(htmlCode)
      setCopied(true)
      toast.success("HTML code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy code")
    }
  }

  const showCode = viewMode === "code" || viewMode === "split"
  const showPreview = viewMode === "preview" || viewMode === "split"

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
          <Button
            variant={viewMode === "split" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setViewMode("split")}
          >
            <Columns2 className="h-3.5 w-3.5 mr-1.5" />
            Split
          </Button>
          <Button
            variant={viewMode === "code" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setViewMode("code")}
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Code
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Selector — only in preview mode */}
          {viewMode === "preview" && (
            <div className="flex items-center gap-1">
              {(Object.keys(deviceSizes) as DeviceType[]).map((deviceType) => {
                const { icon: Icon } = deviceSizes[deviceType]
                return (
                  <Button
                    key={deviceType}
                    variant={device === deviceType ? "default" : "outline"}
                    size="sm"
                    className="h-8"
                    onClick={() => setDevice(deviceType)}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    <span className="capitalize hidden sm:inline">{deviceType}</span>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Copy button */}
          {showCode && (
            <Button variant="outline" size="sm" className="h-8" onClick={copyHtml}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy HTML
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex min-h-0",
          viewMode === "split" ? "flex-row gap-3" : "flex-col"
        )}
      >
        {/* Code Panel */}
        {showCode && (
          <div
            className={cn(
              "relative rounded-lg border overflow-hidden bg-[#0d1117] flex flex-col",
              viewMode === "split" ? "w-1/2" : "flex-1",
              "min-h-[600px]"
            )}
          >
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-white/50 font-mono ml-2">index.html</span>
              </div>
              <span className="text-xs text-white/30">{htmlCode.split("\n").length} lines</span>
            </div>
            <div className="overflow-auto flex-1">
              <pre className="text-sm font-mono text-[#e6edf3] whitespace-pre p-4 leading-relaxed">
                <code>{htmlCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && (
          <div
            className={cn(
              "flex flex-col rounded-lg border overflow-hidden bg-background shadow-lg",
              viewMode === "split" ? "w-1/2" : "flex-1",
              "min-h-[600px]"
            )}
            style={{
              width: viewMode === "preview"
                ? deviceSizes[device].width
                : undefined,
              maxWidth: "100%",
              margin: viewMode === "preview" ? "0 auto" : undefined,
            }}
          >
            {blobUrl && (
              <iframe
                src={blobUrl}
                className="w-full h-full min-h-[600px]"
                sandbox="allow-scripts allow-same-origin"
                title="Website Preview"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
