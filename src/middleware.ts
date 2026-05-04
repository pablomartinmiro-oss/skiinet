import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const useSecureCookies =
  (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith(
    "https://"
  );
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const SESSION_COOKIE_NAME = `${cookiePrefix}authjs.session-token`;

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/contacto",
  "/s/",
  "/api/auth",
  "/api/health",
  "/api/contact",
  "/api/crm/webhooks",
  "/api/crm/oauth",
  "/api/crm/redsys",
  "/api/payments/redsys/notification",
  "/api/cron/sync",
  "/api/cron/quote-reminders",
  "/api/cron/lock-time-entries",
  "/api/onboarding",
  "/api/storefront",
  "/api/reviews/public",
  "/api/ticketing/redeem",
  "/api/survey",
  "/api/voucher",
  "/api/webhooks/twilio",
  "/api/webhooks/vapi",
  "/survey",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public payment result pages (Redsys redirect targets)
  if (/^\/presupuestos\/[^/]+\/(success|error)$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check JWT token (edge-compatible, no DB access)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    secureCookie: useSecureCookies,
  });

  // Not authenticated → redirect to login (pages) or 401 (API)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but on login page → redirect to dashboard
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Onboarding check: if tenant hasn't completed onboarding, redirect
  const onboardingComplete = token.onboardingComplete as boolean | undefined;
  if (
    onboardingComplete === false &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // If onboarding is complete but user is on /onboarding, redirect to dashboard
  if (onboardingComplete === true && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
