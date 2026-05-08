import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out SiteForge",
    price: "$0",
    credits: "3 credits",
    features: [
      "3 website generations",
      "Full AI-powered generation",
      "Responsive designs",
      "Code export",
      "Preview links",
    ],
    cta: "Get Started Free",
    href: "/auth/signup",
    popular: false,
  },
  {
    name: "Starter",
    description: "For creators who need more",
    price: "$5",
    credits: "10 credits",
    features: [
      "10 website generations",
      "Everything in Free",
      "Priority generation",
      "Email support",
      "Extended preview links",
    ],
    cta: "Buy Credits",
    href: "/auth/signup",
    popular: false,
  },
  {
    name: "Pro",
    description: "Best value for professionals",
    price: "$20",
    credits: "50 credits",
    features: [
      "50 website generations",
      "Everything in Starter",
      "Fastest generation speed",
      "Priority support",
      "Custom style presets",
    ],
    cta: "Buy Credits",
    href: "/auth/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For teams and agencies",
    price: "$70",
    credits: "200 credits",
    features: [
      "200 website generations",
      "Everything in Pro",
      "Team collaboration",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Buy Credits",
    href: "/auth/signup",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Start free and upgrade as you grow. Pay only for what you use with our credit-based system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg md:scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.credits}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
