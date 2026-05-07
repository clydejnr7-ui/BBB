"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Monitor, Tablet, Smartphone, Code, Eye, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PreviewFrameProps {
  htmlCode: string
}

type DeviceType = "desktop" | "tablet" | "mobile"
type ViewMode = "preview" | "code"

const deviceSizes: Record<DeviceType, { width: string; icon: typeof Monitor }> = {
  desktop: { width: "100%", icon: Monitor },
  tablet: { width: "768px", icon: Tablet },
  mobile: { width: "375px", icon: Smartphone },
}

export function PreviewFrame({ htmlCode }: PreviewFrameProps) {
  const [device, setDevice] = useState<DeviceType>("desktop")
  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const blob = new Blob([htmlCode], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    setBlobUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
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

  return (
    <div className="flex flex-col h-full gap-4">
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
            variant={viewMode === "code" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3"
            onClick={() => setViewMode("code")}
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Code
          </Button>
        </div>

        {/* Device Selector — only shown in preview mode */}
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

        {/* Copy button — shown in code mode */}
        {viewMode === "code" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={copyHtml}
          >
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

      {/* Preview Container */}
      {viewMode === "preview" && (
        <div className="flex-1 flex justify-center">
          <div
            className={cn(
              "bg-background rounded-lg border shadow-lg overflow-hidden transition-all duration-300",
              device === "desktop" ? "w-full" : ""
            )}
            style={{
              width: deviceSizes[device].width,
              maxWidth: "100%",
            }}
          >
            <iframe
              src={blobUrl}
              className="w-full h-full min-h-[600px]"
              sandbox="allow-scripts allow-same-origin"
              title="Website Preview"
            />
          </div>
        </div>
      )}

      {/* Code Viewer */}
      {viewMode === "code" && (
        <div className="flex-1 relative rounded-lg border overflow-hidden bg-[#0d1117]">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10 z-10">
            <span className="text-xs text-white/50 font-mono">index.html</span>
            <span className="text-xs text-white/30">{htmlCode.split("\n").length} lines</span>
          </div>
          <div className="overflow-auto h-full pt-10 pb-4">
            <pre className="text-sm font-mono text-[#e6edf3] whitespace-pre p-4 min-h-[600px]">
              <code>{htmlCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
