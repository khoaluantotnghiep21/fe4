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
  Typography, 
  Row, 
  Col, 
  message, 
  Upload, 
  Tooltip,
  Divider,
  Steps,
  Result,
  Descriptions,
  Tag,
  Table,
  Space
} from 'antd';
import { 
  SaveOutlined, 
  CloseCircleOutlined, 
  UploadOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined
} from '@ant-design/icons';
import { createProduct } from '@/lib/api/productApi';
import { uploadProductImages } from '@/lib/api/mediaApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi';
import { getAllThuongHieu } from '@/lib/api/thuongHieuApi';
import { getAllKhuyenMai } from '@/lib/api/khuyenMaiApi';
import { getAllUnit, addProductWithUnit, updateProductWithUnit } from '@/lib/api/donvitinhApi';
import { getAllIngredient, createIngredient, addIngredientDetailsForProduct } from '@/lib/api/thanhphanApi';
import dayjs from 'dayjs';
import { DanhMuc } from '@/types/danhmuc.types';
import { ThuongHieu } from '@/types/thuonghieu.types';
import { KhuyenMai } from '@/types/khuyenmai.types';
import { DonViTinh, ChiTietDonVi } from '@/types/donvitinh.types';
import { ThanhPhan, ChiTietThanhPhan } from '@/types/thanhphan.types';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import CustomNotification from '@/components/common/CustomNotificationProps';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

interface AddProductFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddProductForm({ onCancel, onSuccess }: AddProductFormProps) {  const [form] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [ingredientForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [thuongHieuList, setThuongHieuList] = useState<ThuongHieu[]>([]);
  const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);
  const [unitList, setUnitList] = useState<DonViTinh[]>([]);
  const [ingredientList, setIngredientList] = useState<ThanhPhan[]>([]);
  const [productUnits, setProductUnits] = useState<(ChiTietDonVi & {donvitinh: string})[]>([]);
  const [productIngredients, setProductIngredients] = useState<(ChiTietThanhPhan & {tenthanhphan: string})[]>([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  
  // State cho phần upload ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  // State cho thông báo
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
    // State cho luồng thêm sản phẩm
  const [currentStep, setCurrentStep] = useState(0);
  const [productId, setProductId] = useState<string>('');
  const [productCode, setProductCode] = useState<string>('');
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  useEffect(() => {
    // Tải danh sách danh mục, thương hiệu, khuyến mãi, đơn vị tính và thành phần
    const fetchData = async () => {
      try {
        const [danhMucs, thuongHieus, khuyenMais, units, ingredients] = await Promise.all([
          getAllDanhMuc(),
          getAllThuongHieu(),
          getAllKhuyenMai(),
          getAllUnit(),
          getAllIngredient()
        ]);
        
        setDanhMucList(danhMucs || []);
        setThuongHieuList(thuongHieus || []);
        setKhuyenMaiList(khuyenMais || []);
        setUnitList(units || []);
        setIngredientList(ingredients || []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        setNotification({
          visible: true,
          type: 'error',
          message: 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        });
      }
    };
    
    fetchData();
  }, []);

  // Các hàm xử lý không thay đổi
  const closeNotification = () => {
    setNotification(null);
  };

  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    if (mainImageIndex >= newFileList.length && newFileList.length > 0) {
      setMainImageIndex(0);
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  // Handler cho đơn vị tính
  const handleAddUnit = async (values: any) => {
    if (!productCode) {
      message.error('Vui lòng hoàn tất thêm sản phẩm trước khi thêm đơn vị tính');
      return;
    }

    try {
      const unitData: ChiTietDonVi = {
        masanpham: productCode,
        madonvitinh: values.madonvitinh,
        giaban: values.giaban,
        dinhluong: values.dinhluong
      };

      const result = await addProductWithUnit(unitData);
      
      if (result) {
        // Thêm tên đơn vị tính vào dữ liệu để hiển thị
        const unitName = unitList.find(unit => unit.madonvitinh === values.madonvitinh)?.donvitinh || '';
        
        setProductUnits([...productUnits, {...result, donvitinh: unitName}]);
        unitForm.resetFields();
        message.success('Thêm đơn vị tính thành công');
      }
    } catch (error) {
      console.error('Lỗi khi thêm đơn vị tính:', error);
      message.error('Không thể thêm đơn vị tính. Vui lòng thử lại sau.');
    }
  };

  const handleEditUnit = (record: any) => {
    unitForm.setFieldsValue({
      madonvitinh: record.madonvitinh,
      giaban: record.giaban,
      dinhluong: record.dinhluong
    });
  };

  const handleDeleteUnit = (record: any) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa đơn vị tính "${record.donvitinh}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => {
        setProductUnits(productUnits.filter(unit => 
          !(unit.madonvitinh === record.madonvitinh && unit.masanpham === record.masanpham)
        ));
        message.success('Đã xóa đơn vị tính');
      }
    });
  };

  // Handler cho thành phần
  const handleAddNewIngredient = async () => {
    if (!newIngredientName || newIngredientName.trim() === '') {
      message.error('Vui lòng nhập tên thành phần');
      return;
    }

    try {
      const result = await createIngredient(newIngredientName);
      
      if (result) {
        setIngredientList([...ingredientList, result]);
        ingredientForm.setFieldsValue({ mathanhphan: result.mathanhphan });
        setNewIngredientName('');
        message.success('Thêm thành phần mới thành công');
      }
    } catch (error) {
      console.error('Lỗi khi thêm thành phần mới:', error);
      message.error('Không thể thêm thành phần mới. Vui lòng thử lại sau.');
    }
  };

  const handleAddIngredient = async (values: any) => {
    if (!productCode) {
      message.error('Vui lòng hoàn tất thêm sản phẩm trước khi thêm thành phần');
      return;
    }    try {
      console.log('Adding ingredient with:', {
        productCode,
        mathanhphan: values.mathanhphan,
        hamluong: values.hamluong
      });
      
      const result = await addIngredientDetailsForProduct(
        productCode,
        values.mathanhphan,
        values.hamluong
      );
        if (result) {
        // Thêm tên thành phần vào dữ liệu để hiển thị
        const ingredientName = ingredientList.find(ing => ing.mathanhphan === values.mathanhphan)?.tenthanhphan || '';
        
        // Make sure hamluong is included in the displayed data by using the value from the form
        setProductIngredients([...productIngredients, {
          ...result, 
          tenthanhphan: ingredientName,
          hamluong: values.hamluong // Ensure hamluong is included from the form values
        }]);
        
        ingredientForm.resetFields();
        message.success('Thêm thành phần thành công');
      }} catch (error: any) {
      console.error('Lỗi khi thêm thành phần:', error);
      
      // Get more detailed error message
      const errorMsg = error.response?.data?.message || 
                       (error.message ? `Lỗi: ${error.message}` : 
                       'Không thể thêm thành phần. Vui lòng thử lại sau.');
      
      message.error(errorMsg);
    }
  };

  const handleDeleteIngredient = (record: any) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa thành phần "${record.tenthanhphan}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: () => {        setProductIngredients(productIngredients.filter(ingredient => 
          !(ingredient.mathanhphan === record.mathanhphan && ingredient.masanpham === record.masanpham)
        ));
        message.success('Đã xóa thành phần');
      }
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        ngaysanxuat: values.ngaysanxuat ? values.ngaysanxuat.format('YYYY-MM-DD') : undefined,
      };
        const response = await createProduct(formattedValues);
      console.log('Create product response:', response);
      console.log('Response type:', typeof response);
      console.log('Response structure:', JSON.stringify(response, null, 2));
      
      // Check if response is nested in data property
      if (response && (response.id || (response.data && response.data.id))) {
        const productId = response.id || response.data.id;
        const productCode = response.masanpham || response.data.masanpham || values.masanpham;
        
        setProductId(productId);
        setProductCode(productCode);
        setCurrentStep(1);
          setNotification({
          visible: true,
          type: 'success',
          message: 'Tạo sản phẩm thành công! Bây giờ hãy thêm ảnh cho sản phẩm.'
        });
      } else if (response) {
        // Handle case where API returns success but without expected ID format
        console.log('Success but no ID in expected format. Using fallback values.');
        // Try to extract ID from response or use a generated one
        const fallbackId = response.id || response._id || response.productId || response.data?.id || Date.now().toString();
        const fallbackCode = values.masanpham || 'SP' + Date.now().toString().substring(6);
        
        setProductId(fallbackId);
        setProductCode(fallbackCode);
        setCurrentStep(1);
        
        setNotification({
          visible: true,
          type: 'success',
          message: 'Sản phẩm đã được tạo, nhưng ID có thể không chính xác. Vẫn có thể tiếp tục thêm ảnh.'
        });
      } else {
        throw new Error('Không nhận được ID sản phẩm từ server');
      }    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error);
      // Extract error message if available
      let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm!';
      if (error instanceof Error) {
        errorMessage = `Lỗi: ${error.message}`;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        // Extract error from axios response
        const axiosError = error as any;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      setNotification({
        visible: true,
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImages = async () => {
    if (fileList.length === 0) {
      setNotification({
        visible: true,
        type: 'error',
        message: 'Vui lòng chọn ít nhất một ảnh để tải lên'
      });
      return;
    }

    setLoading(true);
    try {
      const files = fileList
        .filter(file => file.originFileObj)
        .map(file => file.originFileObj as File);
      
      await uploadProductImages(productId, files, mainImageIndex);
      
      setNotification({
        visible: true,
        type: 'success',
        message: 'Upload ảnh thành công!'
      });
      
      setIsSubmitSuccessful(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('Lỗi khi upload ảnh:', error);
      setNotification({
        visible: true,
        type: 'error',
        message: 'Có lỗi xảy ra khi upload ảnh!'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (form.isFieldsTouched() || fileList.length > 0) {
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

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    onSuccess();
  };
  
  const handleCompleteUnitsAndIngredients = () => {
    // Move to the final step
    setCurrentStep(3);
    
    // Show success message
    setNotification({
      visible: true,
      type: 'success',
      message: 'Hoàn tất thêm đơn vị tính và thành phần cho sản phẩm!'
    });
  };

  // const handleAddUnit = (values: any) => {
  //   const newUnit = {
  //     ...values,
  //     key: Date.now(),
  //   };
  //   setProductUnits([...productUnits, newUnit]);
  //   unitForm.resetFields();
  // };

  // const handleDeleteUnit = (record: any) => {
  //   setProductUnits(productUnits.filter(unit => unit.key !== record.key));
  // };

  // const handleEditUnit = (record: any) => {
  //   unitForm.setFieldsValue({
  //     madonvitinh: record.madonvitinh,
  //     giaban: record.giaban,
  //     dinhluong: record.dinhluong,
  //   });
  //   setProductUnits(productUnits.filter(unit => unit.key !== record.key));
  // };

  // const handleAddIngredient = (values: any) => {
  //   const newIngredient = {
  //     ...values,
  //     key: Date.now(),
  //   };
  //   setProductIngredients([...productIngredients, newIngredient]);
  //   ingredientForm.resetFields();
  // };

  // const handleDeleteIngredient = (record: any) => {
  //   setProductIngredients(productIngredients.filter(ingredient => ingredient.key !== record.key));
  // };

  // const handleAddNewIngredient = () => {
  //   if (!newIngredientName) return;
    
  //   const newIngredient = {
  //     tenthanhphan: newIngredientName,
  //     key: Date.now(),
  //   };
  //   setProductIngredients([...productIngredients, newIngredient]);
  //   setNewIngredientName('');
  // };
  
  // Các bước trong quá trình thêm sản phẩm
  const steps = [
    {
      title: 'Thông tin sản phẩm',
      content: (
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit} 
          className="product-form"
          size="large" // Tăng kích thước của form elements
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card 
                title={<Title level={5}>Thông tin cơ bản</Title>} 
                bordered={false} 
                className="mb-6 product-card"
              >                <Form.Item 
                  name="tensanpham" 
                  label="Tên sản phẩm" 
                  rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                >
                  <Input placeholder="Nhập tên sản phẩm" className="form-input" />
                </Form.Item>
                
               
                
                <Form.Item 
                  name="dangbaoche"
                  label="Dạng bào chế" 
                  rules={[{ required: true, message: 'Vui lòng nhập dạng bào chế' }]}
                >
                  <Input placeholder="Nhập dạng bào chế" className="form-input" />
                </Form.Item>
                
                <Form.Item 
                  name="motangan" 
                  label="Mô tả ngắn" 
                  rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn' }]}
                >
                  <TextArea rows={4} placeholder="Nhập mô tả ngắn" className="form-textarea" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="gianhap" 
                      label="Giá nhập" 
                      rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
                    >
                      <InputNumber
                        className="form-input"
                        style={{ width: '100%' }}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
                      <Switch 
                        checkedChildren="Có" 
                        unCheckedChildren="Không" 
                        className="form-switch"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="madanhmuc" 
                      label="Danh mục" 
                      rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn danh mục"
                        optionFilterProp="children"
                        loading={danhMucList.length === 0}
                        options={danhMucList.map(dm => ({ value: dm.madanhmuc, label: dm.tendanhmuc }))}
                        className="form-select"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="mathuonghieu" 
                      label="Thương hiệu" 
                      rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn thương hiệu"
                        optionFilterProp="children"
                        loading={thuongHieuList.length === 0}
                        options={thuongHieuList.map(th => ({ value: th.mathuonghieu, label: th.tenthuonghieu }))}
                        className="form-select"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="machuongtrinh" label="Chương trình khuyến mãi">
                  <Select
                    showSearch
                    placeholder="Chọn chương trình khuyến mãi"
                    optionFilterProp="children"
                    allowClear
                    loading={khuyenMaiList.length === 0}
                    options={khuyenMaiList.map(km => ({ value: km.machuongtrinh, label: km.tenchuongtrinh }))}
                    className="form-select"
                  />
                </Form.Item>
              </Card>
              
              <Card 
                title={<Title level={5}>Thông tin thời gian</Title>} 
                bordered={false} 
                className="product-card"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="ngaysanxuat" 
                      label="Ngày sản xuất" 
                      rules={[{ required: true, message: 'Vui lòng chọn ngày sản xuất' }]}
                    >
                      <DatePicker 
                        style={{ width: '100%' }} 
                        format="YYYY-MM-DD"
                        placeholder="Chọn ngày sản xuất"
                        className="form-datepicker"
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
                        min={1}
                        placeholder="Nhập số ngày"
                        className="form-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card 
                title={<Title level={5}>Thông tin chi tiết</Title>} 
                bordered={false} 
                className="product-card"
              >
                <Form.Item 
                  name="congdung" 
                  label="Công dụng" 
                  rules={[{ required: true, message: 'Vui lòng nhập công dụng' }]}
                >
                  <TextArea rows={4} placeholder="Nhập công dụng của sản phẩm" className="form-textarea" />
                </Form.Item>
                
                <Form.Item 
                  name="chidinh" 
                  label="Chỉ định" 
                  rules={[{ required: true, message: 'Vui lòng nhập chỉ định' }]}
                >
                  <TextArea rows={4} placeholder="Nhập chỉ định của sản phẩm" className="form-textarea" />
                </Form.Item>
                
                <Form.Item 
                  name="chongchidinh" 
                  label="Chống chỉ định" 
                  rules={[{ required: true, message: 'Vui lòng nhập chống chỉ định' }]}
                >
                  <TextArea rows={4} placeholder="Nhập chống chỉ định của sản phẩm" className="form-textarea" />
                </Form.Item>
                
                <Form.Item 
                  name="doituongsudung" 
                  label="Đối tượng sử dụng" 
                  rules={[{ required: true, message: 'Vui lòng nhập đối tượng sử dụng' }]}
                >
                  <TextArea rows={4} placeholder="Nhập đối tượng sử dụng" className="form-textarea" />
                </Form.Item>
                
                <Form.Item 
                  name="luuy" 
                  label="Lưu ý" 
                  rules={[{ required: true, message: 'Vui lòng nhập lưu ý' }]}
                >
                  <TextArea rows={4} placeholder="Nhập lưu ý khi sử dụng" className="form-textarea" />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      title: 'Upload ảnh',
      content: (
        <div className="upload-images-container">
          <Card 
            title={<Title level={5}>Tải lên ảnh sản phẩm</Title>}
            bordered={false}
            className="product-card"
          >
            <div className="product-info-summary mb-4">
              <Title level={5}>Thông tin sản phẩm đã tạo:</Title>
              <Descriptions bordered size="middle" column={1} layout="vertical" className="product-description">
                <Descriptions.Item label="Mã sản phẩm">{productCode}</Descriptions.Item>
                <Descriptions.Item label="ID sản phẩm">{productId}</Descriptions.Item>
              </Descriptions>
            </div>

            <Divider />
            
            <div className="mb-4">
              <Text type="secondary" className="text-guide">
                Tải lên ảnh sản phẩm (tối đa 5 ảnh). Nhấn vào biểu tượng sao để đặt làm ảnh chính.
              </Text>
            </div>
            
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              onPreview={handlePreview}
              beforeUpload={() => false}
              multiple
              maxCount={5}
              className="upload-container"
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                </div>
              )}
            </Upload>

            {fileList.length > 0 && (
              <div className="image-list-container mt-4">
                <Title level={5}>Danh sách ảnh đã chọn:</Title>
                <div className="image-list">
                  {fileList.map((file, index) => (
                    <div key={file.uid} className="image-item">
                      <img 
                        src={file.url || (file.preview as string)} 
                        alt={`Image ${index + 1}`}
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                      <div className="image-actions">
                        <Tooltip title="Xem trước">
                          <Button 
                            icon={<EyeOutlined />} 
                            size="middle" 
                            onClick={() => handlePreview(file)}
                          />
                        </Tooltip>
                        <Tooltip title={mainImageIndex === index ? 'Ảnh chính' : 'Đặt làm ảnh chính'}>
                          <Button 
                            icon={mainImageIndex === index ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
                            size="middle"
                            onClick={() => setMainImage(index)}
                          />
                        </Tooltip>
                      </div>
                      <div className="image-caption">
                        {mainImageIndex === index && (
                          <Tag color="gold" className="main-image-tag">Ảnh chính</Tag>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Modal
              open={previewOpen}
              title={previewTitle}
              footer={null}
              onCancel={() => setPreviewOpen(false)}
              width={1400}
              centered
            >
              <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
          </Card>
        </div>
      ),
    },
    {
      title: 'Đơn vị tính & Thành phần',
      content: (
        <div className="unit-ingredient-container">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card 
                title={<Title level={5}>Thêm đơn vị tính cho sản phẩm</Title>}
                bordered={false}
                className="product-card mb-4"
              >
                <div className="product-info-summary mb-4">
                  <Descriptions bordered size="middle" column={1} layout="vertical" className="product-description">
                    <Descriptions.Item label="Mã sản phẩm">{productCode}</Descriptions.Item>
                  </Descriptions>
                </div>

                <Form
                  form={unitForm}
                  layout="vertical"
                  onFinish={handleAddUnit}
                >
                  <Form.Item
                    name="madonvitinh"
                    label="Đơn vị tính"
                    rules={[{ required: true, message: 'Vui lòng chọn đơn vị tính' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn đơn vị tính"
                      optionFilterProp="children"
                      loading={unitList.length === 0}
                      options={unitList.map(unit => ({ value: unit.madonvitinh, label: unit.donvitinh }))}
                      className="form-select"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="giaban"
                    label="Giá bán"
                    rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                  >
                    <InputNumber
                      className="form-input"
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      placeholder="Nhập giá bán"
                      min={0}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="dinhluong"
                    label="Định lượng"
                    rules={[{ required: true, message: 'Vui lòng nhập định lượng' }]}
                  >
                    <InputNumber
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="Nhập định lượng"
                      min={0}
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<PlusOutlined />}
                    >
                      Thêm đơn vị tính
                    </Button>
                  </Form.Item>
                </Form>                {productUnits.length > 0 && (
                  <div className="mt-4">
                    <Divider orientation="left">Đơn vị tính đã thêm (Nhấn "Hoàn tất" để lưu)</Divider>
                    <Table
                      dataSource={productUnits}
                      columns={[
                        {
                          title: 'Đơn vị tính',
                          dataIndex: 'donvitinh',
                          key: 'donvitinh'
                        },
                        {
                          title: 'Giá bán',
                          dataIndex: 'giaban',
                          key: 'giaban',
                          render: (giaban) => `${giaban.toLocaleString('vi-VN')} đ`
                        },
                        {
                          title: 'Định lượng',
                          dataIndex: 'dinhluong',
                          key: 'dinhluong'
                        },
                        {
                          title: 'Thao tác',
                          key: 'action',
                          render: (_, record) => (
                            <Space size="middle">
                              <Button 
                                type="text" 
                                icon={<EditOutlined />}
                                onClick={() => handleEditUnit(record)}
                              />
                              <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteUnit(record)}
                              />
                            </Space>
                          ),
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title={<Title level={5}>Thêm thành phần cho sản phẩm</Title>}
                bordered={false}
                className="product-card"
              >
                <div className="product-info-summary mb-4">
                  <Descriptions bordered size="middle" column={1} layout="vertical" className="product-description">
                    <Descriptions.Item label="Mã sản phẩm">{productCode}</Descriptions.Item>
                  </Descriptions>
                </div>

                <Form
                  form={ingredientForm}
                  layout="vertical"
                  onFinish={handleAddIngredient}
                >
                  <Form.Item
                    name="mathanhphan"
                    label="Thành phần"
                    rules={[{ required: true, message: 'Vui lòng chọn thành phần' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn thành phần"
                      optionFilterProp="children"
                      loading={ingredientList.length === 0}
                      options={ingredientList.map(ing => ({ value: ing.mathanhphan, label: ing.tenthanhphan }))}
                      className="form-select"
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Space style={{ padding: '0 8px 4px' }}>
                            <Input
                              placeholder="Thêm thành phần mới"
                              value={newIngredientName}
                              onChange={(e) => setNewIngredientName(e.target.value)}
                            />
                            <Button 
                              type="text" 
                              icon={<PlusOutlined />}
                              onClick={handleAddNewIngredient}
                            >
                              Thêm mới
                            </Button>
                          </Space>
                        </>
                      )}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="hamluong"
                    label="Hàm lượng"
                    rules={[{ required: true, message: 'Vui lòng nhập hàm lượng' }]}
                  >
                    <Input 
                      placeholder="Vd: 500mg, 1000IU, 5ml,..." 
                      className="form-input"
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<PlusOutlined />}
                    >
                      Thêm thành phần
                    </Button>
                  </Form.Item>
                </Form>                {productIngredients.length > 0 && (
                  <div className="mt-4">
                    <Divider orientation="left">Thành phần đã thêm (Nhấn "Hoàn tất" để lưu)</Divider>
                    <Table
                      dataSource={productIngredients}
                      columns={[
                        {
                          title: 'Thành phần',
                          dataIndex: 'tenthanhphan',
                          key: 'tenthanhphan'
                        },
                        {
                          title: 'Hàm lượng',
                          dataIndex: 'hamluong',
                          key: 'hamluong'
                        },
                        {
                          title: 'Thao tác',
                          key: 'action',
                          render: (_, record) => (
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteIngredient(record)}
                            />
                          ),
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: 'Hoàn tất',
      content: (
        <Result
          status="success"
          title="Thêm sản phẩm thành công!"
          subTitle={`Sản phẩm "${productCode}" đã được thêm vào hệ thống.`}
          className="success-result"
          extra={[
            <Button 
              type="primary" 
              key="console" 
              onClick={handleFinish}
              icon={<CheckCircleOutlined />}
              size="large"
              className="finish-button"
            >
              Quay lại danh sách sản phẩm
            </Button>,
          ]}
        />
      ),
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm add-product-container">
      {notification && notification.visible && (
        <CustomNotification 
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleCancel}
            style={{ marginRight: 16 }}
            type="default"
            size="large"
          />
          <Title level={3} style={{ margin: 0 }}>Thêm sản phẩm mới</Title>
        </div>
      </div>
      
      <div className="steps-container mb-6">
        <Steps 
          current={currentStep} 
          items={steps.map(item => ({ title: item.title }))}
          size="small"
          className="product-steps" 
        />
      </div>
      
      <Spin spinning={loading}>
        <div className="steps-content">{steps[currentStep].content}</div>
        
        <div className="steps-action mt-4">
          {currentStep > 0 && currentStep < 2 && (
            <Button 
              style={{ margin: '0 8px 0 0' }}
              onClick={handlePrevStep}
              size="large"
            >
              Quay lại
            </Button>
          )}
          {currentStep === 0 && (
            <Button 
              type="primary" 
              onClick={() => form.submit()}
              size="large"
              className="next-button"
            >
              Tiếp theo
            </Button>
          )}          {currentStep === 1 && (
            <Button 
              type="primary" 
              onClick={handleUploadImages}
              size="large"
              className="upload-button"
              icon={<UploadOutlined />}
            >
              Upload ảnh và tiếp theo
            </Button>
          )}
          {currentStep === 2 && (
            <Button 
              type="primary" 
              onClick={handleCompleteUnitsAndIngredients}
              size="large"
              className="complete-button"
              icon={<CheckCircleOutlined />}
            >
              Hoàn tất
            </Button>
          )}
        </div>
      </Spin>
      
      <style jsx global>{`        
      .add-product-container {
          max-width: 2400px;
          margin: 0 auto;
          padding: 30px;
        }
        
        .product-card {
          margin-bottom: 28px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
          .product-card .ant-card-head {
          background-color: #f6f9fc;
          padding: 18px 28px;
          font-size: 20px;
        }
        
        .product-card .ant-card-body {
          padding: 28px;
        }
          .upload-images-container {
          min-height: 550px;
        }
          .form-input, .form-textarea, .form-select, .form-datepicker {
          font-size: 16px;
          he
          padding: 14px;
          border-radius: 8px;
        }
        

        .form-textarea {
          font-size: 16px;
          min-height: 140px;
        }
        
        .form-switch {
          transform: scale(1.3);
        }
        
        .ant-form-item-label > label {
          font-weight: 600;
          font-size: 17px;
          margin-bottom: 6px;
        }
        
        .image-list {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          margin-top: 16px;
        }
        
        .image-item {
          position: relative;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .image-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .image-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        
        .image-caption {
          margin-top: 12px;
          text-align: center;
        }
        
        .main-image-tag {
          font-size: 14px;
          padding: 4px 8px;
        }
        
        .steps-content {
          min-height: 200px;
          margin-top: 24px;
          padding: 24px;
          background-color: #fff;
          border-radius: 8px;
        }
        
        .steps-action {
          margin-top: 30px;
          text-align: right;
        }
        
        .product-info-summary {
          background-color: #f9fbfd;
          padding: 24px;
          border-radius: 8px;
          margin-top: 16px;
        }
        
        .product-steps .ant-steps-item-title {
          font-size: 16px;
          font-weight: 600;
        }
        
        .product-description .ant-descriptions-item-label {
          font-weight: 600;
          font-size: 15px;
        }
        
        .product-description .ant-descriptions-item-content {
          font-size: 16px;
        }
        
        .text-guide {
          font-size: 16px;
        }
          .upload-container .ant-upload.ant-upload-select-picture-card {
          width: 180px;
          height: 180px;
          margin-right: 20px;
          margin-bottom: 20px;
        }
          .success-result {
          padding: 60px 0;
        }
        
        .success-result .ant-result-title {
          font-size: 32px;
        }
        
        .success-result .ant-result-subtitle {
          font-size: 20px;
        }
        
        .finish-button, .next-button, .upload-button {
          height: 45px;
          font-size: 16px;
          padding: 0 24px;
        }
      `}</style>
    </div>
  );
}