"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Check, Loader2, Zap, CreditCard, Clock, ExternalLink } from "lucide-react"
import { CREDIT_PACKAGES } from "@/lib/types"

interface Payment {
  id: string
  amount_usd: number
  credits_purchased: number
  status: string
  created_at: string
}

export default function BillingPage() {
  const [credits, setCredits] = useState<number | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch credits
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()
        setCredits(profile?.credits ?? 0)

        // Fetch payment history
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)
        setPayments(paymentsData || [])
      }
    }
    fetchData()
  }, [supabase])

  async function handlePurchase(packageId: string, credits: number, price: number) {
    setIsLoading(packageId)
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, credits, price }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment")
      }

      // Redirect to NowPayments
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error("Payment URL not received")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initiate payment")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your credits and view payment history.
        </p>
      </div>

      {/* Current Balance */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Current Balance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">{credits ?? "..."}</span>
            <span className="text-xl text-muted-foreground">credits</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Each website generation uses 1 credit
          </p>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative flex flex-col ${pkg.popular ? "border-primary shadow-lg" : ""}`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
                  Best Value
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{pkg.credits} Credits</CardTitle>
                <CardDescription>
                  ${(pkg.price / pkg.credits).toFixed(2)} per credit
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-center">
                <div className="text-4xl font-bold">${pkg.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {pkg.credits} website generations
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Credits never expire
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Instant delivery
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pkg.id, pkg.credits, pkg.price)}
                  disabled={isLoading !== null}
                >
                  {isLoading === pkg.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Payments are processed securely via NowPayments. Crypto and fiat options available.
        </p>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <Card>
          {payments.length > 0 ? (
            <div className="divide-y">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.credits_purchased} Credits</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${payment.amount_usd}</p>
                    <Badge
                      variant={
                        payment.status === "completed"
                          ? "default"
                          : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payment history yet</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
