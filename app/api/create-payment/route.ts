import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { CREDIT_PACKAGES } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, credits, price } = body

    // Validate package
    const validPackage = CREDIT_PACKAGES.find(
      (pkg) => pkg.id === packageId && pkg.credits === credits && pkg.price === price
    )

    if (!validPackage) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 })
    }

    // Create NowPayments invoice
    const nowPaymentsResponse = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: "usd",
        order_id: `${user.id}-${Date.now()}`,
        order_description: `${credits} SiteForge Credits`,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/nowpayments-webhook`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
      }),
    })

    if (!nowPaymentsResponse.ok) {
      const errorData = await nowPaymentsResponse.json()
      console.error("NowPayments error:", errorData)
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
    }

    const paymentData = await nowPaymentsResponse.json()

    // Store pending payment in database
    const adminClient = createAdminClient()
    await adminClient.from("payments").insert({
      user_id: user.id,
      amount_usd: price,
      credits_purchased: credits,
      nowpayments_payment_id: paymentData.id,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentData.invoice_url,
      paymentId: paymentData.id,
    })
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
