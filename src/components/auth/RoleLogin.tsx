'use client';

import { Form, Input, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { login, getUserByPhone, getUserRole } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import { useState } from 'react';
import { Alert } from 'antd';

interface RoleLoginProps {
    role: 'admin' | 'staff';
    redirectPath: string;
}

export default function RoleLogin({ role, redirectPath }: RoleLoginProps) {
    const router = useRouter();
    const { setUser } = useUser();
    const [step, setStep] = useState<'phone' | 'password'>('phone');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const roleName = role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
    const roleTitle = role === 'admin' ? 'quản trị' : 'bán hàng';

    const handlePhoneSubmit = async (values: { dienthoai: string }) => {
        setLoading(true);
        setError('');
        try {
            const user = await getUserByPhone(values.dienthoai);
            console.log('User data:', user);

            if (user) {
                const userRole = await getUserRole(user.id);
                console.log('User role:', userRole);

                if (userRole && userRole.roles && userRole.roles.includes(role)) {
                    console.log(`User has ${role} role, proceeding to password step`);
                    setPhone(values.dienthoai);
                    setStep('password');
                    // Fallback to user.roles if available
                } else if (user.roles && user.roles.includes(role)) {
                    console.log(`Using user.roles directly, user has ${role} role`);
                    setPhone(values.dienthoai);
                    setStep('password');
                } else {
                    console.log(`User doesn't have ${role} role`);
                    setError(`Tài khoản không có quyền truy cập khu vực ${roleTitle}!`);
                }
            } else {
                setError('Số điện thoại không tồn tại!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setError('Có lỗi xảy ra khi kiểm tra số điện thoại.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (values: { matkhau: string }) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const user = await login({ sodienthoai: phone, matkhau: values.matkhau });
            console.log('Login response user:', user);

            if (user) {
                const userRole = await getUserRole(user.id);
                console.log('Login user role:', userRole);

                // Check if userRole has the required role
                if (userRole && userRole.roles && userRole.roles.includes(role)) {
                    console.log(`Login: User has ${role} role from userRole`);
                    setSuccess('Đăng nhập thành công!');
                    setUser({ ...user, roles: userRole.roles }); // Make sure user has the roles
                    router.push(redirectPath);
                    // Fallback to user.roles if available
                } else if (user.roles && user.roles.includes(role)) {
                    console.log(`Login: User has ${role} role from user object`);
                    setSuccess('Đăng nhập thành công!');
                    setUser(user);
                    router.push(redirectPath);
                } else {
                    console.log(`Login: User doesn't have ${role} role`);
                    setError(`Tài khoản không có quyền truy cập khu vực ${roleTitle}!`);
                }
            } else {
                setError('Mật khẩu không đúng!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setError('Có lỗi xảy ra khi đăng nhập.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-xl font-semibold mb-6 text-center">Đăng nhập {roleName}</h1>

            {error && (
                <div className="mb-4">
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setError('')}
                    />
                </div>
            )}

            {success && (
                <div className="mb-4">
                    <Alert
                        message={success}
                        type="success"
                        showIcon
                        closable
                        onClose={() => setSuccess('')}
                    />
                </div>
            )}

            {step === 'phone' && (
                <Form
                    name={`${role}_phone_form`}
                    onFinish={handlePhoneSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        label="Số điện thoại"
                        name="dienthoai"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' },
                        ]}
                    >
                        <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                            Tiếp tục
                        </Button>
                    </Form.Item>
                </Form>
            )}
            {step === 'password' && (
                <Form
                    name={`${role}_login_form`}
                    onFinish={handleLogin}
                    layout="vertical"
                >
                    <Form.Item label="Số điện thoại">
                        <Input value={phone} disabled />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu"
                        name="matkhau"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            )}
        </div>
    );
} 