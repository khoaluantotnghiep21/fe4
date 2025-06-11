'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { getPharmacyByEmployeeId, findOne } from '@/lib/api/pharmacyService';
import { createMultipleProducts, getListProductInPharmacy, updateReceiptStatus } from '@/lib/api/receiveApi';
import { Button, Card, Col, Form, Input, Row, Table, Typography, Modal, Select, Spin, Empty, Divider, InputNumber, Image, Avatar, Pagination, message } from 'antd';
import { PlusOutlined, DeleteOutlined, InboxOutlined, SearchOutlined, ShopOutlined, EnvironmentOutlined } from '@ant-design/icons';
import CustomNotification from '@/components/common/CustomNotificationProps';
import { getProducts, getProductBySearch } from '@/lib/api/productApi';
import { Product } from '@/types/product.types';

const { Title } = Typography;

// Interface for product in receive form
interface ProductForm {
  key: string;
  masanpham: string;
  tensanpham: string;
  soluong: string;
  productInfo?: Product; // Store the full product info
}

// Interface for pharmacy data
interface PharmacyData {
  id: string;
  idnhathuoc: string;
  machinhanh: string;
  diachi: string;
  thanhpho: string;
  quan: string;
  phuong?: string;
  tenduong?: string;
  diachicuthe?: string;
}

// Interface for product search
interface ProductSearchState {
  isLoading: boolean;
  searchText: string;
  results: Product[];
  visible: boolean;
  selectedProduct: Product | null;
}

const ReceiveProductsComponent = () => {
  const { user } = useUser();
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductForm[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [pharmacyDetailLoading, setPharmacyDetailLoading] = useState(false);
  
  // Product search state
  const [productSearch, setProductSearch] = useState<ProductSearchState>({
    isLoading: false,
    searchText: '',
    results: [],
    visible: false,
    selectedProduct: null
  });
  
  // Pagination state for search results
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  
  // Modal state for product selection
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<string | null>(null);
  
  // Reference for search timer
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    visible: false,
    type: 'success',
    message: ''
  });

  // Fetch pharmacy data for the current user
  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        if (user?.id) {
          setLoading(true);
          const pharmacyData = await getPharmacyByEmployeeId(user.id);
          
          if (pharmacyData && pharmacyData.length > 0) {
            const userPharmacy = pharmacyData[0];
            
            // Get detailed pharmacy information
            setPharmacyDetailLoading(true);
            const detailedPharmacy = await findOne(userPharmacy.machinhanh);
            
            if (detailedPharmacy) {
              // Combine the data
              setPharmacy({
                ...userPharmacy,
                ...detailedPharmacy
              });
            } else {
              setPharmacy(userPharmacy);
            }
          } else {
            setNotification({
              visible: true,
              type: 'error',
              message: 'Không tìm thấy thông tin chi nhánh cho nhân viên này!'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy data:', error);
        setNotification({
          visible: true,
          type: 'error',
          message: 'Lỗi khi lấy thông tin chi nhánh!'
        });
      } finally {
        setLoading(false);
        setPharmacyDetailLoading(false);
      }
    };

    fetchPharmacyData();
  }, [user]);

  // Search for products
  const handleProductSearch = async (searchText: string, page = 1) => {
    // Clear any existing timer
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    
    setProductSearch(prev => ({ 
      ...prev, 
      searchText,
      isLoading: true 
    }));

    // Debounce the search to prevent too many requests
    searchTimer.current = setTimeout(async () => {
      try {
        if (searchText.trim().length < 2) {
          setProductSearch(prev => ({ 
            ...prev, 
            results: [],
            isLoading: false 
          }));
          setPagination(prev => ({
            ...prev,
            current: 1,
            total: 0
          }));
          return;
        }

        // Get products from API with pagination using search endpoint
        const response = await getProductBySearch(searchText, { 
          page: page, 
          take: pagination.pageSize,
        });
        
        setProductSearch(prev => ({ 
          ...prev, 
          results: response.data,
          isLoading: false 
        }));
        
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.meta.total
        }));
      } catch (error) {
        console.error('Error searching products:', error);
        setProductSearch(prev => ({ 
          ...prev, 
          results: [],
          isLoading: false 
        }));
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: 0
        }));
      }
    }, 500);
  };
  
  // Handle pagination change
  const handlePaginationChange = (page: number) => {
    handleProductSearch(productSearch.searchText, page);
  };

  // Load initial product list
  const loadInitialProducts = async () => {
    try {
      setProductSearch(prev => ({ ...prev, isLoading: true }));
      const response = await getProducts({ 
        page: 1, 
        take: pagination.pageSize 
      });
      
      setProductSearch(prev => ({ 
        ...prev, 
        results: response.data, 
        isLoading: false 
      }));
      
      setPagination(prev => ({
        ...prev,
        current: 1,
        total: response.meta.total
      }));
    } catch (error) {
      console.error('Error loading initial products:', error);
      setProductSearch(prev => ({ ...prev, isLoading: false }));
      setPagination(prev => ({
        ...prev,
        current: 1,
        total: 0
      }));
    }
  };
  
  // Load pharmacy products
  const loadPharmacyProducts = async () => {
    try {
      if (!pharmacy?.machinhanh) return;
      
      setLoading(true);
      const response = await getListProductInPharmacy(
        pharmacy.machinhanh,
        { page: pagination.current, take: pagination.pageSize }
      );
      
      // Process the products as needed
      console.log('Pharmacy products:', response.data);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: response.meta.total
      }));
      
      // Here you could update a state to display these products if needed
      
    } catch (error) {
      console.error('Error loading pharmacy products:', error);
      setNotification({
        visible: true,
        type: 'error',
        message: 'Lỗi khi tải danh sách sản phẩm trong chi nhánh'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update receipt status
  

  // Open product selection modal
  const openProductModal = (key: string) => {
    setSelectedRowIndex(key);
    setProductModalVisible(true);
    
    // Reset search state
    setProductSearch({
      isLoading: true,
      searchText: '',
      results: [],
      visible: true,
      selectedProduct: null
    });
    
    // Reset pagination
    setPagination({
      current: 1,
      pageSize: 12,
      total: 0
    });
    
    // Load initial product list
    loadInitialProducts();
  };

  // Handle product selection from search results
  const handleSelectProduct = (product: Product) => {
    if (selectedRowIndex) {
      setProducts(products.map(item => {
        if (item.key === selectedRowIndex) {
          return {
            ...item,
            masanpham: product.masanpham,
            tensanpham: product.tensanpham,
            productInfo: product
          };
        }
        return item;
      }));
    } else {
      // If adding a new product directly
      const newKey = Date.now().toString();
      setProducts([
        ...products,
        {
          key: newKey,
          masanpham: product.masanpham,
          tensanpham: product.tensanpham,
          soluong: '1',
          productInfo: product
        }
      ]);
    }
    
    setProductModalVisible(false);
    setSelectedRowIndex(null);
  };
  
  // Add a new product row and immediately open product selection modal
  const handleAddProduct = () => {
    // Generate a key for the new row
    const newKey = Date.now().toString();
    // Open product selection modal with this key
    openProductModal(newKey);
  };

  // Add a blank product row (manual entry)
  const handleAddBlankProduct = () => {
    const newKey = Date.now().toString();
    setProducts([...products, { key: newKey, masanpham: '', tensanpham: '', soluong: '1' }]);
  };

  // Remove a product row
  const handleRemoveProduct = (key: string) => {
    setProducts(products.filter(product => product.key !== key));
  };

  // Handle product code change (manual entry)
  const handleProductCodeChange = (value: string, key: string) => {
    setProducts(
      products.map(product => {
        if (product.key === key) {
          return { ...product, masanpham: value };
        }
        return product;
      })
    );
  };

  // Handle product quantity change
  const handleQuantityChange = (value: string, key: string) => {
    setProducts(
      products.map(product => {
        if (product.key === key) {
          return { ...product, soluong: value };
        }
        return product;
      })
    );
  };

  // Submit form to receive products
  const handleSubmit = async () => {
    try {
      if (!pharmacy?.machinhanh) {
        setNotification({
          visible: true,
          type: 'error',
          message: 'Không tìm thấy thông tin chi nhánh!'
        });
        return;
      }

      if (products.length === 0) {
        setNotification({
          visible: true,
          type: 'error',
          message: 'Vui lòng thêm ít nhất một sản phẩm!'
        });
        return;
      }

      const invalidProducts = products.filter(product => !product.masanpham || !product.soluong);
      if (invalidProducts.length > 0) {
        setNotification({
          visible: true,
          type: 'error',
          message: 'Vui lòng nhập đầy đủ thông tin cho tất cả sản phẩm!'
        });
        return;
      }

      setLoading(true);

      // Format products data for API
      const productData = products.map(product => ({
        masanpham: product.masanpham,
        soluong: product.soluong
      }));

      // Call API to create multiple products
      const result = await createMultipleProducts(pharmacy.machinhanh, productData);

      if (result.statusCode === 200) {
        // Save the list of products that were successfully added
        const successProducts = [...products];
        
        // Set custom notification
        setNotification({
          visible: true,
          type: 'success',
          message: `Đã nhập ${products.length} sản phẩm vào kho thành công!`
        });
        
        // Show global Ant Design success notification
        message.success({
          content: `Nhập kho thành công ${products.length} sản phẩm!`,
          duration: 4,
          style: {
            marginTop: '20px',
          },
        });
        
        // Reset form after successful submission
        setProducts([]);
        
        // Show more detailed success message
        Modal.success({
          title: 'Nhập hàng thành công',
          content: (
            <div>
              <p className="text-lg mb-2">Đã nhập thành công {successProducts.length} sản phẩm vào kho chi nhánh <strong>{pharmacy?.machinhanh}</strong>.</p>
              <p className="mb-3 text-green-600">Hệ thống sẽ tải lại trang sau khi bạn xác nhận.</p>
              <div style={{ maxHeight: '300px', overflow: 'auto', margin: '10px 0' }}>
                <Table
                  dataSource={successProducts}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Ảnh',
                      key: 'image',
                      width: 70,
                      render: (_, record) => {
                        const mainImage = record.productInfo?.anhsanpham?.find(img => img.ismain === true);
                        return mainImage ? (
                          <Image
                            src={mainImage.url}
                            alt={record.tensanpham || 'Sản phẩm'}
                            width={50}
                            height={50}
                            style={{ objectFit: 'cover' }}
                            preview={false}
                          />
                        ) : (
                          <div style={{ width: 50, height: 50, background: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <InboxOutlined style={{ color: '#d9d9d9' }} />
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Mã sản phẩm',
                      dataIndex: 'masanpham',
                      key: 'masanpham',
                      width: 120
                    },
                    {
                      title: 'Tên sản phẩm',
                      dataIndex: 'tensanpham',
                      key: 'tensanpham'
                    },
                    {
                      title: 'SL',
                      dataIndex: 'soluong',
                      key: 'soluong',
                      width: 60,
                      align: 'center'
                    }
                  ]}
                />
              </div>
            </div>
          ),
          width: 600,
          centered: true,
          okText: "Xác nhận và tải lại",
          onOk: () => {
            // Instead of reloading the page, just load pharmacy products
            loadPharmacyProducts();
            // Clear the form
            setProducts([]);
          }
        });
      } else {
        setNotification({
          visible: true,
          type: 'error',
          message: result.message || 'Lỗi khi nhập hàng!'
        });
      }
    } catch (error: any) {
      console.error('Error submitting receive products:', error);
      setNotification({
        visible: true,
        type: 'error',
        message: error.message || 'Có lỗi xảy ra khi nhập hàng!'
      });
    } finally {
      setLoading(false);
    }
  };

  // Table columns definition
  const columns = [
    {
      title: 'Ảnh sản phẩm',
      key: 'image',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: ProductForm) => {
        const mainImage = record.productInfo?.anhsanpham?.find(img => img.ismain === true);
        return (
          <div style={{ padding: '4px' }}>
            {mainImage ? (
              <Image
                src={mainImage.url || '/placeholder-image.jpg'}
                alt={record.tensanpham || 'Sản phẩm'}
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
                preview={false}
              />
            ) : (
              <div 
                style={{ 
                  width: 80, 
                  height: 80, 
                  background: '#f5f5f5', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
              >
                <InboxOutlined style={{ fontSize: '24px', color: '#bfbfbf' }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Mã sản phẩm',
      dataIndex: 'masanpham',
      key: 'masanpham',
      render: (text: string, record: ProductForm) => (
        <div className="flex items-center">
          {record.productInfo ? (
            <div className="flex-1">
              <div className="font-medium">{record.masanpham}</div>
              {record.tensanpham && <div className="text-gray-500 text-sm">{record.tensanpham}</div>}
            </div>
          ) : (
            <Button 
              type="default" 
              onClick={() => openProductModal(record.key)}
              icon={<SearchOutlined />}
            >
              {text ? text : 'Chọn sản phẩm'}
            </Button>
          )}
        </div>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'tensanpham',
      key: 'tensanpham',
      render: (text: string, record: ProductForm) => (
        record.productInfo ? text : 
        <span className="text-gray-400 italic">Chưa chọn sản phẩm</span>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'soluong',
      key: 'soluong',
      width: 150,
      render: (text: string, record: ProductForm) => (
        <InputNumber
          min={1}
          value={Number(text)}
          onChange={(value) => handleQuantityChange(value?.toString() || "1", record.key)}
          placeholder="Số lượng"
          className="w-full"
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductForm) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveProduct(record.key)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <Title level={2} style={{ margin: 0 }}>Nhập Sản Phẩm Từ Kho Tổng</Title>
      </div>

      {pharmacy ? (
        <Card className="mb-6" title={
          <div className="flex items-center">
            <ShopOutlined className="mr-2" /> 
            <span>Thông tin chi nhánh</span>
          </div>
        }>
          {pharmacyDetailLoading ? (
            <div className="flex justify-center py-4">
              <Spin tip="Đang tải thông tin chi nhánh..." />
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <p className="mb-3">
                  <strong className="text-gray-700">Mã chi nhánh:</strong>{' '}
                  <span className="text-lg font-medium">{pharmacy.machinhanh}</span>
                </p>
                <p className="mb-3">
                  <EnvironmentOutlined className="mr-1 text-gray-500" />
                  <strong className="text-gray-700">Địa chỉ:</strong>{' '}
                  {pharmacy.diachicuthe || pharmacy.diachi}
                </p>
              </Col>
              <Col xs={24} md={12}>
                <p className="mb-3">
                  <strong className="text-gray-700">Thành phố:</strong>{' '}
                  {pharmacy.thanhpho}
                </p>
                <p className="mb-3">
                  <strong className="text-gray-700">Quận/Huyện:</strong>{' '}
                  {pharmacy.quan}
                  {pharmacy.phuong ? `, ${pharmacy.phuong}` : ''}
                </p>
              </Col>
            </Row>
          )}
        </Card>
      ) : (
        <Card className="mb-6" title="Thông tin chi nhánh">
          <div className="flex justify-center py-4">
            <Spin tip="Đang tải thông tin chi nhánh..." />
          </div>
        </Card>
      )}

      <Card 
        title="Danh sách sản phẩm nhập kho" 
        className="mb-6"
        extra={
          <Button
            type="primary"
            onClick={handleAddProduct}
            icon={<PlusOutlined />}
          >
            Thêm sản phẩm
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={products}
          pagination={false}
          rowKey="key"
          bordered
          locale={{
            emptyText: (
              <div className="text-center py-8">
                <InboxOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />
                <p className="mt-3 text-gray-500">
                  Chưa có sản phẩm nào trong danh sách nhập kho
                </p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddProduct}
                  className="mt-3"
                >
                  Thêm sản phẩm
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      <div className="flex justify-end">
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={products.length === 0 || !pharmacy}
          size="large"
          icon={<InboxOutlined />}
          style={{ minWidth: '180px', height: '40px' }}
        >
          Xác nhận nhập kho
        </Button>
      </div>

      {/* Product Selection Modal */}
      <Modal
        title="Tìm kiếm sản phẩm"
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
        width={700}
        centered
        className="product-search-modal"
      >
        <div className="mb-5">
          <Input.Search
            placeholder="Nhập tên hoặc mã sản phẩm để tìm kiếm"
            enterButton={<SearchOutlined />}
            size="large"
            value={productSearch.searchText}
            onChange={(e) => handleProductSearch(e.target.value)}
            onSearch={(value) => handleProductSearch(value)}
            loading={productSearch.isLoading}
          />
        </div>

        {productSearch.isLoading ? (
          <div className="text-center py-10">
            <Spin tip="Đang tìm kiếm..." />
          </div>
        ) : productSearch.results.length > 0 ? (
          <>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <Table
                dataSource={productSearch.results}
                rowKey="id"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => handleSelectProduct(record),
                  style: { cursor: 'pointer' }
                })}
                columns={[
                  {
                    title: 'Ảnh sản phẩm',
                    key: 'image',
                    width: 80,
                    render: (_, record) => {
                      const mainImage = record.anhsanpham?.find(img => img.ismain === true);
                      return (
                        <div style={{ padding: '4px' }}>
                          <Avatar
                            src={mainImage?.url || '/placeholder-image.jpg'}
                            shape="square"
                            size={60}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      );
                    }
                  },
                  {
                    title: 'Mã sản phẩm',
                    dataIndex: 'masanpham',
                    key: 'masanpham',
                    width: 150
                  },
                  {
                    title: 'Tên sản phẩm',
                    dataIndex: 'tensanpham',
                    key: 'tensanpham',
                  },
                  {
                    title: '',
                    key: 'action',
                    width: 80,
                    render: (_, record) => (
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(record);
                        }}
                      >
                        Chọn
                      </Button>
                    )
                  }
                ]}
              />
            </div>
            
            <div className="pagination-container" style={{ marginTop: '16px', textAlign: 'right' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePaginationChange}
                showSizeChanger={false}
                showTotal={(total) => `Tổng ${total} sản phẩm`}
              />
            </div>
          </>
        ) : productSearch.searchText.length > 0 ? (
          <div className="text-center py-8">
            <Empty 
              description="Không tìm thấy sản phẩm phù hợp" 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-1">Nhập từ khóa để tìm kiếm sản phẩm</p>
            <p className="text-sm text-gray-400">Tối thiểu 2 ký tự</p>
          </div>
        )}

        <Divider />
        
        <div className="flex justify-between">
          <Button 
            size="large" 
            onClick={() => setProductModalVisible(false)}
          >
            Đóng
          </Button>
          <Button 
            type="default" 
            size="large"
            onClick={() => {
              handleAddBlankProduct();
              setProductModalVisible(false);
            }}
          >
            Nhập mã thủ công
          </Button>
        </div>
      </Modal>
      
      <style jsx global>{`
        .product-search-modal .ant-modal-content {
          border-radius: 8px;
          overflow: hidden;
        }
        .product-search-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        .product-search-modal .ant-modal-body {
          padding: 24px;
        }
        
        /* Product table styling */
        .ant-table-row {
          cursor: pointer;
          transition: all 0.3s;
        }
        .ant-table-row:hover {
          background-color: #f5f5f5;
        }
        
        /* Image styling */
        .ant-image {
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }
        .ant-image:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transform: scale(1.02);
        }
        
        /* Avatar styling */
        .ant-avatar {
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        /* Table cell styling */
        .ant-table-cell {
          vertical-align: middle;
        }
        
        /* Pagination styling */
        .pagination-container {
          margin-top: 16px;
          padding: 8px 0;
        }
        
        .ant-pagination-item-active {
          background-color: #1890ff;
          border-color: #1890ff;
        }
        
        .ant-pagination-item-active a {
          color: white;
        }
        
        @media (max-width: 768px) {
          .ant-table-cell {
            padding: 8px 6px;
          }
          
          .pagination-container {
            display: flex;
            justify-content: center;
          }
        }
      `}</style>

      {/* Custom notification component */}
      {notification.visible && (
        <CustomNotification
          type={notification.type}
          message={notification.message}
          duration={5000}
          visible={true}
          onClose={() => setNotification({ ...notification, visible: false })}
        />
      )}
    </div>
  );
};

export default ReceiveProductsComponent;

// Make component available for importing from other files
export { ReceiveProductsComponent };
