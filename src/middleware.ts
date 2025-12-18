import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Add cache headers for better performance
  // Static assets get long cache, dynamic pages get short cache with revalidation
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/_next/static')) {
    // Static assets: cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (!pathname.startsWith('/api')) {
    // HTML pages: allow bfcache with small stale-while-revalidate
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    // Explicitly allow bfcache
    response.headers.delete('Cache-Control')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

