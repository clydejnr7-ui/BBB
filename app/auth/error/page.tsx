import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Link Expired</CardTitle>
        <CardDescription>
          This confirmation link has already been used or expired
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Email confirmation links can only be used once and expire after 24 hours.
          If you already confirmed your email, just sign in below.
          Otherwise, sign up again to get a new link.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 w-full">
        <Link href="/auth/login" className="w-full">
          <Button className="w-full glow font-semibold">Sign In</Button>
        </Link>
        <Link href="/auth/signup" className="w-full">
          <Button variant="outline" className="w-full">Create New Account</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
