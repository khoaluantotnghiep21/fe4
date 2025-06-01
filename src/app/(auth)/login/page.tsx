'use client';

import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { login, getUserByPhone } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import { useState } from 'react';
import Image from 'next/image';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const { setUser } = useUser();
  const [step, setStep] = useState<'phone' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handlePhoneSubmit = async (values: { dienthoai: string }) => {
    setLoading(true);
    try {
      const user = await getUserByPhone(values.dienthoai);

      if (user) {
        setPhone(values.dienthoai);
        setStep('password');
      } else {
        messageApi.error('Số điện thoại chưa đăng ký!');
        router.push(`/register?phone=${encodeURIComponent(values.dienthoai)}`);
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
        messageApi.success('Đăng nhập thành công!');
        setUser(user);
        router.push('/');
      } else {
        messageApi.error('Mật khẩu không đúng!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div className={styles.imageSection}>
        <Image
          src="/assets/images/regis.png"
          alt="Nhà thuốc Long Châu - Đi phượt 63 tỉnh thành Việt Nam"
          width={400}
          height={600}
          className={styles.sideImage}
          priority
        />
      </div>
      
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
              className={styles.formItem}
            >
              <Input placeholder="Nhập số điện thoại" className={styles.input} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles.submitButton}
                loading={loading}
              >
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
            <Form.Item
              label="Số điện thoại"
              className={styles.formItem}
            >
              <Input value={phone} disabled className={styles.input} />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="matkhau"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              className={styles.formItem}
            >
              <Input.Password placeholder="Nhập mật khẩu" className={styles.input} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles.submitButton}
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
}