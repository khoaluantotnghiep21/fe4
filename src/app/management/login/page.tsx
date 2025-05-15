'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyLoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/management/admin/login');
    }, [router]);

    return <div className="flex justify-center items-center min-h-screen">Đang chuyển hướng...</div>;
} 