'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Form, Input, Radio, Button, Spin, Alert, Divider, Tabs, Select, Switch, Modal, message } from 'antd';
import { useUser } from '@/context/UserContext';
import { useLoading } from '@/context/LoadingContext';
import { createGiaoHang, createPurchaseOrder, CreatePurchaseOrderRequest, createVnpayOrder, GiaoHangDTO } from '@/lib/api/orderApi';
import { useCartStore } from '@/store/cartStore';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import axios from 'axios';
import { findPharmacyByProvinces } from '@/lib/api/pharmacyService';
dayjs.locale('vi');

interface CheckoutData {
  items: any[];
  subtotal: number;
  directDiscount: number;
  voucherDiscount: number;
  totalSavings: number;
  finalTotal: number;
}

const { TabPane } = Tabs;
const { Option } = Select;

export default function Checkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const { removeItem } = useCartStore();
  const [form] = Form.useForm();
  const [name, setName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup'>('delivery');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [machinhanh, setMachinhanh] = useState('');
  const [selectedTime, setSelectedTime] = useState('07:00 - 08:00');
  const [displayTime, setDisplayTime] = useState(`Từ 07:00 - 08:00 Hôm nay, ${dayjs().format('DD/MM/YYYY')}`);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [districtOptions, setDistrictOptions] = useState<any[]>([]);
  const [selectedCityCode, setSelectedCityCode] = useState<number | null>(null);
  const [pharmacyData, setPharmacyData] = useState<any[]>([]);

  // Tạo danh sách ngày (hôm nay + 3 ngày tới)
  const days = Array.from({ length: 4 }, (_, i) => {
    const d = dayjs().add(i, 'day');
    return {
      value: d.format('YYYY-MM-DD'),
      label: i === 0 ? `Hôm nay, ${d.format('DD/MM/YYYY')}` : `${d.format('dddd, DD/MM/YYYY')}`
    };
  });
  const timeSlots = [
    '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
    '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
    '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'
  ];

  const handleOpenTimeModal = () => setShowTimeModal(true);
  const handleCloseTimeModal = () => setShowTimeModal(false);
  const handleConfirmTime = () => {
    const dayLabel = days.find(d => d.value === selectedDate)?.label || '';
    setDisplayTime(`Từ ${selectedTime} ${dayLabel}`);
    setShowTimeModal(false);
  };

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(data));
        setCheckoutData(decodedData);
      } catch (error) {
        console.error('Error parsing checkout data:', error);
        router.push('/cart');
      }
    }
    setLoading(false);
  }, [searchParams, router]);

  useEffect(() => {
    // Lấy danh sách tỉnh/thành khi mount
    axios.get('https://provinces.open-api.vn/api/p/')
      .then(async res => {
        const cities = res.data.map((item: any) => ({
          code: item.code,
          label: item.name,
          value: item.name,
        }));
        setCityOptions(cities);

        // Set the first city as default and fetch pharmacies
        if (cities.length > 0) {
          const defaultCity = cities[0];
          form.setFieldsValue({ city: defaultCity.value });
          setSelectedCityCode(defaultCity.code);
          const pharmacies = await findPharmacyByProvinces(defaultCity.value);
          setPharmacyData(pharmacies);
        }
      });
  }, []);

  const handleCityChange = async (value: string, option: any) => {
    setSelectedCityCode(option.code);
    // Lấy danh sách quận/huyện theo tỉnh
    const res = await axios.get(`https://provinces.open-api.vn/api/p/${option.code}?depth=2`);
    setDistrictOptions(res.data.districts.map((item: any) => ({
      code: item.code,
      label: item.name,
      value: item.name,
    })));
    form.setFieldsValue({ district: undefined }); // reset quận/huyện khi đổi tỉnh
    
    // Fetch pharmacies for the selected city with empty district
    const pharmacies = await findPharmacyByProvinces(value);
    setPharmacyData(pharmacies);
  };

  const handleDistrictChange = async (value: string) => {
    const selectedCity = form.getFieldValue('city');
    if (selectedCity) {
      const pharmacies = await findPharmacyByProvinces(selectedCity, value);
      setPharmacyData(pharmacies);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!checkoutData || !user) return;

    showLoading();
    try {
      const dateTimeString = `${selectedDate} ${selectedTime}`;
      const timestamp = dayjs(dateTimeString, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss');
      const orderData: CreatePurchaseOrderRequest = {
        phuongthucthanhtoan: paymentMethod == 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng',
        hinhthucnhanhang: activeTab === 'pickup' ? 'Nhận hàng tại nhà thuốc' : 'Giao hàng tận nơi',
        mavoucher: values.voucherCode || 'VC00000',
        tongtien: checkoutData.subtotal,
        giamgiatructiep: checkoutData.directDiscount,
        thanhtien: checkoutData.finalTotal,
        phivanchuyen: 0,
        machinhanh: activeTab === 'delivery' ? 'CN000000' : machinhanh,
        details: checkoutData.items.map(item => ({
          masanpham: item.code,
          soluong: item.quantity,
          giaban: item.price,
          donvitinh: item.option || 'cái'
        }))
      };
      const result = await createPurchaseOrder(orderData);

  
      if (result) {
        let giaoHangData: GiaoHangDTO = {
          nguoinhan: values.fullName,
          sodienthoainguoinhan: values.phone,
          diachinguoinhan: activeTab === 'delivery' ? values.address :  '',
          madonhang: result.data.madonhang
      };
      let giaoHang = await  createGiaoHang(giaoHangData);
      if(giaoHang){
        for (const item of checkoutData.items) {
          await removeItem(item.id, item.option);
        }
        
        if(result.data.phuongthucthanhtoan == "Chuyển khoản ngân hàng"){
          const urlPay = await createVnpayOrder(result.data.madonhang);
          window.location.href = urlPay;
        }
        else{
          router.push(`/order-confirmation?madonhang=${result.data.madonhang}`);

        }
      }



      } else {
        message.error("Lỗi khi mua hàng! Vui lòng thử lại")
        console.log('Result is null, skipping block');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="container mx-auto py-8">
        <Alert
          message="Không tìm thấy thông tin đơn hàng"
          description="Vui lòng quay lại giỏ hàng và thử lại."
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => router.push('/cart')}>
              Quay lại giỏ hàng
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

      <div className="flex gap-6">
        {/* Checkout Form - 70% */}
        <div className="flex-1">
          <Card>
            <Tabs activeKey={activeTab} onChange={key => setActiveTab(key as 'delivery' | 'pickup')}>
              <TabPane tab="Giao hàng tận nơi" key="delivery">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    paymentMethod: 'COD',
                    shippingMethod: 'delivery'
                  }}
                >
                  <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
                  <Form.Item
                  
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
                    ]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                  <Form.Item
                    name="address"
                    label="Địa chỉ"
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                  >
                    <Input.TextArea rows={3} placeholder="Nhập địa chỉ giao hàng" />
                  </Form.Item>
                  <Divider />
                  <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
                  <Form.Item name="paymentMethod">
                    <Radio.Group defaultValue="COD">
                      <Radio value="COD">Thanh toán khi nhận hàng</Radio>
                      <Radio value="BANKING">Chuyển khoản ngân hàng</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="voucherCode"
                    label="Mã giảm giá (nếu có)"
                  >
                    <Input placeholder="Nhập mã giảm giá" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                      }}
                    >
                      Hoàn tất đơn hàng
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
              <TabPane tab="Nhận tại nhà thuốc" key="pickup">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    paymentMethod: 'COD',
                    shippingMethod: 'pickup'
                  }}
                >
                  <h2 className="text-xl font-semibold mb-4">Thông tin người đặt</h2>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên người đặt"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email (không bắt buộc)"
                  >
                    <Input placeholder="Nhập email" />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
                    ]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                  <Divider />
                  <h2 className="text-xl font-semibold mb-4">Chọn nhà thuốc lấy hàng</h2>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Form.Item label="Chọn tỉnh/thành phố" name="city" style={{ flex: 1 }}>
                      <Select
                        showSearch
                        placeholder="Chọn tỉnh/thành phố"
                        options={cityOptions}
                        onChange={handleCityChange}
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item label="Chọn quận/huyện" name="district" style={{ flex: 1 }}>
                      <Select
                        showSearch
                        placeholder="Chọn quận/huyện"
                        options={districtOptions}
                        disabled={!selectedCityCode}
                        optionFilterProp="label"
                        onChange={handleDistrictChange}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="Chọn nhà thuốc"
                    name="store"

                  >
                    {pharmacyData.length > 0 && (
                      <div style={{ marginBottom: 16, fontWeight: 500 }}>
                        Có {pharmacyData.length} nhà thuốc
                      </div>
                    )}
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: '0 16px' }}>
                      <Radio.Group style={{ width: '100%' }}>
                        {pharmacyData.map(pharmacy => (
                          <Radio
                            key={pharmacy.id}
                            value={pharmacy.machinhanh}
                            onChange={() => {
                              setMachinhanh(pharmacy.machinhanh);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              marginBottom: 16,
                              paddingBottom: 16,
                              paddingTop: 16,
                              borderBottom: '1px solid #f0f0f0',
                              width: '100%'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div>
                                <span style={{ color: '#52c41a', fontWeight: 500, marginRight: 8 }}>Có hàng</span>
                                <span style={{ backgroundColor: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: '0.8em', marginRight: 8 }}>Đang mở</span>
                                <span style={{ color: '#888', fontSize: '0.8em' }}>Đóng cửa lúc 22:00</span>
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <b>Nhà thuốc LC {pharmacy.machinhanh} {pharmacy.tenduong}</b>
                              </div>
                              <div style={{ color: '#888', fontSize: '0.9em', marginTop: 4 }}>
                                {pharmacy.diachi}
                              </div>
                            </div>
                          </Radio>
                        ))}
                        {pharmacyData.length === 0 && (
                          <div style={{ color: '#888', padding: '16px 0', textAlign: 'center' }}>
                            Không tìm thấy nhà thuốc nào trong khu vực này
                          </div>
                        )}
                      </Radio.Group>
                    </div>
                  </Form.Item>
                  <Form.Item name="note" label="Ghi chú (không bắt buộc)">
                    <Input.TextArea placeholder="Thêm ghi chú (ví dụ: Gọi cho tôi khi chuẩn bị hàng xong.)" />
                  </Form.Item>
                  <Form.Item label="Thời gian nhận hàng dự kiến">
                    <div style={{ color: '#1677ff' }}>
                      {displayTime} <Button type="link" size="small" onClick={handleOpenTimeModal}>Thay đổi</Button>
                    </div>
                  </Form.Item>
                  <Modal
                    open={showTimeModal}
                    onCancel={handleCloseTimeModal}
                    footer={null}
                    title="Chọn thời gian nhận hàng"
                    centered
                  >
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>Chọn ngày nhận:</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {days.map(day => (
                          <Button
                            key={day.value}
                            type={selectedDate === day.value ? 'primary' : 'default'}
                            onClick={() => setSelectedDate(day.value)}
                            style={{ minWidth: 160 }}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>Chọn giờ nhận:</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {timeSlots.map(slot => (
                          <Button
                            key={slot}
                            type={selectedTime === slot ? 'primary' : 'default'}
                            onClick={() => setSelectedTime(slot)}
                            style={{ minWidth: 120, marginBottom: 8 }}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500 }}>Thời gian nhận hàng dự kiến:</div>
                      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 6, marginTop: 4 }}>
                        Từ {selectedTime} {days.find(d => d.value === selectedDate)?.label}
                      </div>
                    </div>
                    <Button type="primary" block onClick={handleConfirmTime}>Xác nhận</Button>
                  </Modal>
                  <Form.Item label="Yêu cầu xuất hóa đơn điện tử" name="invoice" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Divider />
                  <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
                  <Form.Item name="paymentMethod">
                    <Radio.Group defaultValue={paymentMethod}>
                      <Radio defaultChecked={paymentMethod == 'COD'} onChange={() => setPaymentMethod('COD')}  value="COD">Thanh toán khi nhận hàng</Radio>
                      <Radio defaultChecked={paymentMethod == 'BANKING'} onChange={() => setPaymentMethod('BANKING')} value="BANKING">Chuyển khoản ngân hàng</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="voucherCode"
                    label="Mã giảm giá (nếu có)"
                  >
                    <Input placeholder="Nhập mã giảm giá" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      style={{
                        height: '48px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                      }}

                    >
                      Hoàn tất đơn hàng
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </div>

        {/* Order Summary - 30% */}
        <div style={{ width: '30%' }}>
          <Card title="Thông tin đơn hàng" className="sticky top-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tổng tiền</span>
                <span className="font-bold text-lg">
                  {checkoutData.subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span>Giảm giá trực tiếp</span>
                <span className="font-bold">
                  -{checkoutData.directDiscount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Giảm giá voucher</span>
                <span className="font-bold">
                  {checkoutData.voucherDiscount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span>Tiết kiệm được</span>
                <span className="font-bold text-green-600">
                  {checkoutData.totalSavings.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Thành tiền</span>
                  <div className="text-right">
                    <div className="text-gray-400 line-through text-sm">
                      {checkoutData.subtotal.toLocaleString('vi-VN')}đ
                    </div>
                    <div className="text-xl font-bold text-red-500">
                      {checkoutData.finalTotal.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
