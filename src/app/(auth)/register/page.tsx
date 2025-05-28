"use client";

import Image from 'next/image';
import { Form, Input, Button, message, Radio } from 'antd';
import { useRouter } from 'next/navigation';
import { register, getUserByPhone, login } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import styles from './register.module.css';
import { useState } from 'react';

interface RegisterFormValues {
  hoten: string;
  dienthoai: string;
  gioitinh: string;
  diachi: string;
  email?: string;
  matkhau: string;
  xacnhanmatkhau: string;
}

export default function Register() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterFormValues) => {
    if (values.matkhau !== values.xacnhanmatkhau) {
      messageApi.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      const existed = await getUserByPhone(values.dienthoai);
      if (existed) {
        messageApi.error('Số điện thoại đã tồn tại!');
        return;
      }

      const registerData = {
        sodienthoai: values.dienthoai,
        matkhau: values.matkhau,
        hoten: values.hoten,
        gioitinh: values.gioitinh,
        diachi: values.diachi,
        email: values.email || '' // Sử dụng chuỗi rỗng thay vì null
      };

      // Đăng ký tài khoản
      await register(registerData);
      
      // Tự động đăng nhập sau khi đăng ký thành công
      const loginResult = await login({
        sodienthoai: values.dienthoai,
        matkhau: values.matkhau
      });

      if (loginResult) {
        setUser(loginResult);
        messageApi.success('Đăng ký và đăng nhập thành công!');
        router.push('/');
      } else {
        messageApi.error('Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại!');
        router.push('/login');
      }
    } catch (err) {
      console.error('Error during registration:', err);
      messageApi.error('Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
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
          <Form.Item 
            label="Họ và tên" 
            name="hoten" 
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input className={styles.input} />
          </Form.Item>

          <Form.Item 
            label="Số điện thoại" 
            name="dienthoai" 
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
            ]}
          >
            <Input className={styles.input} />
          </Form.Item>

          <Form.Item 
            label="Email" 
            name="email" 
            rules={[
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input className={styles.input} placeholder="Không bắt buộc" />
          </Form.Item>

          <Form.Item 
            label="Giới tính" 
            name="gioitinh"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
          >
            <Radio.Group className="w-full flex justify-between">
              <Radio value="Nam">Nam</Radio>
              <Radio value="Nữ">Nữ</Radio>
              <Radio value="Khác">Khác</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item 
            label="Địa chỉ" 
            name="diachi"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input.TextArea 
              className={styles.input} 
              placeholder="Nhập địa chỉ chi tiết"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu" 
            name="matkhau" 
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password className={styles.input} />
          </Form.Item>

          <Form.Item 
            label="Xác nhận mật khẩu" 
            name="xacnhanmatkhau" 
            dependencies={["matkhau"]} 
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('matkhau') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password className={styles.input} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className={styles.submitButton}
              loading={loading}
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}