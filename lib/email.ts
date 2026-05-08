import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: "SiteForge <noreply@pngwebsitebuilders.site>",
      to: email,
      subject: "Welcome to SiteForge - Your 3 Free Credits Await!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .content { background: #f9fafb; border-radius: 12px; padding: 32px; }
            .credits-badge { display: inline-block; background: #7c3aed; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 16px 0; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SiteForge</div>
            </div>
            <div class="content">
              <h1 style="margin-top: 0;">Welcome to SiteForge!</h1>
              <p>Thank you for joining us. You're now part of a community of creators building amazing websites with AI.</p>
              <p>Your account has been credited with:</p>
              <div class="credits-badge">3 Free Credits</div>
              <p>Each credit allows you to generate one stunning, responsive website. Just describe what you want, and our AI will create it for you.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Start Building</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SiteForge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }
}

export async function sendPaymentReceiptEmail(
  email: string,
  credits: number,
  amount: number
) {
  try {
    await resend.emails.send({
      from: "SiteForge <noreply@siteforge.ai>",
      to: email,
      subject: `Payment Confirmed - ${credits} Credits Added`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .content { background: #f9fafb; border-radius: 12px; padding: 32px; }
            .receipt-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .receipt-total { font-weight: bold; font-size: 18px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SiteForge</div>
            </div>
            <div class="content">
              <h1 style="margin-top: 0;">Payment Confirmed!</h1>
              <p>Your payment has been processed successfully. Here are your receipt details:</p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div class="receipt-item">
                  <span>Credits Purchased</span>
                  <span>${credits} credits</span>
                </div>
                <div class="receipt-item receipt-total">
                  <span>Amount Paid</span>
                  <span>$${amount.toFixed(2)} USD</span>
                </div>
              </div>
              <p>Your credits have been added to your account and are ready to use.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/generate" class="button">Generate a Website</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SiteForge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Failed to send payment receipt email:", error)
  }
}

export async function sendGenerationFailedEmail(email: string, projectName: string) {
  try {
    await resend.emails.send({
      from: "SiteForge <noreply@siteforge.ai>",
      to: email,
      subject: `Generation Failed - ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .content { background: #f9fafb; border-radius: 12px; padding: 32px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SiteForge</div>
            </div>
            <div class="content">
              <h1 style="margin-top: 0;">Generation Failed</h1>
              <p>Unfortunately, we encountered an issue while generating your website "${projectName}".</p>
              <p>Don't worry - no credits have been deducted from your account. Please try again, and if the issue persists, contact our support team.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/generate" class="button">Try Again</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SiteForge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Failed to send generation failed email:", error)
  }
}
