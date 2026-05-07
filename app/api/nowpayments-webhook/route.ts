import { createAdminClient } from "@/lib/supabase/admin"
import { sendPaymentReceiptEmail } from "@/lib/email"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-nowpayments-sig")

    // Verify webhook signature
    if (process.env.NOWPAYMENTS_IPN_SECRET && signature) {
      const hmac = crypto.createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET)
      
      // Sort the JSON object keys and create the signature
      const jsonBody = JSON.parse(body)
      const sortedKeys = Object.keys(jsonBody).sort()
      const sortedObj: Record<string, unknown> = {}
      sortedKeys.forEach(key => {
        sortedObj[key] = jsonBody[key]
      })
      
      hmac.update(JSON.stringify(sortedObj))
      const calculatedSignature = hmac.digest("hex")

      if (calculatedSignature !== signature) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    const { payment_id, payment_status, order_id } = data

    // Only process completed payments
    if (payment_status !== "finished" && payment_status !== "confirmed") {
      return NextResponse.json({ received: true })
    }

    const adminClient = createAdminClient()

    // Find the payment record
    const { data: payment, error: findError } = await adminClient
      .from("payments")
      .select("*")
      .eq("nowpayments_payment_id", payment_id)
      .single()

    if (findError || !payment) {
      // Try to find by order_id pattern
      const userId = order_id?.split("-")[0]
      if (!userId) {
        console.error("Payment not found:", payment_id)
        return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      }
    }

    if (payment) {
      // Check if already processed (prevent double-credit)
      if (payment.status === "completed") {
        return NextResponse.json({ message: "Already processed" })
      }

      // Update payment status
      await adminClient
        .from("payments")
        .update({ status: "completed" })
        .eq("id", payment.id)

      // Add credits to user
      const { data: profile } = await adminClient
        .from("profiles")
        .select("credits")
        .eq("id", payment.user_id)
        .single()

      if (profile) {
        await adminClient
          .from("profiles")
          .update({ credits: profile.credits + payment.credits_purchased })
          .eq("id", payment.user_id)
      }

      // Send payment receipt email
      const { data: { user: paymentUser } } = await adminClient.auth.admin.getUserById(payment.user_id)
      if (paymentUser?.email) {
        await sendPaymentReceiptEmail(paymentUser.email, payment.credits_purchased, payment.amount_usd)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
