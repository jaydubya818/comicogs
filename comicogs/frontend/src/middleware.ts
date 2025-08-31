import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAlpha, isEmailInAlphaAllowlist } from './lib/release';

/**
 * Alpha access control middleware
 * Protects routes when NEXT_PUBLIC_RELEASE_CHANNEL=alpha
 */
export async function middleware(request: NextRequest) {
  // Skip middleware for non-alpha releases
  if (!isAlpha) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow public routes in alpha
  const publicRoutes = [
    '/api/auth',
    '/login',
    '/signup', 
    '/invite',
    '/_next',
    '/favicon.ico',
    '/api/health'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user's email is in allowlist
  const userEmail = token.email as string;
  if (!isEmailInAlphaAllowlist(userEmail)) {
    // Redirect to access denied page
    const deniedUrl = new URL('/access-denied', request.url);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ]
};
