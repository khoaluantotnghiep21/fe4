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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/management/dashboard/:path*",
    "/management/orders/:path*",
    "/management/login",
  ],
};
