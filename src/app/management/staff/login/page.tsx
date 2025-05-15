'use client';

import RoleLogin from '@/components/auth/RoleLogin';

export default function StaffLoginPage() {
    return <RoleLogin role="staff" redirectPath="/management/orders/create" />;
} 