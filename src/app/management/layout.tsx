'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/management/admin/login' || pathname === '/management/staff/login';
  const isStaffLoginPage = pathname === '/management/staff/login';

  let title = 'Chào mừng trở lại!';

  if (isLoginPage) {

    return (
      <div className="management-auth-layout relative min-h-screen w-full flex items-center justify-center">
        <Image
          src="/assets/images/bg-login-admin.png"
          alt="Staff/Admin Login Background"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          className="z-0"
          priority
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 flex flex-col justify-center items-center p-6 sm:p-8 w-full max-w-md bg-[#4a4d53]/90 rounded-lg shadow-lg">
          <Image
            src="/assets/images/logo.png"
            alt="logo"
            width={120}
            height={40}
            className="object-cover mb-4"
            priority
          />
          <h2 className="text-xl font-semibold text-white text-center mb-4">
            {title}
          </h2>
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="management-layout min-h-screen bg-[#f0f2f5]">
      {children}
    </div>
  );
}