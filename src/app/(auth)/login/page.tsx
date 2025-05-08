'use client';

import Image from 'next/image';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import styles from './login.module.css';


export default function Login() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { setUser } = useUser(); 

  const onFinish = async (values: { dienthoai: string; matkhau: string }) => {
    try {
      const user = await login(values);
      if (user) {
        messageApi.success('Đăng nhập thành công!');

        localStorage.setItem('user', JSON.stringify(user));
        setUser(user); 
        router.push('/'); 
      } else {
        messageApi.error('Số điện thoại hoặc mật khẩu không đúng');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      messageApi.error('Đã có lỗi xảy ra, vui lòng thử lại');
    }
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <Image
        src="/assets/icons/background1.svg"
        alt=""
        width={100}
        height={100}
        className={styles.background1}
        role="presentation"
      />
      <Image
        src="/assets/icons/background2.svg"
        alt=""
        width={100}
        height={100}
        className={styles.background2}
        role="presentation"
      />
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Đăng nhập</h1>
        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            label="Số điện thoại"
            name="dienthoai"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              {
                pattern: /^[0-9]{10}$/,
                message: 'Số điện thoại phải có 10 chữ số!',
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" className={styles.input} />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="matkhau"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" className={styles.input} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.submitButton}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}