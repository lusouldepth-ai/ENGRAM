import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths that should not trigger redirects
  const publicPaths = ['/', '/login', '/pricing', '/method', '/auth/callback']
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname)
  
  // Auth Routes Protection
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Onboarding Logic
  if (user) {
    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const isOnboardingPage = request.nextUrl.pathname === '/onboarding'
    // const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    
    // 1. If User is logged in BUT onboarding not completed -> Force to /onboarding
    // Changed Logic: If profile exists and not completed, force redirect UNLESS already on onboarding page
    // We should actully BLOCK dashboard access here.
    if (profile && !profile.onboarding_completed) {
        if (!isOnboardingPage) {
             return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    // 2. If User is logged in AND onboarding completed -> Redirect away from /onboarding
    if (profile && profile.onboarding_completed && isOnboardingPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect logged in users from auth pages (Login)
  // ONLY if they are NOT being redirected to onboarding (handled above)
  if (request.nextUrl.pathname.startsWith('/login') && user) {
      const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
      
      if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
      } else {
          return NextResponse.redirect(new URL('/dashboard', request.url))
      }
  }

  return response
}
