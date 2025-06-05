'use client';

import { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Select, 
  Card, 
  Spin, 
  Modal,
  Divider,
  Typography,
  Row,
  Col 
} from 'antd';
import { SaveOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { updateProduct } from '@/lib/api/productApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi'; // Thêm import này
import { UpdateProductRequest } from '@/types/product.types';
import { DanhMuc } from '@/types/danhmuc.types'; // Thêm import này nếu chưa có
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import CustomNotification from '@/components/common/CustomNotificationProps';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

interface EditProductFormProps {
  product: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditProductForm({ product, onCancel, onSuccess }: EditProductFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [datetimeFormat, setDatetimeFormat] = useState<string>('YYYY-MM-DD');
  
  // State quản lý thông báo
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Thêm state để lưu trữ danh sách danh mục
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [loadingDanhMuc, setLoadingDanhMuc] = useState(false);

  useEffect(() => {
    // Điền dữ liệu sản phẩm vào form
    form.setFieldsValue({
      ...product,
      ngaysanxuat: product.ngaysanxuat ? dayjs(product.ngaysanxuat) : undefined,
    });
    
    // Tải danh sách danh mục
    fetchDanhMuc();
  }, [form, product]);

  // Hàm tải danh sách danh mục
  const fetchDanhMuc = async () => {
    try {
      setLoadingDanhMuc(true);
      const danhMucs = await getAllDanhMuc();
      console.log('Danh mục list:', danhMucs);
      setDanhMucList(danhMucs || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách danh mục:', error);
    } finally {
      setLoadingDanhMuc(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Chuyển đổi giá trị ngày sản xuất từ dayjs về string
      const formattedValues: UpdateProductRequest = {
        ...values,
        ngaysanxuat: values.ngaysanxuat ? values.ngaysanxuat.format('YYYY-MM-DD') : undefined
      };
      
      const response = await updateProduct(product.masanpham, formattedValues);
      
      // Thêm console.log để debug
      console.log("API response:", response);
      
      // Kiểm tra phản hồi từ API - coi như thành công nếu không có lỗi thrown
      // hoặc nếu API trả về bất kỳ giá trị nào (không null)
      if (response !== null) {
        // Hiển thị thông báo thành công
        setNotification({
          visible: true,
          type: 'success',
          message: 'Cập nhật sản phẩm thành công!'
        });
        
        // Đợi một chút để người dùng nhìn thấy thông báo trước khi chuyển trang
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        // Hiển thị thông báo lỗi
        setNotification({
          visible: true,
          type: 'error',
          message: 'Cập nhật sản phẩm thất bại!'
        });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error);
      setNotification({
        visible: true,
        type: 'error',
        message: 'Có lỗi xảy ra khi cập nhật sản phẩm!'
      });
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận hủy khi có thay đổi chưa lưu
  const handleCancel = () => {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: 'Xác nhận hủy',
        content: 'Những thay đổi của bạn chưa được lưu. Bạn có chắc chắn muốn hủy không?',
        okText: 'Có',
        cancelText: 'Không',
        onOk: onCancel
      });
    } else {
      onCancel();
    }
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // Tìm tên danh mục dựa trên mã danh mục
  const getDanhMucNameByCode = (code: string) => {
    const found = danhMucList.find(item => item.madanhmuc === code);
    return found ? found.tendanhmuc : code;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {notification && notification.visible && (
        <CustomNotification 
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
      
      {/* Header và nút */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleCancel}
            style={{ marginRight: 16 }}
            type="default"
          />
          <Title level={4} style={{ margin: 0 }}>Chỉnh sửa sản phẩm: {product.tensanpham}</Title>
        </div>
        <div>
          <Button 
            type="default" 
            onClick={handleCancel}
            icon={<CloseCircleOutlined />} 
            style={{ marginRight: 8 }}
          >
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={form.submit} 
            icon={<SaveOutlined />}
            loading={loading}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
      
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            ...product,
            ngaysanxuat: product.ngaysanxuat ? dayjs(product.ngaysanxuat) : undefined,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="Thông tin cơ bản" bordered={false} className="mb-6">
                <Form.Item 
                  name="tensanpham" 
                  label="Tên sản phẩm" 
                  rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                >
                  <Input placeholder="Nhập tên sản phẩm" />
                </Form.Item>
                
                <Form.Item 
                  name="dangbaoche"
                  label="Dạng bào chế" 
                  rules={[{ required: true, message: 'Vui lòng nhập dạng bào chế' }]}
                >
                  <Input placeholder="Nhập dạng bào chế" />
                </Form.Item>
                
                <Form.Item 
                  name="motangan" 
                  label="Mô tả ngắn"
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn' }]}
                >
                  <TextArea rows={4} placeholder="Nhập mô tả ngắn" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="gianhap" 
                      label="Giá nhập"
                      rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="Nhập giá nhập"
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="thuockedon" 
                      label="Thuốc kê đơn" 
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    {/* Đây là phần mà chúng ta sẽ thay đổi thành combobox có tìm kiếm */}
                    <Form.Item 
                      name="madanhmuc" 
                      label="Danh mục"
                      rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn danh mục"
                        optionFilterProp="children"
                        loading={loadingDanhMuc}
                        filterOption={(input, option) => 
                          (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                        }
                        options={danhMucList.map(dm => ({
                          value: dm.madanhmuc,
                          label: dm.tendanhmuc,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="mathuonghieu" 
                      label="Thương hiệu"
                      rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
                    >
                      <Input disabled />
                      {/* Thay thế bằng Select tương tự như trên */}
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  name="machuongtrinh" 
                  label="Chương trình khuyến mãi"
                >
                  <Input disabled />
                  {/* Thay thế bằng Select tương tự như trên */}
                </Form.Item>
              </Card>
              
              {/* Phần còn lại của form không thay đổi */}
              <Card title="Thông tin thời gian" bordered={false}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="ngaysanxuat" 
                      label="Ngày sản xuất"
                      rules={[{ required: true, message: 'Vui lòng chọn ngày sản xuất' }]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }}
                        format={datetimeFormat}
                        placeholder="Chọn ngày sản xuất"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="hansudung" 
                      label="Hạn sử dụng (ngày)"
                      rules={[{ required: true, message: 'Vui lòng nhập hạn sử dụng' }]}
                    >
                      <InputNumber 
                        style={{ width: '100%' }}
                        placeholder="Nhập số ngày"
                        min={1}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Thông tin chi tiết" bordered={false}>
                <Form.Item 
                  name="congdung" 
                  label="Công dụng"
                  rules={[{ required: true, message: 'Vui lòng nhập công dụng' }]}
                >
                  <TextArea rows={4} placeholder="Nhập công dụng" />
                </Form.Item>
                
                <Form.Item 
                  name="chidinh" 
                  label="Chỉ định"
                  rules={[{ required: true, message: 'Vui lòng nhập chỉ định' }]}
                >
                  <TextArea rows={4} placeholder="Nhập chỉ định" />
                </Form.Item>
                
                <Form.Item 
                  name="chongchidinh" 
                  label="Chống chỉ định"
                  rules={[{ required: true, message: 'Vui lòng nhập chống chỉ định' }]}
                >
                  <TextArea rows={4} placeholder="Nhập chống chỉ định" />
                </Form.Item>
                
                <Form.Item 
                  name="doituongsudung" 
                  label="Đối tượng sử dụng"
                  rules={[{ required: true, message: 'Vui lòng nhập đối tượng sử dụng' }]}
                >
                  <TextArea rows={4} placeholder="Nhập đối tượng sử dụng" />
                </Form.Item>
                
                <Form.Item 
                  name="luuy" 
                  label="Lưu ý"
                  rules={[{ required: true, message: 'Vui lòng nhập lưu ý' }]}
                >
                  <TextArea rows={4} placeholder="Nhập lưu ý khi sử dụng" />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
}