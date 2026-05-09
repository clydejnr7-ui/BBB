import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') // null = came from email confirmation link

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const adminClient = createAdminClient()
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // First time ever — create profile with free credits and send welcome email
        await adminClient.from('profiles').insert({
          id: data.user.id,
          credits: 3,
        })

        if (data.user.email) {
          await sendWelcomeEmail(data.user.email)
        }
      }

      // If no explicit `next` param, this came from an email confirmation link
      // Always show the welcome page in that case
      if (!next) {
        return NextResponse.redirect(`${origin}/auth/welcome`)
      }

      // Explicit `next` means a deliberate redirect (e.g. password reset magic link)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
