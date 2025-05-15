'use client';

import { usePathname } from 'next/navigation';

export default function ManagementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/management/admin/login' || pathname === '/management/staff/login';

    // Determine which role is logging in for displaying appropriate title
    let roleTitle = 'Khu vực quản lý';
    if (pathname === '/management/admin/login') {
        roleTitle = 'Đăng nhập Quản trị viên';
    } else if (pathname === '/management/staff/login') {
        roleTitle = 'Đăng nhập Nhân viên';
    }

    // Use a simpler layout for login pages
    if (isLoginPage) {
        const bgColor = pathname === '/management/admin/login' ? '#001529' : '#003a8c';

        return (
            <div className="management-auth-layout min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: bgColor }}>
                <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-white relative">
                    <div className="flex justify-center mb-6">
                        <h1 className="text-2xl font-bold text-blue-700">{roleTitle}</h1>
                    </div>
                    {children}
                </div>
            </div>
        );
    }

    // Use full management layout for other management pages
    return (
        <div className="management-layout min-h-screen bg-[#f0f2f5]">
            {children}
        </div>
    );
} 