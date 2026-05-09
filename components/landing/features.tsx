import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Paintbrush, Smartphone, Rocket, Code2, Shield } from "lucide-react"

const features = [
  { icon: Sparkles, title: "AI-Powered Generation", description: "Describe your vision and our AI creates a complete, professional website in seconds — layout, content, and styling included.", gradient: "from-violet-500/15 to-purple-500/5", iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
  { icon: Paintbrush, title: "Beautiful Designs", description: "Every site is crafted with modern design principles — typography, spacing, and colour all tuned for visual excellence.", gradient: "from-blue-500/15 to-cyan-500/5", iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
  { icon: Smartphone, title: "Fully Responsive", description: "All generated websites are mobile-first and look pixel-perfect on every device, from phones to ultra-wide displays.", gradient: "from-emerald-500/15 to-teal-500/5", iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10" },
  { icon: Code2, title: "Clean Code Export", description: "Get production-ready HTML, CSS, and JavaScript — well-structured code you can customise, extend, or hand off to a developer.", gradient: "from-orange-500/15 to-amber-500/5", iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
  { icon: Rocket, title: "Instant Preview", description: "See your website come to life in real time. Iterate in seconds, not days — no build process, no waiting.", gradient: "from-rose-500/15 to-pink-500/5", iconColor: "text-rose-500", iconBg: "bg-rose-500/10" },
  { icon: Shield, title: "Secure & Private", description: "Your data and generated websites are protected with enterprise-grade security. What you build stays yours.", gradient: "from-indigo-500/15 to-blue-500/5", iconColor: "text-indigo-500", iconBg: "bg-indigo-500/10" },
]

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-muted/25" />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Features</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
            Everything you need to{" "}
            <span className="gradient-text">build amazing websites</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-pretty leading-relaxed">
            Our AI platform gives you all the tools to create professional websites — no coding knowledge required.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className={`card-gradient-border group relative border border-border/60 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}>
              <CardContent className="p-7">
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} ring-1 ring-inset ring-white/10`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
