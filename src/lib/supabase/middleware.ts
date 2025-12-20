import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase env vars are valid/exist
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
      db: {
        schema: 'public',
      },
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Public paths - skip all checks for better performance
  const publicPaths = ['/', '/login', '/pricing', '/method', '/auth/callback']
  const pathname = request.nextUrl.pathname
  const isPublicPath = publicPaths.includes(pathname)
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.')

  // Skip middleware for static assets and API routes
  if (isStaticAsset) {
    return response
  }

  // For public paths, only refresh session without profile query
  if (isPublicPath) {
    await supabase.auth.getUser() // Just refresh session
    return response
  }

  // Protected routes - need full auth check
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = pathname.startsWith('/login')
  const isOnboardingPage = pathname === '/onboarding'

  // No user on protected route -> redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // User exists - only query profile when necessary (login/onboarding redirects)
  if (isLoginPage || isOnboardingPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const onboardingCompleted = profile?.onboarding_completed ?? false

    if (isLoginPage) {
      return NextResponse.redirect(
        new URL(onboardingCompleted ? '/dashboard' : '/onboarding', request.url)
      )
    }

    if (onboardingCompleted && isOnboardingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}
