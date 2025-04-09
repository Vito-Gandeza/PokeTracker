import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/',
  '/test',
  '/browse',
  '/shop',
  '/shop/sets',
  '/shop/cards',
  '/shop/featured',
  '/tracker'
];

// Function to check if a path starts with any of the public routes
const startsWithPublicRoute = (path: string) => {
  return publicRoutes.some(route =>
    path === route || path.startsWith(`${route}/`)
  );
};

const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q'

export async function middleware(request: NextRequest) {
  // Check if the current path is in public routes
  const isPublicRoute = startsWithPublicRoute(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith('/_next');

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Allow access to public routes regardless of authentication status
  if (isPublicRoute) {
    return response
  }

  // If user is not signed in and trying to access a protected route, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is signed in and trying to access login/signup pages, redirect to home
  if (session && ['/login', '/signup', '/forgot-password', '/reset-password'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // For all other cases, proceed with the request
  return response
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
