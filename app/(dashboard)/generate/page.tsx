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
  Sparkles, Loader2, Zap, AlertCircle, X, RefreshCw,
  ExternalLink, Monitor, Tablet, Smartphone, ChevronLeft,
  Circle, Pencil, Save, Image as ImageIcon, Check, Rocket,
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
  desktop: "100%", tablet: "768px", mobile: "390px",
}

type Stage = "form" | "generating" | "preview"

const LOG_STEPS = [
  { delay: 0,     color: "text-blue-400",   text: "› Initializing AI workspace..." },
  { delay: 600,   color: "text-white/50",   text: "  Loading model: openrouter/auto" },
  { delay: 1200,  color: "text-white/50",   text: "  Parsing project requirements..." },
  { delay: 2000,  color: "text-green-400",  text: "✓ Requirements analyzed" },
  { delay: 2600,  color: "text-blue-400",   text: "› Designing layout structure..." },
  { delay: 3400,  color: "text-white/50",   text: "  Creating navbar component" },
  { delay: 4000,  color: "text-white/50",   text: "  Building hero section" },
  { delay: 4700,  color: "text-white/50",   text: "  Generating features section" },
  { delay: 5400,  color: "text-green-400",  text: "✓ Layout structure complete" },
  { delay: 6000,  color: "text-blue-400",   text: "› Applying style theme..." },
  { delay: 6800,  color: "text-white/50",   text: "  Configuring Tailwind classes" },
  { delay: 7500,  color: "text-white/50",   text: "  Setting color palette & typography" },
  { delay: 8200,  color: "text-white/50",   text: "  Adding animations & transitions" },
  { delay: 9000,  color: "text-green-400",  text: "✓ Theme applied" },
  { delay: 9600,  color: "text-blue-400",   text: "› Sourcing images..." },
  { delay: 10400, color: "text-white/50",   text: "  Fetching hero image (1400×700)" },
  { delay: 11200, color: "text-white/50",   text: "  Fetching feature card images (×3)" },
  { delay: 12000, color: "text-white/50",   text: "  Fetching gallery images" },
  { delay: 12800, color: "text-green-400",  text: "✓ Images sourced" },
  { delay: 13400, color: "text-blue-400",   text: "› Writing HTML & content..." },
  { delay: 14200, color: "text-white/50",   text: "  Generating semantic markup" },
  { delay: 15000, color: "text-white/50",   text: "  Writing copy & headings" },
  { delay: 15800, color: "text-white/50",   text: "  Adding footer & meta tags" },
  { delay: 16600, color: "text-white/50",   text: "  Making fully responsive" },
  { delay: 17400, color: "text-blue-400",   text: "› Finalizing & saving..." },
  { delay: 18200, color: "text-white/50",   text: "  Validating HTML structure" },
  { delay: 19000, color: "text-white/50",   text: "  Saving to database" },
  { delay: 19800, color: "text-yellow-400", text: "⚡ Almost ready..." },
]

const EDIT_SCRIPT = `
<script id="sf-edit-engine">
(function() {
  var editMode = false;
  var hovered = null;

  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'sf_setEditMode') {
      editMode = e.data.enabled;
      editMode ? enableEditing() : disableEditing();
    } else if (e.data.type === 'sf_replaceImage') {
      var img = document.querySelector('[data-sf-id="' + e.data.id + '"]');
      if (img) { img.src = e.data.src; img.srcset = ''; }
    } else if (e.data.type === 'sf_getHTML') {
      var clone = document.documentElement.cloneNode(true);
      var scriptEl = clone.querySelector('#sf-edit-engine');
      if (scriptEl) scriptEl.remove();
      clone.querySelectorAll('[contenteditable]').forEach(function(el) {
        el.removeAttribute('contenteditable');
      });
      clone.querySelectorAll('[data-sf-id]').forEach(function(el) {
        el.removeAttribute('data-sf-id');
      });
      clone.querySelectorAll('[data-sf-href]').forEach(function(el) {
        el.setAttribute('href', el.getAttribute('data-sf-href'));
        el.removeAttribute('data-sf-href');
      });
      window.parent.postMessage({ type: 'sf_htmlContent', html: '<!DOCTYPE html>' + clone.outerHTML }, '*');
    }
  });

  function enableEditing() {
    document.body.style.userSelect = 'text';
    document.querySelectorAll('img').forEach(function(img, i) {
      img.setAttribute('data-sf-id', 'img-' + i);
      img.style.cursor = 'pointer';
      img.style.transition = 'outline 0.1s';
    });
    var selectors = 'h1,h2,h3,h4,h5,h6,p,li,td,th,button,a,span,label';
    document.querySelectorAll(selectors).forEach(function(el, i) {
      if (el.closest('[contenteditable="true"]')) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-sf-id', 'text-' + i);
      el.style.transition = 'outline 0.1s';
      if (el.tagName === 'A') {
        el.setAttribute('data-sf-href', el.getAttribute('href') || '');
        el.setAttribute('href', 'javascript:void(0)');
      }
    });
    document.addEventListener('mouseover', onHover);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('click', onClick, true);
    showToast('Edit mode — click text to edit, click images to replace');
  }

  function disableEditing() {
    document.body.style.userSelect = '';
    document.querySelectorAll('[contenteditable="true"]').forEach(function(el) {
      el.removeAttribute('contenteditable');
      el.style.outline = '';
      if (el.tagName === 'A' && el.getAttribute('data-sf-href') !== null) {
        el.setAttribute('href', el.getAttribute('data-sf-href'));
        el.removeAttribute('data-sf-href');
      }
    });
    document.querySelectorAll('img[data-sf-id]').forEach(function(img) {
      img.style.cursor = '';
      img.style.outline = '';
    });
    document.removeEventListener('mouseover', onHover);
    document.removeEventListener('mouseout', onMouseOut);
    document.removeEventListener('click', onClick, true);
    var t = document.getElementById('sf-toast');
    if (t) t.remove();
  }

  function onHover(e) {
    if (hovered && hovered !== e.target) { hovered.style.outline = ''; }
    var el = e.target;
    if (el.hasAttribute('contenteditable') || (el.tagName === 'IMG' && el.hasAttribute('data-sf-id'))) {
      el.style.outline = '2px solid #3b82f6';
      hovered = el;
    }
  }

  function onMouseOut(e) {
    var el = e.target;
    if (el !== document.activeElement) el.style.outline = '';
    if (hovered === el) hovered = null;
  }

  function onClick(e) {
    if (!editMode) return;
    var el = e.target;
    if (el.tagName === 'IMG' && el.hasAttribute('data-sf-id')) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'sf_imageClick', id: el.getAttribute('data-sf-id'), src: el.src }, '*');
    }
  }

  function showToast(msg) {
    var t = document.getElementById('sf-toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.id = 'sf-toast';
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(15,15,15,0.9);color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-family:sans-serif;z-index:2147483647;pointer-events:none;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(8px);white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.remove(); }, 3500);
  }
})();
</script>
`

function injectEditScript(html: string): string {
  if (html.includes('sf-edit-engine')) return html
  const closeBody = html.lastIndexOf('</body>')
  if (closeBody !== -1) return html.slice(0, closeBody) + EDIT_SCRIPT + html.slice(closeBody)
  return html + EDIT_SCRIPT
}

const IMAGE_PRESETS = [
  { label: "Nature", seed: "nature,landscape" },
  { label: "City", seed: "city,urban" },
  { label: "Business", seed: "business,office" },
  { label: "Tech", seed: "technology,computer" },
  { label: "People", seed: "people,team" },
  { label: "Food", seed: "food,restaurant" },
]

function TerminalLoader({ projectName }: { projectName: string }) {
  const [visibleLogs, setVisibleLogs] = useState<typeof LOG_STEPS>([])
  const [dotCount, setDotCount] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    LOG_STEPS.forEach((step) => {
      timers.push(setTimeout(() => setVisibleLogs((p) => [...p, step]), step.delay))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setDotCount((d) => (d % 3) + 1), 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleLogs])

  const progress = Math.min(Math.round((visibleLogs.length / LOG_STEPS.length) * 90), 90)

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="w-full max-w-2xl rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1c1c1e] border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="flex-1 text-center text-xs text-white/30 font-mono">
            png website builders — generating {projectName}
          </span>
        </div>
        <div className="bg-[#0d1117] p-5 h-72 overflow-y-auto font-mono text-sm space-y-1">
          <p className="text-white/30 mb-3 text-xs">PNG Website Builders AI — Website Generator</p>
          {visibleLogs.map((log, i) => (
            <p key={i} className={cn("leading-relaxed animate-fadeIn", log.color)}>{log.text}</p>
          ))}
          <p className="text-white/60">
            <span className="inline-block w-2 h-4 bg-white/60 align-middle animate-pulse" />
          </p>
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="w-full max-w-2xl mt-5 space-y-2">
        <div className="flex justify-between text-xs text-white/30 font-mono">
          <span>Building your website{".".repeat(dotCount)}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  const [stage, setStage] = useState<Stage>("form")
  const [credits, setCredits] = useState<number | null>(null)
  const [generatedHtml, setGeneratedHtml] = useState<string>("")
  const [previewSlug, setPreviewSlug] = useState<string>("")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [device, setDevice] = useState<DeviceType>("desktop")
  const [submittedData, setSubmittedData] = useState<GenerateForm | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [imgDialog, setImgDialog] = useState<{ id: string; src: string } | null>(null)
  const [imgUrl, setImgUrl] = useState("")
  const [deployDialog, setDeployDialog] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const prevBlobUrl = useRef<string>("")
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: { style: "modern" },
  })
  const selectedStyle = watch("style")

  useEffect(() => {
    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single()
        setCredits(profile?.credits ?? 0)
      }
    }
    fetchCredits()
  }, [supabase])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data?.type) return
      if (e.data.type === "sf_imageClick") {
        setImgDialog({ id: e.data.id, src: e.data.src })
        setImgUrl("")
      }
      if (e.data.type === "sf_htmlContent") {
        saveHtmlToServer(e.data.html)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [previewSlug])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "sf_setEditMode", enabled: editMode }, "*")
  }, [editMode])

  useEffect(() => {
    if (generatedHtml) {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current)
      const enriched = injectEditScript(generatedHtml)
      const blob = new Blob([enriched], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      prevBlobUrl.current = url
      setBlobUrl(url)
    }
    return () => { if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current) }
  }, [generatedHtml])

  async function saveHtmlToServer(html: string) {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/sites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: previewSlug, html_code: html }),
      })
      if (!res.ok) throw new Error()
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2500)
      toast.success("Changes saved!")
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  function handleSave() {
    iframeRef.current?.contentWindow?.postMessage({ type: "sf_getHTML" }, "*")
  }

  function handleDeploy() {
    setDeployDialog(true)
    setLinkCopied(false)
  }

  function copyDeployLink() {
    const url = `${window.location.origin}/preview/${previewSlug}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    })
  }

  function applyImageReplacement() {
    if (!imgDialog || !imgUrl.trim()) return
    iframeRef.current?.contentWindow?.postMessage({
      type: "sf_replaceImage",
      id: imgDialog.id,
      src: imgUrl.trim(),
    }, "*")
    setImgDialog(null)
    setSavedOk(false)
  }

  async function runGeneration(data: GenerateForm) {
    setSubmittedData(data)
    setStage("generating")
    setEditMode(false)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Generation failed")
      }

      const result = await res.json()
      setGeneratedHtml(result.html)
      setPreviewSlug(result.slug)
      setCredits((c) => (c !== null ? c - 1 : null))
      setStage("preview")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setStage("form")
    }
  }

  async function onSubmit(data: GenerateForm) {
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

  // ─── Full-screen overlay ──────────────────────────────────────────────────
  if (stage === "generating" || stage === "preview") {
    return (
      <>
        <div className="fixed inset-0 z-50 flex bg-[#0d1117]">
          {/* LEFT PANEL */}
          <div className="w-80 shrink-0 flex flex-col border-r border-white/10 bg-[#161b22]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-white text-sm">PNG Website Builders</span>
              </div>
              <button
                onClick={() => { setStage("form"); setEditMode(false) }}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                    <Circle className="h-2 w-2 fill-green-400 text-green-400 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Ready</p>
                      <p className="text-white/40 text-xs mt-0.5">Your website is live</p>
                    </div>
                  </div>
                )}
              </div>

              {stage === "preview" && editMode && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 space-y-1">
                  <p className="text-blue-400 text-xs font-medium">Edit mode active</p>
                  <p className="text-white/40 text-xs">Click any text to edit it directly. Click any image to replace it. Save when done.</p>
                </div>
              )}
            </div>

            <div className="px-4 py-4 border-t border-white/10 space-y-2">
              {stage === "preview" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 border-white/10 text-white hover:bg-white/10 transition-colors",
                      editMode ? "bg-blue-500/20 border-blue-500/30 text-blue-300" : "bg-white/5"
                    )}
                    onClick={() => setEditMode((v) => !v)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {editMode ? "Exit Edit Mode" : "Edit Content"}
                  </Button>

                  {editMode && (
                    <Button
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : savedOk ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {isSaving ? "Saving..." : savedOk ? "Saved!" : "Save Changes"}
                    </Button>
                  )}

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

                  <a href={`/preview/${previewSlug}`} target="_blank" rel="noopener noreferrer">
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
                onClick={() => { setStage("form"); setEditMode(false) }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors pt-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Back to form
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 flex flex-col">
            {/* TOP TOOLBAR */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#161b22]">
              {/* Left: preview URL / status */}
              <span className="text-xs text-white/40 font-mono">
                {stage === "generating" ? "● generating..." : `preview/${previewSlug}`}
              </span>

              {/* Right: device switcher + Deploy button */}
              <div className="flex items-center gap-2">
                {stage === "preview" && (
                  <>
                    {/* Device switcher */}
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

                    {/* Divider */}
                    <div className="h-4 w-px bg-white/10" />

                    {/* Deploy button — top right */}
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-500 text-white border-0 font-semibold shadow-lg shadow-green-900/30 transition-all"
                      onClick={handleDeploy}
                    >
                      <Rocket className="h-3.5 w-3.5" />
                      Deploy Site
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 overflow-auto flex items-start justify-center bg-[#0d1117]">
              {stage === "generating" ? (
                <TerminalLoader projectName={submittedData?.name ?? "your website"} />
              ) : blobUrl ? (
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: deviceWidths[device], maxWidth: "100%", minHeight: "100%" }}
                >
                  <iframe
                    key={blobUrl}
                    ref={iframeRef}
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

        {/* Deploy dialog */}
        {deployDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#161b22] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white font-medium text-sm">Site Deployed</span>
                </div>
                <button onClick={() => setDeployDialog(false)} className="text-white/40 hover:text-white/80">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <p className="text-green-400 text-sm font-medium mb-1">Your site is live!</p>
                  <p className="text-white/40 text-xs">Share this link with anyone — no login required</p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="flex-1 text-white/70 text-xs font-mono truncate">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/preview/${previewSlug}`
                      : `/preview/${previewSlug}`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10 text-white bg-white/5 hover:bg-white/10 gap-2"
                    onClick={copyDeployLink}
                  >
                    {linkCopied ? (
                      <><Check className="h-3.5 w-3.5 text-green-400" /> Copied!</>
                    ) : (
                      <><ExternalLink className="h-3.5 w-3.5" /> Copy Link</>
                    )}
                  </Button>
                  <a
                    href={`/preview/${previewSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full gap-2">
                      <Rocket className="h-3.5 w-3.5" />
                      Open Site
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image replacement dialog */}
        {imgDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#161b22] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-white/60" />
                  <span className="text-white font-medium text-sm">Replace Image</span>
                </div>
                <button onClick={() => setImgDialog(null)} className="text-white/40 hover:text-white/80">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-2">Current image</p>
                  <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10" style={{ height: 120 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgDialog.src} alt="Current" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-2">Quick replace</p>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setImgUrl(`https://picsum.photos/seed/${preset.seed}/800/500`)}
                        className="rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors relative"
                        style={{ height: 60 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://picsum.photos/seed/${preset.seed}/200/120`}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{preset.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-2">Or paste any image URL</p>
                  <Input
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="https://picsum.photos/seed/myseed/800/500"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-xs"
                    onKeyDown={(e) => { if (e.key === "Enter") applyImageReplacement() }}
                  />
                </div>
              </div>

              <div className="flex gap-2 px-5 pb-5">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white bg-white/5 hover:bg-white/10"
                  onClick={() => setImgDialog(null)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={applyImageReplacement} disabled={!imgUrl.trim()}>
                  Replace Image
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ─── Form view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Website</h1>
        <p className="text-muted-foreground mt-1">Describe your vision and let AI create your website.</p>
      </div>

      {credits !== null && credits === 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-destructive bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">No credits available</p>
            <p className="text-sm text-muted-foreground">You need credits to generate websites.</p>
          </div>
          <Link href="/billing"><Button size="sm">Buy Credits</Button></Link>
        </div>
      )}

      {credits !== null && credits > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">You have <span className="text-primary">{credits} credits</span> available</p>
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
            <Input id="name" placeholder="My Awesome Startup" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe your website..." rows={4} {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            <p className="text-xs text-muted-foreground">Be specific — the more detail you provide, the better the result.</p>
          </div>

          <div className="space-y-3">
            <Label>Style Preference</Label>
            <RadioGroup
              value={selectedStyle}
              onValueChange={(v) => setValue("style", v as GenerateForm["style"])}
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
                      {selectedStyle === style.value && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.style && <p className="text-sm text-destructive">{errors.style.message}</p>}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={credits !== null && credits < 1}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Website (1 Credit)
        </Button>
      </form>
    </div>
  )
}
