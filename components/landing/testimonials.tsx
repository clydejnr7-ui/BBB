import { Star, Quote } from "lucide-react"

const testimonials = [
  { name: "Sarah Chen", role: "Startup Founder", content: "PNG Website Builders saved me weeks of development time. I had a professional landing page for my startup in under 5 minutes. Absolutely incredible!", initials: "SC", color: "bg-violet-500" },
  { name: "Marcus Johnson", role: "Freelance Designer", content: "The AI understands design principles better than most developers I have worked with. The generated code is clean and easy to customise.", initials: "MJ", color: "bg-blue-500" },
  { name: "Emily Rodriguez", role: "Marketing Manager", content: "We use PNG Website Builders for all our campaign landing pages now. It is fast, the results are beautiful, and our conversion rates have improved significantly.", initials: "ER", color: "bg-emerald-500" },
  { name: "David Kim", role: "Agency Owner", content: "This tool has transformed how our agency works. We can prototype ideas instantly and deliver to clients faster than ever before.", initials: "DK", color: "bg-orange-500" },
  { name: "Lisa Thompson", role: "E-commerce Owner", content: "I was skeptical about AI-generated websites, but PNG Website Builders blew me away. My product pages look professional and convert really well.", initials: "LT", color: "bg-rose-500" },
  { name: "Alex Patel", role: "Tech Entrepreneur", content: "The responsive designs are perfect on every device. I have tried other AI tools, but PNG Website Builders is in a league of its own.", initials: "AP", color: "bg-indigo-500" },
  { name: "Priya Nair", role: "Product Designer", content: "What used to take a full day now takes minutes. The quality of the output is stunning — clients think I hired an entire design team.", initials: "PN", color: "bg-teal-500" },
  { name: "James O'Brien", role: "Small Business Owner", content: "I have no technical background whatsoever, and I built a website I'm genuinely proud of. PNG Website Builders is magic.", initials: "JO", color: "bg-amber-500" },
]

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="w-[260px] sm:w-72 md:w-80 shrink-0 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm mx-2 sm:mx-3">
      <Quote className="h-5 w-5 text-primary/40 mb-3" />
      <p className="text-sm leading-relaxed text-foreground/80 mb-5">{t.content}</p>
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{t.initials}</div>
        <div>
          <p className="text-sm font-semibold leading-none mb-1">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  const row1 = [...testimonials, ...testimonials]
  const row2 = [...testimonials.slice(4), ...testimonials.slice(0, 4), ...testimonials.slice(4), ...testimonials.slice(0, 4)]

  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-28 overflow-hidden relative">
      <div className="absolute inset-0 -z-10 bg-muted/20" />
      <div className="container mx-auto px-4 mb-10 sm:mb-14 lg:mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
            Loved by creators <span className="gradient-text">worldwide</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground text-pretty leading-relaxed">
            Join thousands of satisfied users building amazing websites with PNG Website Builders.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="relative flex overflow-hidden">
          <div className="flex marquee-left">
            {row1.map((t, i) => <TestimonialCard key={`r1-${i}`} t={t} />)}
          </div>
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex marquee-right">
            {row2.map((t, i) => <TestimonialCard key={`r2-${i}`} t={t} />)}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 lg:w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 lg:w-32 bg-gradient-to-l from-background to-transparent" />
    </section>
  )
}
