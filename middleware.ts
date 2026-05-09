import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MAIN_DOMAINS = [
  'pngwebsitebuilders.site',
  'www.pngwebsitebuilders.site',
]

export async function middleware(request: NextRequest) {
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase()

  // ── Custom domain routing ────────────────────────────────────────────────
  const isMainDomain = MAIN_DOMAINS.includes(hostname)
  const isLocalOrVercel =
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.replit.dev') ||
    hostname.endsWith('.replit.app')

  if (!isMainDomain && !isLocalOrVercel) {
    // Rewrite to custom domain handler — preserves host header
    const url = request.nextUrl.clone()
    url.pathname = '/api/custom-domain'
    return NextResponse.rewrite(url)
  }

  // ── Supabase auth (existing logic) ─────────────────────────────────────
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/generate', '/account', '/billing']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const authPaths = ['/auth/login', '/auth/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
