"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Sparkles,
  Loader2,
  Zap,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const generateSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  style: z.enum(["modern", "minimal", "startup", "creative", "corporate"]),
})

type GenerateForm = z.infer<typeof generateSchema>

const styleOptions = [
  { value: "modern", label: "Modern", description: "Clean, contemporary design with bold typography" },
  { value: "minimal", label: "Minimal", description: "Simple, focused design with lots of whitespace" },
  { value: "startup", label: "Startup", description: "Dynamic, tech-forward design with vibrant colors" },
  { value: "creative", label: "Creative", description: "Artistic, unique design with custom elements" },
  { value: "corporate", label: "Corporate", description: "Professional, trustworthy design for businesses" },
]

type DeviceType = "desktop" | "tablet" | "mobile"
const deviceWidths: Record<DeviceType, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
}

type Stage = "form" | "generating" | "preview"

export default function GeneratePage() {
  const [stage, setStage] = useState<Stage>("form")
  const [credits, setCredits] = useState<number | null>(null)
  const [generatedHtml, setGeneratedHtml] = useState<string>("")
  const [previewSlug, setPreviewSlug] = useState<string>("")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [device, setDevice] = useState<DeviceType>("desktop")
  const [submittedData, setSubmittedData] = useState<GenerateForm | null>(null)
  const prevBlobUrl = useRef<string>("")
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: { style: "modern" },
  })

  const selectedStyle = watch("style")

  useEffect(() => {
    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()
        setCredits(profile?.credits ?? 0)
      }
    }
    fetchCredits()
  }, [supabase])

  useEffect(() => {
    if (generatedHtml) {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
      const blob = new Blob([generatedHtml], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      prevBlobUrl.current = url
      setBlobUrl(url)
    }
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
    }
  }, [generatedHtml])

  async function runGeneration(data: GenerateForm) {
    setSubmittedData(data)
    setStage("generating")
    setGeneratedHtml("")
    setBlobUrl("")

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setStage("form")
        throw new Error(result.error || "Generation failed")
      }

      // Fetch the actual HTML from the preview slug
      const htmlResponse = await fetch(`/api/preview/${result.previewSlug}`)
      const html = await htmlResponse.text()

      setGeneratedHtml(html)
      setPreviewSlug(result.previewSlug)
      setCredits((prev) => (prev !== null ? prev - 1 : prev))
      setStage("preview")
      toast.success("Website generated!")
    } catch (error) {
      setStage("form")
      toast.error(error instanceof Error ? error.message : "Failed to generate website")
    }
  }

  function onSubmit(data: GenerateForm) {
    if (credits !== null && credits < 1) {
      toast.error("You need at least 1 credit to generate a website")
      return
    }
    runGeneration(data)
  }

  function handleRegenerate() {
    const data = submittedData || getValues()
    if (credits !== null && credits < 1) {
      toast.error("You need at least 1 credit to regenerate")
      return
    }
    runGeneration(data)
  }

  // ─── Full-screen overlay (generating + preview) ───────────────────────────
  if (stage === "generating" || stage === "preview") {
    return (
      <div className="fixed inset-0 z-50 flex bg-[#0d1117]">
        {/* LEFT PANEL */}
        <div className="w-80 shrink-0 flex flex-col border-r border-white/10 bg-[#161b22]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-white text-sm">SiteForge AI</span>
            </div>
            <button
              onClick={() => setStage("form")}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Project info */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {submittedData && (
              <>
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Project</p>
                  <p className="text-white font-semibold text-base">{submittedData.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-white/70 text-sm leading-relaxed">{submittedData.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Style</p>
                  <Badge variant="secondary" className="capitalize">{submittedData.style}</Badge>
                </div>
              </>
            )}

            {/* Status */}
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              {stage === "generating" ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Generating...</p>
                    <p className="text-white/40 text-xs mt-0.5">Usually takes 15–30 seconds</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">Ready</p>
                    <p className="text-white/40 text-xs mt-0.5">Your website is live</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            {stage === "preview" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={handleRegenerate}
                  disabled={credits !== null && credits < 1}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate (1 credit)
                </Button>
                <a
                  href={`/preview/${previewSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in new tab
                  </Button>
                </a>
              </>
            )}
            <button
              onClick={() => setStage("form")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors pt-1"
            >
              <ChevronLeft className="h-3 w-3" />
              Back to form
            </button>
          </div>
        </div>

        {/* RIGHT PANEL — live preview only */}
        <div className="flex-1 flex flex-col">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#161b22]">
            <span className="text-xs text-white/40 font-mono">
              {stage === "generating" ? "Generating your website..." : `preview/${previewSlug}`}
            </span>
            {stage === "preview" && (
              <div className="flex items-center gap-1">
                {(["desktop", "tablet", "mobile"] as DeviceType[]).map((d) => {
                  const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone
                  return (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        device === d ? "text-white bg-white/10" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto flex items-start justify-center bg-[#0d1117] p-0">
            {stage === "generating" ? (
              <div className="flex flex-col items-center justify-center h-full w-full gap-6">
                {/* Animated loading UI */}
                <div className="space-y-3 w-full max-w-2xl px-8 opacity-20 animate-pulse">
                  <div className="h-64 rounded-xl bg-white/10 w-full" />
                  <div className="flex gap-3">
                    <div className="h-40 rounded-xl bg-white/10 flex-1" />
                    <div className="h-40 rounded-xl bg-white/10 flex-1" />
                    <div className="h-40 rounded-xl bg-white/10 flex-1" />
                  </div>
                  <div className="h-24 rounded-xl bg-white/10 w-full" />
                </div>
                <div className="text-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Building your website with AI...</p>
                </div>
              </div>
            ) : blobUrl ? (
              <div
                className="h-full transition-all duration-300 bg-white"
                style={{
                  width: deviceWidths[device],
                  maxWidth: "100%",
                  minHeight: "100%",
                }}
              >
                <iframe
                  key={blobUrl}
                  src={blobUrl}
                  className="w-full h-full"
                  style={{ minHeight: "calc(100vh - 41px)", border: "none", display: "block" }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Generated Website Preview"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // ─── Form view (default) ──────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Website</h1>
        <p className="text-muted-foreground mt-1">
          Describe your vision and let AI create your website.
        </p>
      </div>

      {credits !== null && credits === 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-destructive bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">No credits available</p>
            <p className="text-sm text-muted-foreground">You need credits to generate websites.</p>
          </div>
          <Link href="/billing">
            <Button size="sm">Buy Credits</Button>
          </Link>
        </div>
      )}

      {credits !== null && credits > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              You have <span className="text-primary">{credits} credits</span> available
            </p>
            <p className="text-sm text-muted-foreground">Each generation uses 1 credit</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Project Details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Tell us about the website you want to create</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Startup"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your website... What is it for? What features should it have? What message should it convey?"
              rows={4}
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            <p className="text-xs text-muted-foreground">
              Be specific — the more detail you provide, the better the result.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Style Preference</Label>
            <RadioGroup
              value={selectedStyle}
              onValueChange={(value) => setValue("style", value as GenerateForm["style"])}
              className="grid gap-3 sm:grid-cols-2"
            >
              {styleOptions.map((style) => (
                <div key={style.value}>
                  <RadioGroupItem value={style.value} id={style.value} className="peer sr-only" />
                  <Label
                    htmlFor={style.value}
                    className="flex flex-col gap-1 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{style.label}</span>
                      {selectedStyle === style.value && (
                        <Badge variant="secondary" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.style && <p className="text-sm text-destructive">{errors.style.message}</p>}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={credits !== null && credits < 1}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Website (1 Credit)
        </Button>
      </form>
    </div>
  )
}
