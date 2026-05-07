import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Startup Founder",
    content: "SiteForge saved me weeks of development time. I had a professional landing page for my startup in under 5 minutes. Absolutely incredible!",
    rating: 5,
    initials: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Designer",
    content: "The AI understands design principles better than most developers I have worked with. The generated code is clean and easy to customize.",
    rating: 5,
    initials: "MJ",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Manager",
    content: "We use SiteForge for all our campaign landing pages now. It is fast, the results are beautiful, and our conversion rates have improved significantly.",
    rating: 5,
    initials: "ER",
  },
  {
    name: "David Kim",
    role: "Agency Owner",
    content: "This tool has transformed how our agency works. We can prototype ideas instantly and deliver to clients faster than ever before.",
    rating: 5,
    initials: "DK",
  },
  {
    name: "Lisa Thompson",
    role: "E-commerce Owner",
    content: "I was skeptical about AI-generated websites, but SiteForge blew me away. My product pages look professional and convert really well.",
    rating: 5,
    initials: "LT",
  },
  {
    name: "Alex Patel",
    role: "Tech Entrepreneur",
    content: "The responsive designs are perfect on every device. I have tried other AI tools, but SiteForge is in a league of its own.",
    rating: 5,
    initials: "AP",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Loved by Creators Worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Join thousands of satisfied users who are building amazing websites with SiteForge.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">
                  {`"${testimonial.content}"`}
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
