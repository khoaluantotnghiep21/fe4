'use client';

import RoleLogin from '@/components/auth/RoleLogin';

export default function AdminLoginPage() {
    return <RoleLogin role="admin" redirectPath="/management/dashboard" />;
} 