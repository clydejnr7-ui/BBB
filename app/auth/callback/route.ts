import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

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
        // New user — create profile and send welcome email
        await adminClient.from('profiles').insert({
          id: data.user.id,
          credits: 3,
        })

        if (data.user.email) {
          await sendWelcomeEmail(data.user.email)
        }

        // Send new users to the welcome page
        return NextResponse.redirect(`${origin}/auth/welcome`)
      }

      // Returning user (e.g. magic link login) — go to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
