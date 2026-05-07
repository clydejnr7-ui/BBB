import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Sparkles, 
  Paintbrush, 
  Smartphone, 
  Rocket, 
  Code2, 
  Shield 
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Describe your vision and let our advanced AI create a complete, professional website in seconds.",
  },
  {
    icon: Paintbrush,
    title: "Beautiful Designs",
    description: "Every site is crafted with modern design principles, ensuring your website looks stunning.",
  },
  {
    icon: Smartphone,
    title: "Fully Responsive",
    description: "All generated websites are mobile-first and look perfect on any device or screen size.",
  },
  {
    icon: Code2,
    title: "Clean Code",
    description: "Get production-ready HTML, CSS, and JavaScript code that you can customize and extend.",
  },
  {
    icon: Rocket,
    title: "Instant Preview",
    description: "See your website come to life instantly with our real-time preview feature.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data and generated websites are protected with enterprise-grade security.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Everything You Need to Build Amazing Websites
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Our AI-powered platform gives you all the tools to create professional websites without any coding knowledge.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
