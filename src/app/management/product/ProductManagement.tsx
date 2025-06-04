'use client';

import { useState, useEffect, useRef } from 'react';
import { Tabs, Table, Input, Button, Space, Image, Modal, Descriptions, Tag, Spin, Divider, 
         Card, Typography, Row, Col, message, Dropdown, Menu, List, Avatar, InputRef } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, CloseCircleOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getProducts, getProductBySearch, getProductByMaSanPham, deleteProductByMaSanPham } from '@/lib/api/productApi';

import EditProductForm from './EditProductForm';
import CustomNotification from '@/components/common/CustomNotificationProps';

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

export default function ProductManagement() {
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

  // Thêm state cho tính năng live search
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<InputRef>(null);

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const searchQuery = searchText.trim();
      let response;
      if (searchQuery) {
        response = await getProductBySearch(searchQuery, page, pageSize);
        if (response.data) {
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
        }
      } else {
        response = await getProducts(page, pageSize);
        console.log('Product response:', response);
        if (response.data) {
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
        }
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
        const response = await getProductBySearch(value, 1, 10); // Lấy tối đa 10 kết quả
        if (response.data) {
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
    debouncedSearch(value);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setShowSearchResults(false); // Ẩn dropdown kết quả
    setCurrentPage(1);
    fetchProducts(1);
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

  const handleDeleteProduct = async (masanpham: string, productName: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa sản phẩm',
      content: `Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setDeleteLoading(true);
          
          // Gọi API xóa sản phẩm
          const result = await deleteProductByMaSanPham(masanpham);
          
          console.log('Delete result:', result);
          
          // Đóng modal chi tiết nếu đang mở
          setDetailModalVisible(false);
          
          // Hiển thị thông báo thành công
          setNotification({
            visible: true,
            type: 'success',
            message: 'Xóa sản phẩm thành công!'
          });
          
          // Tải lại danh sách sản phẩm
          setTimeout(() => {
            fetchProducts(currentPage);
          }, 1000);
        } catch (error) {
          console.error('Lỗi khi xóa sản phẩm:', error);
          
          // Hiển thị thông báo lỗi
          setNotification({
            visible: true,
            type: 'error',
            message: error instanceof Error 
              ? `Lỗi khi xóa sản phẩm: ${error.message}` 
              : 'Có lỗi xảy ra khi xóa sản phẩm!'
          });
        } finally {
          setDeleteLoading(false);
        }
      }
    });
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
      width: 300,
      align: 'center',
      render: (_, record) => (
        <Space size="large">
          <Button 
            type="primary"
            size="large"
            icon={<EyeOutlined />}
            onClick={() => viewProductDetail(record.masanpham)}
          >
            Chi tiết
          </Button>
          <Button
            type="default"
            size="large"
            icon={<EditOutlined />}
            onClick={() => {
              viewProductDetail(record.masanpham).then(() => {
                handleEditProduct();
              });
            }}
          >
            Sửa
          </Button>
          <Button
            type="default"
            danger
            size="large"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.masanpham, record.tensanpham)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const modalFooter = selectedProduct && (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button 
        danger
        icon={<DeleteOutlined />}
        size="large"
        onClick={() => handleDeleteProduct(selectedProduct.masanpham, selectedProduct.tensanpham)}
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

  // Thêm hàm handleResultClick để xử lý khi người dùng chọn một kết quả
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
          onClose={() => setNotification(null)}
        />
      )}
      
      {editMode && selectedProduct ? (
        <EditProductForm 
          product={selectedProduct}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      ) : (
        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Danh sách sản phẩm" key="1">
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
                              }
                              title={item.tensanpham}
                              description={
                                <div>
                                  <div>Mã: {item.masanpham}</div>
                                  <div>Danh mục: {item.danhmuc?.tendanhmuc}</div>
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
              
              <Button type="primary" icon={<PlusOutlined />} size="middle">
                Thêm sản phẩm mới
              </Button>
            </div>
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
                onChange: (page) => {
                  setCurrentPage(page);
                  fetchProducts(page);
                },
                showSizeChanger: false,
                showTotal: (total) => `Tổng số: ${total} sản phẩm`,
                showQuickJumper: true,
                position: ['bottomRight']
              }}
              className="product-table"
            />
          </TabPane>
          <TabPane tab="Thêm sản phẩm mới" key="2">
            <div className="p-4">Form thêm sản phẩm sẽ được thêm vào đây</div>
          </TabPane>
        </Tabs>
      )}

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
                          {selectedProduct.hansudung} ngày
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                    
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
        .product-table .ant-table-cell {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        .product-row:hover {
          background-color: #f5f5f5;
        }
        
        .ant-descriptions-item-label {
          background-color: #fafafa;
        }
        
        /* Thêm CSS cho dropdown kết quả tìm kiếm */
        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          max-height: 400px;
          overflow-y: auto;
          background-color: white;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05);
          z-index: 1000;
        }
        
        .search-result-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .search-result-item:hover {
          background-color: #f5f5f5;
        }
        
        .empty-results, .search-loading {
          padding: 16px;
          text-align: center;
          color: rgba(0, 0, 0, 0.45);
        }
        
        .search-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 80px;
        }
      `}</style>
    </div>
  );
}
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

