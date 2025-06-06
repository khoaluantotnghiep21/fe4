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
  Col,
  Upload,
  Space,
  Table,
  Tooltip,
  message,
  Tabs
} from 'antd';
import { 
  SaveOutlined, 
  CloseCircleOutlined, 
  ArrowLeftOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined
} from '@ant-design/icons';
import { updateProduct } from '@/lib/api/productApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi';
import { getAllThuongHieu } from '@/lib/api/thuongHieuApi';
import { getAllKhuyenMai } from '@/lib/api/khuyenMaiApi';
import { getAllUnit, addProductWithUnit, updateProductWithUnit } from '@/lib/api/donvitinhApi';
import { getAllIngredient, createIngredient, addIngredientDetailsForProduct } from '@/lib/api/thanhphanApi';
import { uploadProductImages, deleteProductImage, setMainProductImage, updateProductImage } from '@/lib/api/mediaApi';
import { UpdateProductRequest } from '@/types/product.types';
import { DanhMuc } from '@/types/danhmuc.types';
import { ThuongHieu } from '@/types/thuonghieu.types';
import { KhuyenMai } from '@/types/khuyenmai.types';
import { DonViTinh, ChiTietDonVi } from '@/types/donvitinh.types';
import { ThanhPhan, ChiTietThanhPhan } from '@/types/thanhphan.types';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import CustomNotification from '@/components/common/CustomNotificationProps';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface EditProductFormProps {
  product: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditProductForm({ product, onCancel, onSuccess }: EditProductFormProps) {
  const [form] = Form.useForm();
  const [unitForm] = Form.useForm();
  const [ingredientForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [datetimeFormat, setDatetimeFormat] = useState<string>('YYYY-MM-DD');
  const [activeTab, setActiveTab] = useState('1');
  
  // State quản lý thông báo
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // State cho các danh sách chính
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [thuongHieuList, setThuongHieuList] = useState<ThuongHieu[]>([]);
  const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);
  const [unitList, setUnitList] = useState<DonViTinh[]>([]);
  const [ingredientList, setIngredientList] = useState<ThanhPhan[]>([]);
  
  // State cho danh sách đơn vị tính và thành phần của sản phẩm
  const [productUnits, setProductUnits] = useState<(ChiTietDonVi & {donvitinh: string})[]>([]);
  const [productIngredients, setProductIngredients] = useState<(ChiTietThanhPhan & {tenthanhphan: string})[]>([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  
  // State cho upload ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [imageChanged, setImageChanged] = useState(false);
  
  // State cho loading các thành phần
  const [loadingDanhMuc, setLoadingDanhMuc] = useState(false);
  const [loadingThuongHieu, setLoadingThuongHieu] = useState(false);
  const [loadingKhuyenMai, setLoadingKhuyenMai] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  useEffect(() => {
    // Điền dữ liệu sản phẩm vào form
    form.setFieldsValue({
      ...product,
      ngaysanxuat: product.ngaysanxuat ? dayjs(product.ngaysanxuat) : undefined,
    });
    
    // Tải tất cả dữ liệu cần thiết
    fetchAllData();
    
    // Initialize product images
    initializeProductImages();
    
    // Initialize product ingredients and units
    initializeProductDetails();
  }, [form, product]);

  // Khởi tạo ảnh sản phẩm
  const initializeProductImages = () => {
    if (product.anhsanpham && Array.isArray(product.anhsanpham)) {
      // Convert product images to Upload file list format
      interface ProductImage {
        url: string;
        ismain: boolean;
      }

      interface UploadFileWithMain extends UploadFile {
        isMain?: boolean;
      }

      const images: UploadFileWithMain[] = (product.anhsanpham as ProductImage[]).map((img: ProductImage, index: number): UploadFileWithMain => ({
        uid: `-${index}`,
        name: `image-${index}.png`,
        status: 'done',
        url: img.url,
        isMain: img.ismain
      }));
      
      setFileList(images);
      
      // Set main image index
      const mainImageIndex = images.findIndex(img => img.isMain);
      if (mainImageIndex !== -1) {
        setMainImageIndex(mainImageIndex);
      }
    }
  };
  
  // Khởi tạo thông tin đơn vị tính và thành phần
  const initializeProductDetails = () => {
    // Set product units
    if (product.chitietdonvi && Array.isArray(product.chitietdonvi)) {
      interface ProductUnit {
        donvitinh: {
          donvitinh: string;
          madonvitinh: string;
        };
        giaban: number;
        dinhluong: number;
        masanpham?: string;
        madonvitinh?: string;
      }

      interface ProductUnitDisplay extends ChiTietDonVi {
        donvitinh: string;
        madonvitinh: string;
        masanpham: string;
      }

      const units: ProductUnitDisplay[] = (product.chitietdonvi as ProductUnit[]).map((unit: ProductUnit) => ({
        ...unit,
        donvitinh: unit.donvitinh.donvitinh,
        madonvitinh: unit.donvitinh.madonvitinh,
        masanpham: product.masanpham
      }));
      setProductUnits(units);
    }
    
    // Set product ingredients
    if (product.chitietthanhphan && Array.isArray(product.chitietthanhphan)) {
      interface ProductIngredient {
        thanhphan: {
          mathanhphan: string;
          tenthanhphan: string;
        };
        hamluong: string;
      }

      interface ProductIngredientDisplay extends ChiTietThanhPhan {
        tenthanhphan: string;
      }

      const ingredients: ProductIngredientDisplay[] = (product.chitietthanhphan as ProductIngredient[]).map((ingredient: ProductIngredient) => ({
        masanpham: product.masanpham,
        mathanhphan: ingredient.thanhphan.mathanhphan,
        tenthanhphan: ingredient.thanhphan.tenthanhphan,
        hamluong: ingredient.hamluong
      }));
      setProductIngredients(ingredients);
    }
  };

  // Tải tất cả dữ liệu cần thiết
  const fetchAllData = async () => {
    try {
      // Tải danh mục
      setLoadingDanhMuc(true);
      setLoadingThuongHieu(true);
      setLoadingKhuyenMai(true);
      setLoadingUnits(true);
      setLoadingIngredients(true);
      
      // Tải tất cả dữ liệu cùng lúc
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
    } finally {
      setLoadingDanhMuc(false);
      setLoadingThuongHieu(false);
      setLoadingKhuyenMai(false);
      setLoadingUnits(false);
      setLoadingIngredients(false);
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
      
      // Step 1: Update basic product information
      const response = await updateProduct(product.masanpham, formattedValues);
      
      // Thêm console.log để debug
      console.log("API response:", response);
      
      // Kiểm tra phản hồi từ API
      if (response !== null) {
        // Step 2: Upload images if needed
        if (imageChanged) {
          await handleUploadImages();
        }
        
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
    if (form.isFieldsTouched() || imageChanged) {
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

  // Image handling functions
  const handleFileChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setImageChanged(true);
    
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
    setImageChanged(true);
  };

  // Upload images function
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
      
      // Only upload if there are new files or main image has changed
      if (files.length > 0 || imageChanged) {
        await uploadProductImages(product.id, files, mainImageIndex);
        
        setNotification({
          visible: true,
          type: 'success',
          message: 'Upload ảnh thành công!'
        });
      }
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

  // Handler cho đơn vị tính
  const handleAddUnit = async (values: any) => {
    try {
      const unitData: ChiTietDonVi = {
        masanpham: product.masanpham,
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
    try {
      console.log('Adding ingredient with:', {
        masanpham: product.masanpham,
        mathanhphan: values.mathanhphan,
        hamluong: values.hamluong
      });
      
      const result = await addIngredientDetailsForProduct(
        product.masanpham,
        values.mathanhphan,
        values.hamluong
      );
      
      if (result) {
        // Thêm tên thành phần vào dữ liệu để hiển thị
        const ingredientName = ingredientList.find(ing => ing.mathanhphan === values.mathanhphan)?.tenthanhphan || '';
        
        setProductIngredients([...productIngredients, {...result, tenthanhphan: ingredientName}]);
        ingredientForm.resetFields();
        message.success('Thêm thành phần thành công');
      }
    } catch (error: any) {
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
      onOk: () => {
        setProductIngredients(productIngredients.filter(ingredient => 
          !(ingredient.mathanhphan === record.mathanhphan && ingredient.masanpham === record.masanpham)
        ));
        message.success('Đã xóa thành phần');
      }
    });
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
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="product-edit-tabs"
        >
          <TabPane tab="Thông tin cơ bản" key="1">
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
                          <Select
                            showSearch
                            placeholder="Chọn thương hiệu"
                            optionFilterProp="children"
                            loading={loadingThuongHieu}
                            filterOption={(input, option) => 
                              (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                            }
                            options={thuongHieuList.map(th => ({
                              value: th.mathuonghieu,
                              label: th.tenthuonghieu,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item 
                      name="machuongtrinh" 
                      label="Chương trình khuyến mãi"
                    >
                      <Select
                        showSearch
                        placeholder="Chọn chương trình khuyến mãi"
                        optionFilterProp="children"
                        loading={loadingKhuyenMai}
                        allowClear
                        filterOption={(input, option) => 
                          (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                        }
                        options={khuyenMaiList.map(km => ({
                          value: km.machuongtrinh,
                          label: km.tenchuongtrinh,
                        }))}
                      />
                    </Form.Item>
                  </Card>
                  
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
                          label="Hạn sử dụng (tháng)"
                          rules={[{ required: true, message: 'Vui lòng nhập hạn sử dụng' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Nhập hạn sử dụng (tháng)"
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
                    >
                      <TextArea rows={4} placeholder="Nhập chống chỉ định" />
                    </Form.Item>
                    
                    <Form.Item 
                      name="doituongsudung" 
                      label="Đối tượng sử dụng"
                    >
                      <TextArea rows={4} placeholder="Nhập đối tượng sử dụng" />
                    </Form.Item>
                    
                    <Form.Item 
                      name="luuy" 
                      label="Lưu ý"
                    >
                      <TextArea rows={4} placeholder="Nhập lưu ý khi sử dụng" />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
            </Form>
          </TabPane>
          
          <TabPane tab="Ảnh sản phẩm" key="2">
            <Card 
              title={<Title level={5}>Quản lý ảnh sản phẩm</Title>}
              bordered={false}
            >
              <div className="product-info-summary mb-4">
                <Title level={5}>Thông tin sản phẩm:</Title>
                <div className="flex flex-wrap gap-4">
                  <div><Text strong>Mã sản phẩm:</Text> {product.masanpham}</div>
                  <div><Text strong>Tên sản phẩm:</Text> {product.tensanpham}</div>
                </div>
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
              >
                <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
              </Modal>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  type="primary" 
                  onClick={handleUploadImages}
                  icon={<UploadOutlined />}
                  disabled={!imageChanged || fileList.length === 0}
                >
                  {imageChanged ? 'Lưu thay đổi ảnh' : 'Không có thay đổi'}
                </Button>
              </div>
            </Card>
          </TabPane>
          
          <TabPane tab="Đơn vị tính & Thành phần" key="3">
            <div className="unit-ingredient-container">
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Card 
                    title={<Title level={5}>Quản lý đơn vị tính</Title>}
                    bordered={false}
                    className="product-card mb-4"
                  >
                    <div className="product-info-summary mb-4">
                      <div className="flex flex-wrap gap-4">
                        <div><Text strong>Mã sản phẩm:</Text> {product.masanpham}</div>
                        <div><Text strong>Tên sản phẩm:</Text> {product.tensanpham}</div>
                      </div>
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
                          loading={loadingUnits}
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                          }
                          options={unitList.map(unit => ({
                            value: unit.madonvitinh,
                            label: unit.donvitinh,
                          }))}
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
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
                    </Form>
                    
                    {productUnits.length > 0 && (
                      <div className="mt-4">
                        <Divider orientation="left">Đơn vị tính đã thêm</Divider>
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
                    title={<Title level={5}>Quản lý thành phần sản phẩm</Title>}
                    bordered={false}
                    className="product-card"
                  >
                    <div className="product-info-summary mb-4">
                      <div className="flex flex-wrap gap-4">
                        <div><Text strong>Mã sản phẩm:</Text> {product.masanpham}</div>
                        <div><Text strong>Tên sản phẩm:</Text> {product.tensanpham}</div>
                      </div>
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
                          loading={loadingIngredients}
                          filterOption={(input, option) => 
                            (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
                          }
                          options={ingredientList.map(ingredient => ({
                            value: ingredient.mathanhphan,
                            label: ingredient.tenthanhphan,
                          }))}
                          dropdownRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: '8px 0' }} />
                              <div style={{ display: 'flex', padding: '0 8px 4px' }}>
                                <Input
                                  placeholder="Tên thành phần mới"
                                  value={newIngredientName}
                                  onChange={(e) => setNewIngredientName(e.target.value)}
                                  style={{ marginRight: 8, flex: 1 }}
                                />
                                <Button type="text" icon={<PlusOutlined />} onClick={handleAddNewIngredient}>
                                  Thêm mới
                                </Button>
                              </div>
                            </>
                          )}
                        />
                      </Form.Item>
                      
                      <Form.Item
                        name="hamluong"
                        label="Hàm lượng"
                        rules={[{ required: true, message: 'Vui lòng nhập hàm lượng' }]}
                      >
                        <Input placeholder="Nhập hàm lượng (vd: 500mg)" />
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
                    </Form>
                    
                    {productIngredients.length > 0 && (
                      <div className="mt-4">
                        <Divider orientation="left">Thành phần đã thêm</Divider>
                        <Table
                          dataSource={productIngredients}
                          columns={[
                            {
                              title: 'Tên thành phần',
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
          </TabPane>
        </Tabs>
      </Spin>
      
      <style jsx global>{`
        .product-edit-tabs .ant-tabs-nav {
          margin-bottom: 24px;
        }
        
        .image-list {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
        }
        
        .image-item {
          position: relative;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .image-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          padding: 4px;
        }
        
        .upload-container .ant-upload-list-picture-card-container {
          width: 128px;
          height: 128px;
        }
      `}</style>
    </div>
  );
}