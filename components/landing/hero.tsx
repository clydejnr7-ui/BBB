"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Zap } from "lucide-react"
import { useEffect, useState, useRef } from "react"

// Each demo cycles: type prompt → generate → show site → repeat
const DEMOS = [
  {
    prompt: "A modern coffee shop website with online ordering and menu...",
    style: "Modern",
    site: {
      nav: "BrewHouse Coffee",
      navLinks: ["Menu", "Order", "Locations", "About"],
      heroBg: "from-amber-900 to-amber-700",
      heroTitle: "Crafted with\nPassion & Care",
      heroSub: "Fresh beans, expertly brewed. Order online for pickup.",heroCta: "Order Now",
      accent: "bg-amber-500",
      cards: [
        { color: "bg-amber-100", icon: "☕", label: "Espresso" },
        { color: "bg-orange-100", icon: "🥐", label: "Pastries" },
        { color: "bg-yellow-100", icon: "🧋", label: "Cold Brew" },
      ],
    },
  },
  {
    prompt: "A tech startup landing page with dark theme and bold visuals...",
    style: "Startup",
    site: {
      nav: "NeuralStack",
      navLinks: ["Product", "Pricing", "Docs", "Blog"],
      heroBg: "from-slate-900 to-indigo-950",
      heroTitle: "Ship AI Features\n10x Faster",
      heroSub: "The developer platform for building production-ready AI.",
      heroCta: "Get Started Free",
      accent: "bg-indigo-500",
      cards: [
        { color: "bg-indigo-950", icon: "⚡", label: "Fast APIs" },
        { color: "bg-slate-800", icon: "🔒", label: "Secure" },
        { color: "bg-violet-950", icon: "📊", label: "Analytics" },
      ],
    },
  },
  {
    prompt: "A luxury real estate website with elegant minimal design...",
    style: "Minimal",
    site: {
      nav: "Lumière Estates",
      navLinks: ["Properties", "Services", "About", "Contact"],
      heroBg: "from-stone-800 to-stone-600",
      heroTitle: "Extraordinary\nLiving Awaits",
      heroSub: "Curated luxury properties in the world's finest locations.",
      heroCta: "View Properties",
      accent: "bg-stone-400",
      cards: [
        { color: "bg-stone-100", icon: "🏠", label: "Villas" },
        { color: "bg-stone-200", icon: "🏙️", label: "Penthouses" },
        { color: "bg-stone-100", icon: "🌊", label: "Beachfront" },
      ],
    },
  },
  {
    prompt: "A vibrant fitness studio with class booking and trainers...",
    style: "Creative",
    site: {
      nav: "APEX Fitness",
      navLinks: ["Classes", "Trainers", "Schedule", "Join"],
      heroBg: "from-rose-600 to-orange-500",
      heroTitle: "Push Your\nLimits Daily",
      heroSub: "Premium fitness classes with world-class trainers.",
      heroCta: "Book a Class",
      accent: "bg-rose-500",
      cards: [
        { color: "bg-rose-100", icon: "🏋️", label: "Strength" },
        { color: "bg-orange-100", icon: "🧘", label: "Yoga" },
        { color: "bg-red-100", icon: "🥊", label: "Boxing" },
      ],
    },
  },
]

// Typing speed constants
const TYPE_SPEED = 38
const DELETE_SPEED = 18
const PAUSE_AFTER_TYPE = 600
const PAUSE_ON_SITE = 2800
const GENERATE_DURATION = 1400

type Phase = "typing" | "generating" | "site" | "deleting"

function MockWebsite({ site }: { site: typeof DEMOS[0]["site"]; visible: boolean }) {
  return (
    <div className="w-full h-full flex flex-col text-left overflow-hidden rounded-b-xl select-none">
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/10 backdrop-blur-sm border-b border-white/10 shrink-0">
        <span className="text-white font-bold text-xs">{site.nav}</span>
        <div className="flex gap-3">
          {site.navLinks.map((l) => (
            <span key={l} className="text-white/70 text-[9px] font-medium">{l}</span>
          ))}
        </div>
        <div className={`${site.accent} rounded px-2 py-0.5 text-white text-[9px] font-bold`}>
          {site.heroCta}
        </div>
      </div>

      {/* Hero */}
      <div className={`bg-gradient-to-br ${site.heroBg} px-5 py-4 shrink-0`}>
        <h2 className="text-white font-bold text-sm leading-tight whitespace-pre-line">
          {site.heroTitle}
        </h2>
        <p className="text-white/70 text-[9px] mt-1 leading-relaxed max-w-xs">
          {site.heroSub}
        </p>
        <div className={`${site.accent} inline-block mt-2 rounded px-3 py-1 text-white text-[9px] font-bold`}>
          {site.heroCta} →
        </div>
      </div>

      {/* Feature cards */}
      <div className="flex gap-2 px-4 py-3 bg-white shrink-0">
        {site.cards.map((card) => (
          <div key={card.label} className={`flex-1 ${card.color} rounded-lg p-2 flex flex-col items-center gap-1`}>
            <span className="text-base">{card.icon}</span>
            <span className="text-[8px] font-semibold text-gray-700">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div className="flex-1 bg-white px-4 pb-2 space-y-2">
        <div className="h-1.5 bg-gray-200 rounded w-2/3" />
        <div className="h-1.5 bg-gray-100 rounded w-full" />
        <div className="h-1.5 bg-gray-100 rounded w-5/6" />
        <div className="h-1.5 bg-gray-100 rounded w-4/6" />
        <div className="flex gap-2 mt-2">
          <div className="h-8 bg-gray-100 rounded flex-1" />
          <div className="h-8 bg-gray-100 rounded flex-1" />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-gray-500 text-[8px]">© 2025 {site.nav}</span>
        <div className="flex gap-2">
          <div className="h-1 w-6 bg-gray-700 rounded" />
          <div className="h-1 w-6 bg-gray-700 rounded" />
          <div className="h-1 w-6 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}

function GeneratingOverlay() {
  const [dots, setDots] = useState(1)
  const bars = [0.3, 0.6, 0.9, 0.7, 0.5, 0.8, 0.4, 0.95, 0.6, 0.75]

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 350)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="absolute inset-0 bg-[#0d1117] flex flex-col items-center justify-center gap-4 rounded-b-xl">
      <div className="flex gap-1 items-end h-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-2 rounded-sm bg-primary/60"
            style={{
              height: `${h * 100}%`,
              animation: `barPulse 0.8s ease-in-out ${i * 0.08}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <p className="text-white/70 text-sm font-mono">
        Generating{".".repeat(dots)}
      </p>
      <style>{`
        @keyframes barPulse {
          from { opacity: 0.3; transform: scaleY(0.6); }
          to   { opacity: 1;   transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

export function Hero() {
  const [demoIndex, setDemoIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("typing")
  const [typedText, setTypedText] = useState("")
  const [siteVisible, setSiteVisible] = useState(false)
  const phaseRef = useRef<Phase>("typing")
  const indexRef = useRef(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    function runCycle(idx: number, ph: Phase, text: string) {
      const demo = DEMOS[idx]
      const fullPrompt = demo.prompt

      if (ph === "typing") {
        if (text.length < fullPrompt.length) {
          const next = fullPrompt.slice(0, text.length + 1)
          setTypedText(next)
          timeout = setTimeout(() => runCycle(idx, "typing", next), TYPE_SPEED)
        } else {
          timeout = setTimeout(() => {
            phaseRef.current = "generating"
            setPhase("generating")
            setSiteVisible(false)
            runCycle(idx, "generating", text)
          }, PAUSE_AFTER_TYPE)
        }
      } else if (ph === "generating") {
        timeout = setTimeout(() => {
          phaseRef.current = "site"
          setPhase("site")
          setSiteVisible(true)
          runCycle(idx, "site", text)
        }, GENERATE_DURATION)
      } else if (ph === "site") {
        timeout = setTimeout(() => {
          phaseRef.current = "deleting"
          setPhase("deleting")
          setSiteVisible(false)
          runCycle(idx, "deleting", text)
        }, PAUSE_ON_SITE)
      } else if (ph === "deleting") {
        if (text.length > 0) {
          const next = text.slice(0, -1)
          setTypedText(next)
          timeout = setTimeout(() => runCycle(idx, "deleting", next), DELETE_SPEED)
        } else {
          const nextIdx = (idx + 1) % DEMOS.length
          indexRef.current = nextIdx
          setDemoIndex(nextIdx)
          phaseRef.current = "typing"
          setPhase("typing")
          timeout = setTimeout(() => runCycle(nextIdx, "typing", ""), 300)
        }
      }
    }

    runCycle(indexRef.current, phaseRef.current, typedText)
    return () => clearTimeout(timeout)
  }, [])

  const currentDemo = DEMOS[demoIndex]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Powered by Advanced AI
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-balance">
            Build Stunning Websites{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Transform your ideas into beautiful, responsive websites with the power of AI.
            No coding required. Just describe what you want.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Building — 3 Free Credits
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>10,000+ websites created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>4.9/5 user rating</span>
            </div>
          </div>

          {/* Animated browser mockup */}
          <div className="mt-14 w-full max-w-3xl">
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3 shrink-0">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-md bg-background px-4 py-1 text-xs text-muted-foreground font-mono">
                    pngwebsitebuilders.site/generate
                  </div>
                </div>
              </div>

              {/* Prompt bar */}
              <div className="border-b bg-muted/30 px-4 py-2.5 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground/80 font-mono flex-1 text-left min-h-[1.25rem]">
                  {typedText}
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {currentDemo.style}
                  </Badge>
                  {phase === "generating" && (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                  {phase === "site" && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>
              </div>

              {/* Preview area */}
              <div className="relative aspect-video overflow-hidden bg-muted/10">
                {/* Idle / typing state */}
                {(phase === "typing" || phase === "deleting") && !siteVisible && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10">
                      <Sparkles className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {phase === "typing" ? "Describe your website above..." : "Starting next generation..."}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Fully responsive, modern, and ready to deploy
                    </p>
                  </div>
                )}

                {/* Generating state */}
                {phase === "generating" && <GeneratingOverlay />}

                {/* Generated website */}
                <div
                  className="absolute inset-0 transition-all duration-700"
                  style={{
                    opacity: siteVisible ? 1 : 0,
                    transform: siteVisible ? "translateY(0)" : "translateY(12px)",
                  }}
                >
                  {phase === "site" && (
                    <MockWebsite site={currentDemo.site} visible={siteVisible} />
                  )}
                </div>
              </div>
            </div>

            {/* Cycle indicator dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {DEMOS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === demoIndex ? 20 : 6,
                    height: 6,
                    background: i === demoIndex ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
