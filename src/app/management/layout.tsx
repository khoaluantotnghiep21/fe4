'use client';

import { usePathname } from 'next/navigation';

export default function ManagementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/management/login';

    // Use a simpler layout for login page
    if (isLoginPage) {
        return (
            <div className="management-auth-layout min-h-screen flex flex-col items-center justify-center bg-[#001529]">
                <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-white relative">
                    <div className="flex justify-center mb-6">
                        <h1 className="text-2xl font-bold text-blue-700">Khu vực quản lý</h1>
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