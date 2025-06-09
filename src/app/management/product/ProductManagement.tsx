'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Tabs, Table, Input, Button, Space, Image, Modal, Descriptions, Tag, Spin, Divider,
  Card, Typography, Row, Col, message, Dropdown, Menu, List, Avatar, InputRef
} from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, CloseCircleOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import CategoryManagement from './CategoryManagement';
import type { ColumnsType } from 'antd/es/table';
import { getProducts, getProductBySearch, getProductByMaSanPham, deleteProductByMaSanPham } from '@/lib/api/productApi';

import EditProductForm from './EditProductForm';
import AddProductForm from './AddProductForm';
import CustomNotification from '@/components/common/CustomNotificationProps';
import { ExclamationCircleTwoTone } from '@ant-design/icons';

interface Product {
  id: string;
  masanpham: string;
  tensanpham: string;
  slug: string;
  dangbaoche: string;
  congdung: string;
  chidinh: string;
  chongchidinh: string;
  thuockedon: boolean;
  motangan: string;
  doituongsudung: string;
  luuy: string;
  ngaysanxuat: string;
  hansudung: number;
  gianhap: number;
  mathuonghieu?: string;
  madanhmuc?: string;
  machuongtrinh?: string;
  danhmuc: {
    tendanhmuc: string;
    slug: string;
  };
  thuonghieu: {
    tenthuonghieu: string;
  };
  khuyenmai: {
    tenchuongtrinh: string;
    giatrikhuyenmai: number;
  };
  anhsanpham: {
    url: string;
    ismain: boolean | null;
  }[];
  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    giabanSauKhuyenMai: number;
    donvitinh: {
      donvitinh: string;
    };
  }[];
  chitietthanhphan: {
    hamluong: string;
    thanhphan: {
      tenthanhphan: string;
    };
  }[];
}

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

export default function ProductManagement({
  onExpiredStatusChange,
}: {
  onExpiredStatusChange?: (status: { hasExpired: boolean; hasWarning: boolean }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notification, setNotification] = useState<{ visible: boolean; type: 'success' | 'error'; message: string } | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);

  // Thêm state cho tính năng live search
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<InputRef>(null);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (onExpiredStatusChange) {
      const hasExpired = products.some(p => getExpiryStatus(p).status === "expired");
      const hasWarning = products.some(p => getExpiryStatus(p).status === "warning");
      onExpiredStatusChange({ hasExpired, hasWarning });
    }
  }, [products, onExpiredStatusChange]);

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const searchQuery = searchText.trim();
      let response;
      if (searchQuery) {
        response = await getProductBySearch(searchQuery, { page, take: pageSize });
      } else {
        response = await getProducts({ page, take: pageSize });
      }

      if (Array.isArray(response.data)) {
        setProducts(
          response.data.map((product: any) => ({
            ...product,
            khuyenmai: product.khuyenmai
              ? {
                tenchuongtrinh: product.khuyenmai.tenchuongtrinh,
                giatrikhuyenmai:
                  typeof (product.khuyenmai as any)?.giatrikhuyenmai === 'number'
                    ? (product.khuyenmai as any).giatrikhuyenmai
                    : 0,
              }
              : { tenchuongtrinh: '', giatrikhuyenmai: 0 },
          }))
        );
        setTotalItems(response.meta.total);
      } else {
        setProducts([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Tạo hàm debounce để không gọi API liên tục khi người dùng đang gõ
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useRef(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await getProductBySearch(value, { page: 1, take: 12 });
        if (Array.isArray(response.data)) {
          const normalizedProducts = response.data.map((product: any) => ({
            ...product,
            khuyenmai: product.khuyenmai
              ? {
                tenchuongtrinh: product.khuyenmai.tenchuongtrinh,
                giatrikhuyenmai:
                  typeof (product.khuyenmai as any)?.giatrikhuyenmai === 'number'
                    ? (product.khuyenmai as any).giatrikhuyenmai
                    : 0,
              }
              : { tenchuongtrinh: '', giatrikhuyenmai: 0 },
          }));
          setSearchResults(normalizedProducts);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Error during live search:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500)  // Đợi 500ms sau khi người dùng ngừng gõ
  ).current;

  // Thêm effect để lắng nghe click bên ngoài dropdown để đóng kết quả tìm kiếm
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !(searchInputRef.current as any).input.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.trim().length > 1) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  const handleSearch = (value: string) => {
    setSearchText(value);
    setShowSearchResults(false);
    setCurrentPage(1);
    fetchProducts(1); // Fetch products with the current search text immediately
  };

  const viewProductDetail = async (masanpham: string) => {
    setProductLoading(true);
    setDetailModalVisible(true);

    try {
      const product = await getProductByMaSanPham(masanpham);
      if (product) {
        const normalizedProduct = {
          ...product,
          khuyenmai: product.khuyenmai
            ? {
              tenchuongtrinh: product.khuyenmai.tenchuongtrinh,
              giatrikhuyenmai:
                typeof (product.khuyenmai as any)?.giatrikhuyenmai === 'number'
                  ? (product.khuyenmai as any).giatrikhuyenmai
                  : 0,
            }
            : { tenchuongtrinh: '', giatrikhuyenmai: 0 },
          chitietdonvi: product.chitietdonvi.map((donvi: any) => ({
            ...donvi,
            giabanSauKhuyenMai:
              typeof donvi.giabanSauKhuyenMai === 'number'
                ? donvi.giabanSauKhuyenMai
                : donvi.giaban,
          })),
        };
        setSelectedProduct(normalizedProduct);
      } else {
        console.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setProductLoading(false);
    }
  };

  const handleEditProduct = () => {
    setDetailModalVisible(false);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleEditSuccess = () => {
    setEditMode(false);
    fetchProducts(currentPage);
    message.success('Cập nhật sản phẩm thành công!');
  };
  const executeDeleteProduct = async (masanpham: string) => {
    try {
      setDeleteLoading(true);


      const result = await deleteProductByMaSanPham(masanpham);


      setDetailModalVisible(false);

      message.success('Xóa sản phẩm thành công!');
      setNotification({
        visible: true,
        type: 'success',
        message: 'Xóa sản phẩm thành công!'
      });

      setTimeout(() => {
        fetchProducts(currentPage);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);


      message.error('Có lỗi xảy ra khi xóa sản phẩm!');
      setNotification({
        visible: true,
        type: 'error',
        message: error instanceof Error
          ? `Lỗi khi xóa sản phẩm: ${error.message}`
          : 'Có lỗi xảy ra khi xóa sản phẩm!'
      });

      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteProduct = (masanpham: string, productName: string) => {
    console.log('handleDeleteProduct called with:', masanpham, productName);

    // Sử dụng trực tiếp confirm từ window để kiểm tra
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không?`)) {
      console.log('User confirmed deletion');
      executeDeleteProduct(masanpham);
    } else {
      console.log('Delete operation canceled by user');
    }

    // COMMENTED OUT: Ant Design Modal.confirm code to debug
    /*
    Modal.confirm({
      title: 'Xác nhận xóa sản phẩm',
      content: `Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      maskClosable: false,
      onOk: async () => {
        return executeDeleteProduct(masanpham);
      },
      onCancel() {
        console.log('Delete operation canceled');
      }
    });
    */
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Ảnh sản phẩm',
      key: 'image',
      width: 140,
      align: 'center',
      render: (record: Product) => {
        const mainImage = record.anhsanpham.find(img => img.ismain === true);
        return (
          <div style={{ padding: '8px' }}>
            <Image
              src={mainImage?.url || '/placeholder-image.jpg'}
              alt={record.tensanpham}
              width={100}
              height={100}
              style={{ objectFit: 'cover' }}
              preview={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Mã sản phẩm',
      dataIndex: 'masanpham',
      key: 'masanpham',
      width: 130,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'tensanpham',
      key: 'tensanpham',
      sorter: (a, b) => a.tensanpham.localeCompare(b.tensanpham),
      ellipsis: true,
      width: 260, 
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Danh mục',
      dataIndex: ['danhmuc', 'tendanhmuc'],
      key: 'danhmuc',
      sorter: (a, b) => a.danhmuc.tendanhmuc.localeCompare(b.danhmuc.tendanhmuc),
      width: 200,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="middle"
            shape="circle"
            title="Chi tiết"
            onClick={() => viewProductDetail(record.masanpham)}
            style={{ borderRadius: 6 }}
          />
          <Button
            icon={<EditOutlined />}
            size="middle"
            shape="circle"
            title="Sửa"
            onClick={() => {
              viewProductDetail(record.masanpham).then(() => {
                handleEditProduct();
              });
            }}
            style={{ borderRadius: 6, background: '#f5f5f5', color: '#1890ff', border: 'none' }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="middle"
            shape="circle"
            title="Xóa"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(record.masanpham, record.tensanpham);
            }}
            style={{ borderRadius: 6 }}
          />
        </Space>
      ),
    },
    {
      title: 'Hạn sử dụng',
      key: 'expiry',
      width: 180,
      render: (record: Product) => {
        const { status, expiryDate, diffDays } = getExpiryStatus(record);
        if (status === "expired") {
          return <Tag color="red">Đã hết hạn ({expiryDate.toLocaleDateString('vi-VN')})</Tag>;
        }
        if (status === "warning") {
          return <Tag color="orange">Sắp hết hạn ({diffDays} ngày)</Tag>;
        }
        return <Tag color="green">Còn hạn</Tag>;
      }
    },
  ];

  const modalFooter = selectedProduct && (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        danger
        icon={<DeleteOutlined />}
        size="large"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Modal delete button clicked for:', selectedProduct.masanpham);

          if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${selectedProduct.tensanpham}" không?`)) {
            executeDeleteProduct(selectedProduct.masanpham);
          }
        }}
        loading={deleteLoading}
      >
        Xóa sản phẩm
      </Button>
      <Button
        type="primary"
        icon={<EditOutlined />}
        size="large"
        onClick={handleEditProduct}
      >
        Sửa sản phẩm
      </Button>
    </div>
  );

  const handleResultClick = (product: Product) => {
    setShowSearchResults(false);
    viewProductDetail(product.masanpham);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {notification && notification.visible && (
        <CustomNotification
          type={notification.type}
          message={notification.message}
          duration={3000}
          onClose={() => {
            console.log('Notification closed');
            setNotification(null);
          }}
        />
      )}

      {editMode && selectedProduct ? (
        <EditProductForm
          product={selectedProduct}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      ) : (        <Tabs defaultActiveKey="1" type="card">
          <TabPane
            tab={
              <span>
                Danh sách sản phẩm
                {products.some(p => getExpiryStatus(p).status === "expired") && (
                  <ExclamationCircleTwoTone twoToneColor="#ff4d4f" style={{ marginLeft: 8, fontSize: 18, verticalAlign: 'middle' }} />
                )}
              </span>
            }
            key="1"
          >
            <div className="mb-6 flex justify-between items-center relative">
              <div className="relative" style={{ width: 350 }}>
                <Input.Search
                  ref={searchInputRef as any}
                  placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                  style={{ width: 350 }}
                  value={searchText}
                  onChange={handleSearchChange}
                  onSearch={handleSearch}
                  enterButton={<Button type="primary" icon={<SearchOutlined />}>Tìm kiếm</Button>}
                  size="middle"
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowSearchResults(true);
                        }
                      }}
                    />

                    {/* Dropdown kết quả tìm kiếm */}
                    {showSearchResults && (
                      <div className="search-results-dropdown">
                        {searchLoading ? (
                          <div className="search-loading">
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                            <span className="ml-2">Đang tìm kiếm...</span>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <List
                            itemLayout="horizontal"
                            dataSource={searchResults}
                            renderItem={item => (
                              <List.Item
                                onClick={() => handleResultClick(item)}
                                className="search-result-item"
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar
                                      src={(item.anhsanpham.find(img => img.ismain === true)?.url) || '/placeholder-image.jpg'}
                                      shape="square"
                                      size={40}
                                    />
                                  } title={<span className="search-result-title">{item.tensanpham}</span>}
                                  description={
                                    <div>
                                      <div><Text strong>Mã:</Text> {item.masanpham}</div>
                                      <div><Text strong>Danh mục:</Text> {item.danhmuc?.tendanhmuc}</div>
                                      <div className="search-result-hint">Nhấn để xem chi tiết</div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : searchText.trim() !== '' ? (
                          <div className="empty-results">
                            Không tìm thấy sản phẩm phù hợp
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="middle"
                    onClick={() => setAddModalVisible(true)}
                  >
                    Thêm sản phẩm mới
                  </Button>

                </div>
                {searchText.trim() !== '' && products.length > 0 && (
                  <div className="search-result-info mb-3">
                    <Tag color="blue">Kết quả tìm kiếm cho: "{searchText}"</Tag>
                    <span className="ml-2">Tìm thấy {totalItems} sản phẩm</span>
                  </div>
                )}

                <Table
                  columns={columns}
                  dataSource={products}
                  rowKey="id"
                  loading={loading}
                  bordered
                  size="middle"
                  rowClassName={() => "product-row"}
                  pagination={{
                    total: totalItems,
                    pageSize: pageSize,
                    current: currentPage,
                    onChange: (page) => setCurrentPage(page),
                    showSizeChanger: false,
                    showTotal: (total) => `Tổng số: ${total} sản phẩm`,
                    showQuickJumper: true,
                    position: ['bottomRight']
                  }}                  className="product-table"
                  scroll={{ x: 1100 }} // responsive scroll
                />
          </TabPane>
          <TabPane tab="Quản lý danh mục" key="2">
            <div className="p-4">
              <CategoryManagement />
            </div>
          </TabPane>
          <TabPane tab="Thuốc hết hạn/sắp hết hạn" key="3">
            <Table
              columns={columns}
              dataSource={products.filter(p => {
                const { status } = getExpiryStatus(p);
                return status === "expired" || status === "warning";
              })}
              rowKey="id"
              pagination={false}
              bordered
              size="middle"
              title={() => "Danh sách thuốc hết hạn hoặc sắp hết hạn"}
            />
          </TabPane>
        </Tabs>
      )}

      {/* Modal thêm sản phẩm */}
      <Modal
        title="Thêm sản phẩm mới"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
        style={{ top: 20 }}
      >
        <AddProductForm
          onSuccess={() => {
            setAddModalVisible(false);
            fetchProducts(currentPage);
            message.success('Thêm sản phẩm thành công!');
          }}
          onCancel={() => setAddModalVisible(false)}
        />
      </Modal>

      {/* Chi tiết sản phẩm Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <Title level={4} style={{ margin: 0 }}>{selectedProduct?.tensanpham}</Title>
            {selectedProduct?.thuockedon &&
              <Tag color="red" style={{ marginLeft: 12 }}>Thuốc kê đơn</Tag>
            }
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={modalFooter}
        width={1000}
        style={{ top: 20 }}
        closeIcon={<CloseCircleOutlined />}
      >
        {productLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
          </div>
        ) : (
          selectedProduct && (
            <div className="product-detail-container">
              <Row gutter={[24, 24]}>
                <Col xs={24} md={10}>
                  <Card bordered={false} className="h-full shadow-sm">
                    <div className="mb-6">
                      {selectedProduct.anhsanpham.length > 0 ? (
                        <Image.PreviewGroup>
                          <div className="flex flex-col">
                            <div className="mb-4 flex justify-center">
                              <Image
                                src={(selectedProduct.anhsanpham.find(img => img.ismain === true)?.url) || selectedProduct.anhsanpham[0]?.url}
                                alt={selectedProduct.tensanpham}
                                width="100%"
                                height={300}
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                            <div className="flex gap-2 overflow-x-auto justify-center">
                              {selectedProduct.anhsanpham.map((img, index) => (
                                <div key={index} className="flex-shrink-0">
                                  <Image
                                    src={img.url}
                                    alt={`${selectedProduct.tensanpham} - ${index}`}
                                    width={60}
                                    height={60}
                                    style={{ objectFit: 'cover', border: img.ismain ? '2px solid #1890ff' : 'none' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </Image.PreviewGroup>
                      ) : (
                        <div className="flex justify-center items-center h-64 bg-gray-100 rounded-md">
                          <p>Không có hình ảnh</p>
                        </div>
                      )}
                    </div>

                    <Descriptions
                      title={<Title level={5} style={{ margin: '0 0 12px 0' }}>Thông tin cơ bản</Title>}
                      bordered
                      size="small"
                      column={1}
                      labelStyle={{ fontWeight: 'bold', width: '140px' }}
                      contentStyle={{ padding: '8px 12px' }}
                    >
                      <Descriptions.Item label="Mã sản phẩm">{selectedProduct.masanpham}</Descriptions.Item>
                      <Descriptions.Item label="Danh mục">{selectedProduct.danhmuc?.tendanhmuc}</Descriptions.Item>
                      <Descriptions.Item label="Thương hiệu">{selectedProduct.thuonghieu?.tenthuonghieu}</Descriptions.Item>
                      <Descriptions.Item label="Dạng bào chế">{selectedProduct.dangbaoche}</Descriptions.Item>
                      <Descriptions.Item label="Thuốc kê đơn">
                        {selectedProduct.thuockedon ?
                          <Tag color="red">Có</Tag> :
                          <Tag color="green">Không</Tag>
                        }
                      </Descriptions.Item>
                      <Descriptions.Item label="Giá nhập">{selectedProduct.gianhap.toLocaleString('vi-VN')} đ</Descriptions.Item>
                    </Descriptions>

                    <Divider style={{ margin: '20px 0' }} />

                    <Descriptions
                      title={<Title level={5} style={{ margin: '0 0 12px 0' }}>Đơn vị tính</Title>}
                      bordered
                      size="small"
                      column={1}
                      contentStyle={{ padding: '8px 12px' }}
                    >
                      {selectedProduct.chitietdonvi.map((donvi, index) => (
                        <Descriptions.Item key={index} label={`${donvi.donvitinh.donvitinh} (${donvi.dinhluong})`}>
                          <div>
                            <div>Giá bán: <Text strong>{donvi.giaban.toLocaleString('vi-VN')} đ</Text></div>
                            {donvi.giabanSauKhuyenMai !== donvi.giaban && (
                              <div>Giá KM: <Text type="danger" strong>{donvi.giabanSauKhuyenMai.toLocaleString('vi-VN')} đ</Text></div>
                            )}
                          </div>
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} md={14}>
                  <Card bordered={false} className="h-full shadow-sm">
                    <div className="mb-5">
                      <Title level={5}>Mô tả ngắn</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.motangan}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Công dụng</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.congdung}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Chỉ định</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.chidinh}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Chống chỉ định</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.chongchidinh}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Đối tượng sử dụng</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.doituongsudung}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Lưu ý</Title>
                      <Paragraph style={{ textAlign: 'justify' }}>{selectedProduct.luuy}</Paragraph>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Title level={5}>Thành phần</Title>
                      {selectedProduct.chitietthanhphan.length > 0 ? (
                        <ul className="pl-5">
                          {selectedProduct.chitietthanhphan.map((tp, index) => (
                            <li key={index} style={{ marginBottom: '4px' }}>
                              <Text strong>{tp.thanhphan.tenthanhphan}:</Text> {tp.hamluong}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Text>Không có thông tin thành phần</Text>
                      )}
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="mb-5">
                      <Descriptions
                        size="small"
                        column={2}
                        bordered
                        contentStyle={{ padding: '8px 12px' }}
                      >
                        <Descriptions.Item label="Ngày sản xuất" labelStyle={{ fontWeight: 'bold' }}>
                          {new Date(selectedProduct.ngaysanxuat).toLocaleDateString('vi-VN')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hạn sử dụng" labelStyle={{ fontWeight: 'bold' }}>
                          {selectedProduct.hansudung} tháng
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {selectedProduct && (() => {
                      const { status, expiryDate, diffDays } = getExpiryStatus(selectedProduct);
                      if (status === "expired") {
                        return <Tag color="red" style={{ marginLeft: 12 }}>ĐÃ HẾT HẠN ({expiryDate.toLocaleDateString('vi-VN')})</Tag>;
                      }
                      if (status === "warning") {
                        return <Tag color="orange" style={{ marginLeft: 12 }}>SẮP HẾT HẠN ({diffDays} ngày nữa)</Tag>;
                      }
                      return null;
                    })()}

                    {selectedProduct.khuyenmai && selectedProduct.khuyenmai.giatrikhuyenmai > 0 && (
                      <>
                        <Divider style={{ margin: '16px 0' }} />
                        <div className="mb-5">
                          <Title level={5}>Thông tin khuyến mãi</Title>
                          <Card size="small" bordered className="bg-yellow-50">
                            <Text strong>Chương trình:</Text> {selectedProduct.khuyenmai.tenchuongtrinh}
                            <br />
                            <Text strong>Giá trị:</Text> <Text type="danger">{selectedProduct.khuyenmai.giatrikhuyenmai}%</Text>
                          </Card>
                        </div>
                      </>
                    )}

                  </Card>
                </Col>
              </Row>
            </div>
          )
        )}
      </Modal>
      <style jsx global>{`
  @media (max-width: 900px) {
    .product-table .ant-table {
      font-size: 13px;
    }
    .product-table .ant-table-thead > tr > th,
    .product-table .ant-table-tbody > tr > td {
      padding: 8px 6px;
    }
    .product-table .ant-table-cell {
      min-width: 120px;
    }
    .product-table .ant-table-cell:nth-child(3) {
      min-width: 180px !important;
      max-width: 220px !important;
      white-space: normal;
    }
    .ant-tabs-nav-list {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 600px) {
    .product-table .ant-table-cell {
      font-size: 12px;
      min-width: 90px;
    }
    .product-table .ant-table-cell:nth-child(3) {
      min-width: 140px !important;
      max-width: 180px !important;
    }
    .ant-btn {
      min-width: 32px !important;
      padding: 0 !important;
    }
    .ant-tabs-nav-list {
      flex-wrap: wrap;
    }
  }
`}</style>
    </div>
  );
}
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

function getExpiryStatus(product: Product) {
  const nsx = new Date(product.ngaysanxuat);

  const expiryDate = new Date(nsx);
  expiryDate.setMonth(expiryDate.getMonth() + product.hansudung);

  const now = new Date();
  const diffDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { status: "expired", expiryDate, diffDays };
  if (diffDays <= 30) return { status: "warning", expiryDate, diffDays };
  return { status: "ok", expiryDate, diffDays };
}

