import { NextResponse, type NextRequest } from "next/server";

// Define admin and staff protected paths
const ADMIN_PROTECTED_PATHS = ["/management/dashboard"];
const STAFF_PROTECTED_PATHS = ["/management/orders/create"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value || "";

  const userDataCookie = request.cookies.get("user_information")?.value;
  let userData = null;

  try {
    if (userDataCookie) {
      userData = JSON.parse(userDataCookie);
    }
  } catch (e) {
    console.error("Error parsing user data:", e);
  }

  // Check if the user has the required role
  const isAdmin = userData?.roles?.includes("admin");
  const isStaff = userData?.roles?.includes("staff");

  // Create the response object
  let response;

  // Admin route protection
  if (ADMIN_PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!token || !isAdmin) {
      return NextResponse.redirect(
        new URL("/management/admin/login", request.url)
      );
    }
  }

  // Staff route protection
  if (STAFF_PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    if (!token || !isStaff) {
      return NextResponse.redirect(
        new URL("/management/staff/login", request.url)
      );
    }
  }

  // Handle legacy redirect for the old login path
  if (pathname === "/management/login") {
    return NextResponse.redirect(
      new URL("/management/admin/login", request.url)
    );
  }

  // Proceed with the original request
  response = NextResponse.next();

  // Add security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Add cache headers for static assets
  if (
    pathname.match(/\.(css|js|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/i)
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }
  // Add cache headers for API responses to prevent caching
  else if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
  }
  // Add reasonable cache for HTML pages
  else {
    response.headers.set("Cache-Control", "s-maxage=1, stale-while-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/management/dashboard/:path*",
    "/management/orders/:path*",
    "/management/login",
  ],
};
