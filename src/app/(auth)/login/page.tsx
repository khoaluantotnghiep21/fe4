'use client';

import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { login, getUserByPhone } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import styles from './login.module.css';
import { useState } from 'react';

export default function Login() {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState<'phone' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (values: { dienthoai: string }) => {
    setLoading(true);
    try {
      const user = await getUserByPhone(values.dienthoai);

      console.log('user', user);

      if (user) {
        setPhone(values.dienthoai);
        console.log('values.dienthoai', values.dienthoai);
        setStep('password');
      } else {
        message.error('Số điện thoại chưa đăng ký!');
        router.push('/register');
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
        message.success('Đăng nhập thành công!');
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);


        if (user.roles && user.roles.includes(('admin'))) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        message.error('Mật khẩu không đúng!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Đăng nhập</h1>
      {step === 'phone' && (
        <Form
          name="phone_form"
          onFinish={handlePhoneSubmit}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            label="Số điện thoại"
            name="dienthoai"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" className={styles.input} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.submitButton} loading={loading}>
              Tiếp tục
            </Button>
          </Form.Item>
        </Form>
      )}
      {step === 'password' && (
        <Form
          name="login_form"
          onFinish={handleLogin}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item label="Số điện thoại">
            <Input value={phone} disabled className={styles.input} />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="matkhau"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" className={styles.input} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.submitButton} loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>

  );
}