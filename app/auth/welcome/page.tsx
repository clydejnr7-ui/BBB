import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">
          You&apos;re all set! 🎉
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your email has been confirmed. Welcome to PNG Website Builders —
          you have <strong className="text-foreground">3 free credits</strong> ready to use.
        </p>

        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-5 py-2.5 text-sm font-medium mb-8">
          <Sparkles className="h-4 w-4" />
          3 free credits added to your account
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/generate">
            <Button size="lg" className="w-full glow font-semibold">
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
