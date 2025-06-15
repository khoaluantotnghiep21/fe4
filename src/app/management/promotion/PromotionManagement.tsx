'use client';

import { useState, useEffect, use } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, DatePicker, InputNumber,
  Tag, Spin, message, Popconfirm, Tabs, Card, Typography, Row, Col,
  Select, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ExclamationCircleOutlined, TagsOutlined, FileSearchOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  getAllKhuyenMai,
  createNewPromotion,
  updatePromotion,
  deletePromotion,
  findAllProductByPromotion,
  CreatePromotionRequest,
  applyPromotionToProducts,
  removeAllPromotionFromProducts,
  getProductNoPromotion,
  deleteProductFromPromotion
} from '@/lib/api/khuyenMaiApi';
import { KhuyenMai } from '@/types/khuyenmai.types';
import { Product } from '@/types/product.types';
import { Voucher } from '@/types/voucher.types';
import { createNewVoucher, CreateVoucherRequest, deleteVoucher, getAllVouchers, updateVoucher } from '@/lib/api/voucherApi';

const { Title, Text } = Typography;
// Removed TabPane import - using items prop instead
const { confirm } = Modal;

export default function PromotionManagement() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [promotions, setPromotions] = useState<KhuyenMai[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<KhuyenMai | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalKhuyenMaiMode, setModalKhuyenMaiMode] = useState<'createKhuyenMai' | 'editKhuyenMai'>('createKhuyenMai');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [modalVoucherMode, setModalVoucherMode] = useState<'createVoucher' | 'editVoucher'>('createVoucher');
  // State cho tab sản phẩm trong khuyến mãi
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('1');

  // State cho modal thêm sản phẩm
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingAvailableProducts, setLoadingAvailableProducts] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedAvailableProductIds, setSelectedAvailableProductIds] = useState<string[]>([]);
  const [currentProductPage, setCurrentProductPage] = useState(1);

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    fetchVouchers();
  }
    , []);
  const fetchVouchers = async () => {
    try {
      const data = await getAllVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Không thể tải danh sách voucher');
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await getAllKhuyenMai();
      setPromotions(data);
    } catch (error) {
      message.error('Không thể tải danh sách chương trình khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByPromotion = async (machuongtrinh: string) => {
    setLoadingProducts(true);
    try {
      const data = await findAllProductByPromotion(machuongtrinh);

      // Log thông tin sản phẩm từ API promotion để so sánh
      if (data.length > 0) {
        console.log('Sample product from promotion API:', data[0]);
        console.log('Product ID from promotion API - type:', typeof data[0].id);
        console.log('Product ID from promotion API - value:', data[0].id);
      }

      setProducts(data);
    } catch (error) {
      console.error('Error fetching products by promotion:', error);
      message.error('Không thể tải danh sách sản phẩm trong chương trình khuyến mãi');
    } finally {
      setLoadingProducts(false);
    }
  };

  const showCreateModalKhuyenMai = () => {
    setModalKhuyenMaiMode('createKhuyenMai');
    setSelectedPromotion(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showCreateModalVoucher = () => {
    setModalVoucherMode('createVoucher');
    setSelectedVoucher(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModalKhuyenMai = (promotion: KhuyenMai) => {
    setModalKhuyenMaiMode('editKhuyenMai');
    setSelectedPromotion(promotion);
    form.setFieldsValue({
      ...promotion,
      ngaybatdau: promotion.ngaybatdau ? dayjs(promotion.ngaybatdau) : undefined,
      ngayketthuc: promotion.ngayketthuc ? dayjs(promotion.ngayketthuc) : undefined,
    });
    setIsModalVisible(true);
  };

  const showEditModalVoucher = (voucher: Voucher) => {
    setModalVoucherMode('editVoucher');
    setSelectedVoucher(voucher);
    form.setFieldsValue({
      ...voucher,
      hansudung: voucher.hansudung ? dayjs(voucher.hansudung) : undefined
    });
    setIsModalVisible(true);
  };



  const handleModalKMOk = async () => {
    try {
      const values = await form.validateFields();

      const formattedValues: CreatePromotionRequest = {
        ...values,
        ngaybatdau: values.ngaybatdau.format('YYYY-MM-DD'),
        ngayketthuc: values.ngayketthuc.format('YYYY-MM-DD'),
      };

      setLoading(true);

      if (modalKhuyenMaiMode === 'createKhuyenMai') {
        await createNewPromotion(formattedValues);
      } else if (modalKhuyenMaiMode === 'editKhuyenMai' && selectedPromotion) {
        await updatePromotion(selectedPromotion.machuongtrinh, formattedValues);
      }

      setIsModalVisible(false);
      fetchPromotions();
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalVoucherOk = async () => {
    try {
      const values = await form.validateFields();

      const formattedValues: CreateVoucherRequest = {
        ...values,
        hansudung: values.hansudung.format('YYYY-MM-DD'),
      };

      setLoading(true);

      if (modalVoucherMode === 'createVoucher') {
        await createNewVoucher(formattedValues);
      } else if (modalVoucherMode === 'editVoucher' && selectedVoucher) {
        await updateVoucher(selectedVoucher.mavoucher, formattedValues);
      }

      setIsModalVisible(false);
      fetchVouchers();
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalVoucherCancel = () => {
    setIsModalVisible(false);
  };

  const handleDeleteKM = async (mavoucher: string) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa voucher này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        setLoading(true);
        try {
          const success = await deleteVoucher(mavoucher);
          if (success) {
            fetchVouchers();
          }
        } catch (error) {
          console.error('Error deleting voucher:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleViewProducts = async (promotion: KhuyenMai) => {
    setSelectedPromotion(promotion);
    setActiveTab('2');
    await fetchProductsByPromotion(promotion.machuongtrinh);
  };

  const handleViewVoucherList = async (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setActiveTab('3');
    await fetchVouchers();
  };

  const handleRemoveProductFromPromotion = async (product: Product) => {
    if (!selectedPromotion) return;

    try {
      setLoadingProducts(true);
      // Sử dụng hàm API deleteProductFromPromotion để xóa một sản phẩm cụ thể
      const success = await deleteProductFromPromotion(selectedPromotion.machuongtrinh, product.masanpham);

      if (success) {
        await fetchProductsByPromotion(selectedPromotion.machuongtrinh);
      }
    } catch (error) {
      console.error('Error removing product from promotion:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleApplyPromotion = async () => {
    if (!selectedPromotion || selectedProductIds.length === 0) {
      message.warning('Vui lòng chọn sản phẩm để áp dụng khuyến mãi');
      return;
    }

    try {
      setLoadingProducts(true);
      const success = await applyPromotionToProducts(selectedPromotion.machuongtrinh, {
        productIds: selectedProductIds
      });

      if (success) {
        setSelectedProductIds([]);
        await fetchProductsByPromotion(selectedPromotion.machuongtrinh);
      }
    } catch (error) {
      console.error('Error applying promotion to products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const columns: ColumnsType<KhuyenMai> = [
    {
      title: 'Mã chương trình',
      dataIndex: 'machuongtrinh',
      key: 'machuongtrinh',
      width: 150,
    },
    {
      title: 'Tên chương trình',
      dataIndex: 'tenchuongtrinh',
      key: 'tenchuongtrinh',
      sorter: (a, b) => a.tenchuongtrinh.localeCompare(b.tenchuongtrinh),
    },
    {
      title: 'Giá trị KM',
      dataIndex: 'giatrikhuyenmai',
      key: 'giatrikhuyenmai',
      width: 120,
      render: (value) => `${value}%`,
    },
    {
      title: 'Đơn vị áp dụng',
      dataIndex: 'donviapdung',
      key: 'donviapdung',
      width: 150,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'ngaybatdau',
      key: 'ngaybatdau',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'ngayketthuc',
      key: 'ngayketthuc',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const today = dayjs();
        const startDate = dayjs(record.ngaybatdau);
        const endDate = dayjs(record.ngayketthuc);

        if (today.isBefore(startDate)) {
          return <Tag color="blue">Sắp diễn ra</Tag>;
        } else if (today.isAfter(endDate)) {
          return <Tag color="red">Đã kết thúc</Tag>;
        } else {
          return <Tag color="green">Đang áp dụng</Tag>;
        }
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => handleViewProducts(record)}
          >
            Sản phẩm
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModalKhuyenMai(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa chương trình này?"
            onConfirm={() => handleDeleteKM(record.machuongtrinh)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columnsVoucher: ColumnsType<Voucher> = [
    {
      title: 'Mã voucher',
      dataIndex: 'mavoucher',
      key: 'mavoucher',
      width: 150,
    },
    {
      title: 'Loại voucher',
      dataIndex: 'loaivoucher',
      key: 'loaivoucher',
      sorter: (a, b) => a.mavoucher.localeCompare(b.mavoucher),
      render: (value) => value === true || value === 'true' ? 'Giảm phần trăm' : 'Giảm tiền mặt',
    },
    {
      title: 'Số lượng',
      dataIndex: 'soluong',
      key: 'soluong',
      width: 120,
    },
    {
      title: 'Giá trị KM',
      dataIndex: 'giatri',
      key: 'giatri',
      width: 120,
      render: (value, record) => {
        const giatri = value == null ? 0 : value;
        return record.loaivoucher === true || String(record.loaivoucher) === 'true'
          ? `${giatri}%`
          : `${giatri.toLocaleString()}₫`;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, record) => {
        const today = dayjs();
        const hsd = dayjs(record.hansudung);

        if (today.isBefore(hsd)) {
          return <Tag color="blue">Sắp diễn ra</Tag>;
        } else if (today.isAfter(hsd)) {
          return <Tag color="red">Đã kết thúc</Tag>;
        } else {
          return <Tag color="green">Đang áp dụng</Tag>;
        }
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => showEditModalVoucher(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa voucher này?"
            onConfirm={() => handleDeleteKM(record.mavoucher)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const productColumns: ColumnsType<Product> = [
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 100,
      render: (_, record) => {
        const mainImage = record.anhsanpham?.find(img => img.ismain)?.url || '';
        return mainImage ? (
          <img
            src={mainImage}
            alt={record.tensanpham}
            style={{ width: 50, height: 50, objectFit: 'cover' }}
          />
        ) : null;
      },
    },
    {
      title: 'Mã sản phẩm',
      dataIndex: 'masanpham',
      key: 'masanpham',
      width: 150,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'tensanpham',
      key: 'tensanpham',
      sorter: (a, b) => a.tensanpham.localeCompare(b.tensanpham),
    },
    {
      title: 'Danh mục',
      key: 'danhmuc',
      width: 150,
      render: (_, record) => record.danhmuc?.tendanhmuc || '',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa sản phẩm này khỏi chương trình khuyến mãi?"
          onConfirm={() => handleRemoveProductFromPromotion(record)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger size="small" icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    }
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const fetchAvailableProducts = async () => {
    if (!selectedPromotion) return;

    setLoadingAvailableProducts(true);
    try {
      // Sử dụng API getProductNoPromotion để lấy các sản phẩm chưa được áp dụng khuyến mãi
      const products = await getProductNoPromotion();

      // Log một sản phẩm mẫu để kiểm tra cấu trúc
      if (products.length > 0) {
        console.log('Sample product structure:', products[0]);
        console.log('Product ID type:', typeof products[0].id);
        console.log('Product ID value:', products[0].id);
      }

      setAvailableProducts(products);
    } catch (error) {
      console.error('Error fetching available products:', error);
      message.error('Không thể tải danh sách sản phẩm khả dụng');
    } finally {
      setLoadingAvailableProducts(false);
    }
  };

  const handleAddProducts = () => {
    if (!selectedPromotion) {
      message.warning('Vui lòng chọn một chương trình khuyến mãi trước');
      return;
    }

    setSelectedAvailableProductIds([]);
    setIsProductModalVisible(true);
    fetchAvailableProducts();
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedAvailableProductIds(prev => [...prev, productId]);
    } else {
      setSelectedAvailableProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const handleAddSelectedProducts = async () => {
    if (!selectedPromotion || selectedAvailableProductIds.length === 0) {
      message.warning('Vui lòng chọn sản phẩm để áp dụng khuyến mãi');
      return;
    }

    try {
      setLoadingAvailableProducts(true);

      // In ra thông tin chi tiết về các ID sản phẩm đang được gửi đi
      console.log('Selected product IDs for promotion:', selectedAvailableProductIds);

      // Gửi các ID sản phẩm đã chọn đến API để áp dụng khuyến mãi
      const success = await applyPromotionToProducts(selectedPromotion.machuongtrinh, {
        productIds: selectedAvailableProductIds
      });

      if (success) {
        message.success('Đã thêm sản phẩm vào chương trình khuyến mãi thành công');
        setIsProductModalVisible(false);
        setSelectedAvailableProductIds([]);
        await fetchProductsByPromotion(selectedPromotion.machuongtrinh);
      }
    } catch (error) {
      console.error('Error applying promotion to products:', error);
      let errorMessage = 'Không thể thêm sản phẩm vào chương trình khuyến mãi';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      message.error(errorMessage);
    } finally {
      setLoadingAvailableProducts(false);
    }
  };

  const handleSearchProduct = (value: string) => {
    setSearchText(value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        {
          key: "1",
          label: "Danh sách chương trình khuyến mãi",
          children: (
            <>
              <div className="mb-4 flex justify-between items-center">
                <Title level={4}>Quản lý chương trình khuyến mãi</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showCreateModalKhuyenMai}
                >
                  Thêm chương trình khuyến mãi
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={promotions}
                rowKey="machuongtrinh"
                loading={loading}
                pagination={{
                  current: currentPage,
                  onChange: (page) => setCurrentPage(page),
                  pageSize: 10,
                  showSizeChanger: false,
                }}
              />
            </>
          )
        },
        {
          key: "2",
          label: "Sản phẩm trong chương trình",
          children: (
            <div className="mb-4">
              <Button
                onClick={() => setActiveTab('1')}
                className="mb-4"
              >
                &lt; Quay lại danh sách
              </Button>

              {selectedPromotion && (
                <Card className="mb-4">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>Mã chương trình:</Text> {selectedPromotion.machuongtrinh}
                    </Col>
                    <Col span={8}>
                      <Text strong>Tên chương trình:</Text> {selectedPromotion.tenchuongtrinh}
                    </Col>
                    <Col span={8}>
                      <Text strong>Giá trị khuyến mãi:</Text> {selectedPromotion.giatrikhuyenmai}%
                    </Col>
                  </Row>
                </Card>
              )}

              <div className="mb-4 flex justify-between">
                <Title level={5}>Danh sách sản phẩm trong chương trình khuyến mãi</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddProducts}
                >
                  Thêm sản phẩm
                </Button>
              </div>

              <Table
                columns={productColumns}
                dataSource={products}
                rowKey="id"
                loading={loadingProducts}
                pagination={{ pageSize: 10 }}
              />
            </div>
          )
        },
        {
          key: "3",
          label: "Danh sách voucher",
          children: (
            <>
              <div className="mb-4 flex justify-between items-center">
                <Title level={4}>Quản lý voucher</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showCreateModalVoucher}
                >
                  Thêm voucher
                </Button>
              </div>

              <Table
                columns={columnsVoucher}
                dataSource={vouchers}
                rowKey="mavoucher"
                loading={loading}
                pagination={{
                  current: currentPage,
                  onChange: (page) => setCurrentPage(page),
                  pageSize: 10,
                  showSizeChanger: false,
                }}
              />
            </>
          )
        }
      ]} />
      {/*Modal add khuyenmai*/}
      <Modal
        title={modalKhuyenMaiMode === 'createKhuyenMai' ? 'Thêm chương trình khuyến mãi' : 'Chỉnh sửa chương trình khuyến mãi'}
        open={isModalVisible}
        onOk={handleModalKMOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          name="promotion_form"
        >
          <Form.Item
            name="tenchuongtrinh"
            label="Tên chương trình"
            rules={[{ required: true, message: 'Vui lòng nhập tên chương trình' }]}
          >
            <Input placeholder="Nhập tên chương trình khuyến mãi" />
          </Form.Item>

          <Form.Item
            name="giatrikhuyenmai"
            label="Giá trị khuyến mãi (%)"
            rules={[
              { required: true, message: 'Vui lòng nhập giá trị khuyến mãi' },
              { type: 'number', min: 1, max: 100, message: 'Giá trị phải từ 1-100%' }
            ]}
          >
            <InputNumber
              placeholder="Nhập giá trị khuyến mãi"
              min={1}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="donviapdung"
            label="Đơn vị áp dụng"
            rules={[{ required: true, message: 'Vui lòng nhập đơn vị áp dụng' }]}
          >
            <Input placeholder="Nhập đơn vị áp dụng" />
          </Form.Item>

          <Form.Item
            name="ngaybatdau"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker
              placeholder="Chọn ngày bắt đầu"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="ngayketthuc"
            label="Ngày kết thúc"
            rules={[
              { required: true, message: 'Vui lòng chọn ngày kết thúc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue('ngaybatdau') ||
                    value.isAfter(getFieldValue('ngaybatdau'))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Ngày kết thúc phải sau ngày bắt đầu')
                  );
                }
              })
            ]}
          >
            <DatePicker
              placeholder="Chọn ngày kết thúc"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={modalVoucherMode === 'createVoucher' ? 'Thêm voucher' : 'Chỉnh sửa voucher'}
        open={isModalVisible}
        onOk={handleModalVoucherOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          name="promotion_form"
        >
          <Form.Item
            name="mavoucher"
            label="Mã voucher"
            rules={[{ required: true, message: 'Vui lòng nhập mã voucher' }]}
          >
            <Input placeholder="Nhập mã voucher" />
          </Form.Item>

            <Form.Item
            name="loaivoucher"
            label="Loại voucher"
            rules={[{ required: true, message: 'Vui lòng chọn loại voucher' }]}
            >
            <Select placeholder="Chọn loại voucher">
              <Select.Option value={true}>Giảm phần trăm</Select.Option>
              <Select.Option value={false}>Giảm trực tiếp</Select.Option>
            </Select>
            </Form.Item>
              <Form.Item
                shouldUpdate={(prev, curr) => prev.loaivoucher !== curr.loaivoucher}
              >
                {({ getFieldValue }) => {
                  const isPercent = getFieldValue('loaivoucher') === true;
                  return (
                    <Form.Item
                      name="giatri"
                      label={isPercent ? "Giá trị khuyến mãi (%)" : "Giá trị khuyến mãi (VNĐ)"}
                      rules={[
                        { required: true, message: 'Vui lòng nhập giá trị khuyến mãi' },
                        isPercent
                          ? { type: 'number', min: 1, max: 100, message: 'Giá trị phải từ 1-100%' }
                          : { type: 'number', min: 1000, message: 'Giá trị phải lớn hơn 1.000 VNĐ' }
                      ]}
                    >
                      <InputNumber
                        placeholder={isPercent ? "Nhập giá trị khuyến mãi (%)" : "Nhập giá trị khuyến mãi (VNĐ)"}
                        min={isPercent ? 1 : 1000}
                        max={isPercent ? 100 : undefined}
                        style={{ width: '100%' }}
                        formatter={value =>
                          isPercent
                            ? `${value}` // Không thêm % ở đây vì đã có label
                            : value
                              ? `${Number(value).toLocaleString()}`
                              : ''
                        }
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

          <Form.Item
            name="hansudung"
            label="Ngày hết hạn"
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          >
            <DatePicker
              placeholder="Chọn ngày hết hạn"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for adding products to promotion */}
      <Modal
        title="Thêm sản phẩm vào chương trình khuyến mãi"
        open={isProductModalVisible}
        onOk={handleAddSelectedProducts}
        onCancel={() => setIsProductModalVisible(false)}
        width={800}
        confirmLoading={loadingAvailableProducts}
      >
        <div className="mb-4">
          <Input
            placeholder="Tìm kiếm sản phẩm theo tên"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => handleSearchProduct(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <Table
          rowKey="id"
          dataSource={availableProducts.filter(p =>
            p.tensanpham.toLowerCase().includes(searchText.toLowerCase())
          )}
          loading={loadingAvailableProducts}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
          columns={[
            {
              title: 'Chọn',
              key: 'select',
              width: 60,
              render: (_, record) => (
                <Checkbox
                  checked={selectedAvailableProductIds.includes(record.id)}
                  onChange={e => handleProductSelection(record.id, e.target.checked)}
                />
              ),
            },
            {
              title: 'Hình ảnh',
              key: 'image',
              width: 80,
              render: (_, record) => {
                const mainImage = record.anhsanpham?.find(img => img.ismain)?.url || '';
                return mainImage ? (
                  <img
                    src={mainImage}
                    alt={record.tensanpham}
                    style={{ width: 40, height: 40, objectFit: 'cover' }}
                  />
                ) : null;
              },
            },
            {
              title: 'Mã sản phẩm',
              dataIndex: 'masanpham',
              key: 'masanpham',
              width: 120,
            },
            {
              title: 'Tên sản phẩm',
              dataIndex: 'tensanpham',
              key: 'tensanpham',
            },
            {
              title: 'Danh mục',
              key: 'danhmuc',
              width: 150,
              render: (_, record) => record.danhmuc?.tendanhmuc || '',
            },
          ]}
        />

        <div className="mt-4 flex justify-between items-center">
          <span>Đã chọn {selectedAvailableProductIds.length} sản phẩm</span>
          <Button
            type="primary"
            onClick={handleAddSelectedProducts}
            disabled={selectedAvailableProductIds.length === 0}
          >
            Thêm vào chương trình
          </Button>
        </div>
      </Modal>
    </div>
  );
}
