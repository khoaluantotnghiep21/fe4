'use client';

import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { login, getUserByPhone } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import { useState } from 'react';

export default function ManagementLogin() {
    const router = useRouter();
    const { setUser } = useUser();
    const [step, setStep] = useState<'phone' | 'password'>('phone');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePhoneSubmit = async (values: { dienthoai: string }) => {
        setLoading(true);
        try {
            const user = await getUserByPhone(values.dienthoai);

            if (user) {
                // Check if user has admin or staff role
                if (user.roles && (user.roles.includes('admin') || user.roles.includes('staff'))) {
                    setPhone(values.dienthoai);
                    setStep('password');
                } else {
                    message.error('Tài khoản không có quyền truy cập khu vực quản lý!');
                }
            } else {
                message.error('Số điện thoại không tồn tại!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (values: { matkhau: string }) => {
        setLoading(true);
        try {
            const user = await login({ sodienthoai: phone, matkhau: values.matkhau });

            if (user) {
                if (user.roles) {
                    if (user.roles.includes('admin')) {
                        message.success('Đăng nhập thành công!');
                        setUser(user);
                        router.push('/management/dashboard');
                    } else if (user.roles.includes('staff')) {
                        message.success('Đăng nhập thành công!');
                        setUser(user);
                        router.push('/management/orders/create');
                    } else {
                        message.error('Tài khoản không có quyền truy cập khu vực quản lý!');
                    }
                } else {
                    message.error('Tài khoản không có quyền truy cập khu vực quản lý!');
                }
            } else {
                message.error('Mật khẩu không đúng!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-xl font-semibold mb-6 text-center">Đăng nhập hệ thống quản lý</h1>
            {step === 'phone' && (
                <Form
                    name="management_phone_form"
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
                    name="management_login_form"
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