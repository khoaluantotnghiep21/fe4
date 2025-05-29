'use client';

import Image from 'next/image';
import { Form, Input, Button, message, Radio, AutoComplete, DatePicker } from 'antd';
import { useRouter } from 'next/navigation';
import { register, getUserByPhone, login } from '@/lib/api/authApi';
import { useUser } from '@/context/UserContext';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './register.module.css';
import moment from 'moment';

interface RegisterFormValues {
  hoten: string;
  dienthoai: string;
  ngaysinh: moment.Moment | null;
  gioitinh: string;
  thanhpho: string;
  quan: string;
  phuong: string;
  diachi: string;
  email?: string;
  matkhau: string;
  xacnhanmatkhau: string;
}

interface AddressOption {
  code: number;
  name: string;
  value: string;
}

export default function Register() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Address autocomplete states
  const [cityOptions, setCityOptions] = useState<AddressOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<AddressOption[]>([]);
  const [wardOptions, setWardOptions] = useState<AddressOption[]>([]);
  
  // Full address data
  const [allCities, setAllCities] = useState<AddressOption[]>([]);
  const [allDistricts, setAllDistricts] = useState<AddressOption[]>([]);
  const [allWards, setAllWards] = useState<AddressOption[]>([]);
  
  const [selectedCityCode, setSelectedCityCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  
  const [form] = Form.useForm();

  // Get phone number from query parameter
  const query = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialPhone = query.get('phone') || '';

  // Set initial phone number
  useEffect(() => {
    if (initialPhone) {
      form.setFieldsValue({ dienthoai: initialPhone });
    }
  }, [initialPhone, form]);

  // Fetch all cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get('https://provinces.open-api.vn/api/p/');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cities = response.data.map((item: any) => ({
          code: item.code,
          name: item.name,
          value: item.name,
        }));
        setAllCities(cities);
        setCityOptions(cities);
      } catch (error) {
        console.error('Error fetching cities:', error);
        messageApi.error('Không thể tải danh sách tỉnh/thành phố!');
      }
    };
    fetchCities();
  }, [messageApi]);

  // Debounce function
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      // eslint-disable-next-line prefer-spread
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // City search with debounce
  const debouncedCitySearch = useCallback(
    debounce((searchText: string) => {
      if (!searchText) {
        setCityOptions(allCities);
        return;
      }
      const filtered = allCities.filter(city =>
        city.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setCityOptions(filtered);
    }, 300),
    [allCities]
  );

  // District search with debounce
  const debouncedDistrictSearch = useCallback(
    debounce((searchText: string) => {
      if (!searchText) {
        setDistrictOptions(allDistricts);
        return;
      }
      const filtered = allDistricts.filter(district =>
        district.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setDistrictOptions(filtered);
    }, 300),
    [allDistricts]
  );

  // Ward search with debounce
  const debouncedWardSearch = useCallback(
    debounce((searchText: string) => {
      if (!searchText) {
        setWardOptions(allWards);
        return;
      }
      const filtered = allWards.filter(ward =>
        ward.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setWardOptions(filtered);
    }, 300),
    [allWards]
  );

  // Handle city selection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCitySelect = async (value: string, option: any) => {
    const cityCode = option.code;
    setSelectedCityCode(cityCode);
    setSelectedDistrictCode(null);
    
    // Reset dependent fields
    form.setFieldsValue({ quan_random: '', phuong_random: '' });
    setDistrictOptions([]);
    setWardOptions([]);
    setAllDistricts([]);
    setAllWards([]);

    if (!cityCode) return;

    try {
      const response = await axios.get(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const districts = response.data.districts.map((item: any) => ({
        code: item.code,
        name: item.name,
        value: item.name,
      }));
      setAllDistricts(districts);
      setDistrictOptions(districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      messageApi.error('Không thể tải danh sách quận/huyện!');
    }
  };

  // Handle district selection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDistrictSelect = async (value: string, option: any) => {
    const districtCode = option.code;
    setSelectedDistrictCode(districtCode);
    
    // Reset dependent fields
    form.setFieldsValue({ phuong_random: '' });
    setWardOptions([]);
    setAllWards([]);

    if (!districtCode) return;

    try {
      const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wards = response.data.wards.map((item: any) => ({
        code: item.code,
        name: item.name,
        value: item.name,
      }));
      setAllWards(wards);
      setWardOptions(wards);
    } catch (error) {
      console.error('Error fetching wards:', error);
      messageApi.error('Không thể tải danh sách phường/xã!');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    // Map randomized field names back to expected structure
    const mappedValues: RegisterFormValues = {
      hoten: values.hoten_random,
      dienthoai: values.dienthoai,
      ngaysinh: values.ngaysinh_random,
      gioitinh: values.gioitinh,
      thanhpho: values.thanhpho_random,
      quan: values.quan_random,
      phuong: values.phuong_random,
      diachi: values.diachi_random,
      email: values.email_random,
      matkhau: values.matkhau_random,
      xacnhanmatkhau: values.xacnhanmatkhau_random,
    };

    if (mappedValues.matkhau !== mappedValues.xacnhanmatkhau) {
      messageApi.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (!mappedValues.ngaysinh) {
      messageApi.error('Vui lòng chọn ngày sinh!');
      return;
    }

    try {
      setLoading(true);
      const existed = await getUserByPhone(mappedValues.dienthoai);
      if (existed) {
        messageApi.error('Số điện thoại đã tồn tại!');
        return;
      }

      const registerData = {
        sodienthoai: mappedValues.dienthoai,
        matkhau: mappedValues.matkhau,
        hoten: mappedValues.hoten,
        ngaysinh: mappedValues.ngaysinh.format('YYYY-MM-DD'),
        gioitinh: mappedValues.gioitinh,
        diachi: `${mappedValues.thanhpho}, ${mappedValues.quan}, ${mappedValues.phuong}, ${mappedValues.diachi}`,
        email: mappedValues.email || '',
      };

      await register(registerData);

      const loginResult = await login({
        sodienthoai: mappedValues.dienthoai,
        matkhau: mappedValues.matkhau,
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
        <h1 className={styles.title}>Đăng ký</h1>
        <Form
          form={form}
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
          autoComplete="off"
        >
          {/* Hidden input to trick autofill */}
          <input
            type="text"
            name="hidden_field"
            style={{ display: 'none' }}
            autoComplete="new-password"
          />
          
          {/* Row 1: Name and Phone */}
          <div className={styles.formRow}>
            <Form.Item
              label="Họ và tên"
              name="hoten_random"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              className={styles.formItem}
            >
              <Input
                className={styles.input}
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="dienthoai"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' },
              ]}
              className={styles.formItem}
            >
              <Input
                className={styles.input}
                disabled={!!initialPhone}
                autoComplete="off"
              />
            </Form.Item>
          </div>

          {/* Row 2: Email, Date of Birth, and Gender */}
          <div className={styles.formRow}>
            <Form.Item
              label="Email"
              name="email_random"
              rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
              className={styles.formItem}
            >
              <Input
                className={styles.input}
                placeholder="Không bắt buộc"
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item
              label="Ngày sinh"
              name="ngaysinh_random"
              rules={[{ required: true, message: 'Vui lòng chọn ngày sinh!' }]}
              className={styles.formItem}
            >
              <DatePicker
                className={styles.input}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                autoComplete="off"
              />
            </Form.Item>
          </div>

          <div className={styles.formRow}>
            <Form.Item
              label="Giới tính"
              name="gioitinh"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
              className={styles.formItem}
            >
              <Radio.Group className={styles.radioGroup}>
                <Radio value="Nam">Nam</Radio>
                <Radio value="Nữ">Nữ</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Row 3: City and District */}
          <div className={styles.formRow}>
            <Form.Item
              label="Tỉnh/Thành phố"
              name="thanhpho_random"
              rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố!' }]}
              className={styles.formItem}
            >
              <AutoComplete
                className={styles.input}
                options={cityOptions}
                onSearch={debouncedCitySearch}
                onSelect={handleCitySelect}
                placeholder="Nhập để tìm kiếm tỉnh/thành phố"
                filterOption={false}
              />
            </Form.Item>

            <Form.Item
              label="Quận/Huyện"
              name="quan_random"
              rules={[{ required: true, message: 'Vui lòng chọn quận/huyện!' }]}
              className={styles.formItem}
            >
              <AutoComplete
                className={styles.input}
                options={districtOptions}
                onSearch={debouncedDistrictSearch}
                onSelect={handleDistrictSelect}
                placeholder="Nhập để tìm kiếm quận/huyện"
                disabled={!selectedCityCode}
                filterOption={false}
              />
            </Form.Item>
          </div>

          {/* Row 4: Ward and Specific Address */}
          <div className={styles.formRow}>
            <Form.Item
              label="Phường/Xã"
              name="phuong_random"
              rules={[{ required: true, message: 'Vui lòng chọn phường/xã!' }]}
              className={styles.formItem}
            >
              <AutoComplete
                className={styles.input}
                options={wardOptions}
                onSearch={debouncedWardSearch}
                placeholder="Nhập để tìm kiếm phường/xã"
                disabled={!selectedDistrictCode}
                filterOption={false}
              />
            </Form.Item>

            <Form.Item
              label="Địa chỉ cụ thể"
              name="diachi_random"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể!' }]}
              className={styles.formItem}
            >
              <Input
                className={styles.input}
                placeholder="Số nhà, tên đường"
                autoComplete="off"
              />
            </Form.Item>
          </div>

          {/* Row 5: Passwords */}
          <div className={styles.formRow}>
            <Form.Item
              label="Mật khẩu"
              name="matkhau_random"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
              className={styles.formItem}
            >
              <Input.Password
                className={styles.input}
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="xacnhanmatkhau_random"
              dependencies={['matkhau_random']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('matkhau_random') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
              className={styles.formItem}
            >
              <Input.Password
                className={styles.input}
                autoComplete="new-password"
              />
            </Form.Item>
          </div>

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