"use client";

import Image from 'next/image';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { register, getUserByPhone } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import styles from './register.module.css';

export default function Register() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { setUser } = useUser();

  const onFinish = async (values: { hoten: string; dienthoai: string; email: string; matkhau: string; xacnhanmatkhau: string }) => {
    if (values.matkhau !== values.xacnhanmatkhau) {
      messageApi.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const existed = await getUserByPhone(values.dienthoai);
      if (existed) {
        messageApi.error('Số điện thoại đã tồn tại!');
        return;
      }
      const user = await register({
        hoten: values.hoten,
        sodienthoai: values.dienthoai,
        matkhau: values.matkhau,
        email: values.email,
      });
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      messageApi.success('Đăng ký thành công!');
      router.push('/');
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
        <h1 className={styles.title}>Đăng ký</h1>
        <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item label="Họ và tên" name="hoten" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}> <Input className={styles.input} /> </Form.Item>
          <Form.Item label="Số điện thoại" name="dienthoai" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }, { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }]}> <Input className={styles.input} /> </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}> <Input className={styles.input} /> </Form.Item>
          <Form.Item label="Mật khẩu" name="matkhau" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}> <Input.Password className={styles.input} /> </Form.Item>
          <Form.Item label="Xác nhận mật khẩu" name="xacnhanmatkhau" dependencies={["matkhau"]} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }]}> <Input.Password className={styles.input} /> </Form.Item>
          <Form.Item> <Button type="primary" htmlType="submit" className={styles.submitButton}>Đăng ký</Button> </Form.Item>
        </Form>
      </div>
    </div>
  );
}