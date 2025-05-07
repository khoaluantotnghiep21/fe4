import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hàm giả lập lấy role (thay bằng logic thật: check JWT, session, cookie)
function getUserRole(request: NextRequest): string | null {
  const token = request.cookies.get('token')?.value;
  // Giả lập: trả về 'admin', 'user', hoặc null (guest)
  return token ? 'user' : null; // Thay bằng logic xác thực (ví dụ: decode JWT)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getUserRole(request);

  // Cho phép guest (chưa đăng nhập) vào /login và /register
  if (pathname === '/login' || pathname === '/register') {
    if (role) {
      // Nếu đã đăng nhập (user/admin), redirect về trang chủ
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next(); // Guest được vào /login, /register
  }

  // Bảo vệ route /admin (chỉ admin)
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Bảo vệ route /profile (chỉ user hoặc  (chỉ user hoặc admin)
  if (pathname.startsWith('/profile')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Các route khác (như /products, /cart) cho phép tất cả
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/admin/:path*', '/profile/:path*'],
};