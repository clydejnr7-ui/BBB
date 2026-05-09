import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Try it out, no card required",
    price: "$0",
    period: "",
    credits: "3 credits",
    features: ["3 website generations", "Full AI-powered generation", "Responsive designs", "Code export", "Preview links"],
    cta: "Get Started Free",
    href: "/auth/signup",
    popular: false,
    highlight: false,
  },
  {
    name: "Starter",
    description: "For creators who need more",
    price: "$5",
    period: "one-time",
    credits: "10 credits",
    features: ["10 website generations", "Everything in Free", "Priority generation", "Email support", "Extended preview links"],
    cta: "Buy Credits",
    href: "/auth/signup",
    popular: false,
    highlight: false,
  },
  {
    name: "Pro",
    description: "Best value for professionals",
    price: "$20",
    period: "one-time",
    credits: "50 credits",
    features: ["50 website generations", "Everything in Starter", "Fastest generation speed", "Priority support", "Custom style presets"],
    cta: "Get Pro Credits",
    href: "/auth/signup",
    popular: true,
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For teams and agencies",
    price: "$70",
    period: "one-time",
    credits: "200 credits",
    features: ["200 website generations", "Everything in Pro", "Team collaboration", "Dedicated support", "Custom integrations"],
    cta: "Buy Credits",
    href: "/auth/signup",
    popular: false,
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-[100px]" />
      </div>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 lg:mb-20">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
            Simple, <span className="gradient-text">transparent pricing</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Pay once, use forever. No subscriptions, no hidden fees.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/25 scale-[1.02]"
                  : "bg-card border border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium mt-1 ${plan.highlight ? "text-primary-foreground/80" : "text-primary"}`}>
                  {plan.credits}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} />
                    <span className={plan.highlight ? "text-primary-foreground/90" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className="w-full font-semibold"
                  variant={plan.highlight ? "secondary" : "default"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
