"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
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
            <span className="gradient-text">in Seconds</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Transform your ideas into beautiful, responsive websites with the power of AI. 
            No coding required. Just describe what you want, and watch the magic happen.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base glow">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Building - 3 Free Credits
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>10,000+ websites created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>4.9/5 user rating</span>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-16 w-full max-w-5xl">
            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="rounded-md bg-background px-4 py-1 text-xs text-muted-foreground">
                    siteforge.ai/preview/my-startup
                  </div>
                </div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Your AI-generated website appears here
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Fully responsive, modern, and ready to deploy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
