import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  
  // Allow all API routes to pass through
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  // Public routes that don't require authentication
  if (pathname === "/" || pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (token) {
    // Redirect to onboarding if not completed
    if (!token.onboardingCompleted && !pathname.startsWith("/onboarding")) {
      const onboardingUrl = new URL("/onboarding", request.url);
      return NextResponse.redirect(onboardingUrl);
    }
    
    // Redirect to appropriate dashboard based on role
    if (token.onboardingCompleted && pathname === "/") {
      if (token.role === "ADMIN") {
        const adminUrl = new URL("/admin", request.url);
        return NextResponse.redirect(adminUrl);
      } else if (token.role === "EMPLOYEE") {
        const employeeUrl = new URL("/employee", request.url);
        return NextResponse.redirect(employeeUrl);
      }
    }
    
    // Protect admin routes
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
    
    // Protect employee routes
    if (pathname.startsWith("/employee") && token.role !== "EMPLOYEE") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  } else {
    // Redirect to signin if not authenticated and trying to access protected routes
    if (!pathname.startsWith("/auth/") && !pathname.startsWith("/api/")) {
      const signInUrl = new URL("/auth/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
    '/onboarding/:path*',
    '/dashboard/:path*',
   
  ],
};