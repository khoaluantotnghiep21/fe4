'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { getPharmacyByEmployeeId, findOne } from '@/lib/api/pharmacyService';
import { createMultipleProducts, getListProductInPharmacy, updateReceiptStatus } from '@/lib/api/receiveApi';
import { Button, Card, Col, Form, Input, Row, Table, Typography, Modal, Select, Spin, Empty, Divider, InputNumber, Image, Avatar, Pagination, message, Space, notification } from 'antd';
import { PlusOutlined, DeleteOutlined, InboxOutlined, SearchOutlined, ShopOutlined, EnvironmentOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getProducts, getProductBySearch } from '@/lib/api/productApi';
import { Product } from '@/types/product.types';

const { Title } = Typography;

// Interface for product in receive form
interface ProductForm {
  key: string;
  masanpham: string;
  tensanpham: string;
  soluong: number;
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
  // Set up notification API from Ant Design
  const [api, contextHolder] = notification.useNotification();

  // Helper function for showing success notification
  const showSuccessNotification = (msg: string) => {
    api.success({
      message: 'Thành công',
      description: msg,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      placement: 'topRight',
      duration: 5
    });
  };

  // Helper function for showing error notification
  const showErrorNotification = (msg: string) => {
    api.error({
      message: 'Lỗi',
      description: msg,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      placement: 'topRight',
      duration: 5
    });
  };
  
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
            showErrorNotification('Không tìm thấy thông tin chi nhánh cho nhân viên này!');
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy data:', error);
        showErrorNotification('Lỗi khi lấy thông tin chi nhánh!');
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
          // If search text is empty or too short, load all products instead
          loadInitialProducts();
          return;
        }

        console.log(`Searching for products with text "${searchText}", page ${page}`);
        
        // Get products from API with pagination using search endpoint
        const response = await getProductBySearch(searchText, { 
          page: page, 
          take: pagination.pageSize,
        });
        
        console.log(`Found ${response.data.length} products, total: ${response.meta.total}`);
        
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
    console.log(`Pagination changed to page ${page}`);
    // If there's a search text, use search pagination, otherwise use general pagination
    if (productSearch.searchText.trim().length >= 2) {
      handleProductSearch(productSearch.searchText, page);
    } else {
      loadInitialProducts(page);
    }
  };
  // Load initial product list
  const loadInitialProducts = async (page = 1) => {
    try {
      setProductSearch(prev => ({ ...prev, isLoading: true }));
      
      console.log(`Loading initial products, page: ${page}, pageSize: ${pagination.pageSize}`);
      
      const response = await getProducts({ 
        page: page, 
        take: pagination.pageSize 
      });
      
      console.log(`Loaded ${response.data.length} products, total: ${response.meta.total}`);
      
      setProductSearch(prev => ({ 
        ...prev, 
        results: response.data, 
        isLoading: false,
        searchText: '' 
      }));
      
      setPagination(prev => ({
        ...prev,
        current: page,
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
      message.error('Không thể tải danh sách sản phẩm');
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
      showErrorNotification('Lỗi khi tải danh sách sản phẩm trong chi nhánh');
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
    loadInitialProducts(1);
  };
  // Handle product selection from search results
  const handleSelectProduct = (product: Product) => {
    console.log("Selecting product:", product.tensanpham);
    
    // Always add a new product directly to the list
    const newKey = Date.now().toString();
    setProducts([
      ...products,
      {
        key: newKey,
        masanpham: product.masanpham,
        tensanpham: product.tensanpham,
        soluong: 1,
        productInfo: product
      }
    ]);
    
    message.success(`Đã thêm sản phẩm: ${product.tensanpham}`);
    
    // Don't close the modal, allowing user to add multiple products
  };    // Open the product selection modal to add products
  const handleAddProduct = () => {
    // Just open the product selection modal without setting a selected row
    setSelectedRowIndex(null);
    setProductModalVisible(true);
    // Load initial product list
    loadInitialProducts(1);
  };

  // Add a blank product row (manual entry)
  const handleAddBlankProduct = () => {
      const newKey = Date.now().toString();
      setProducts([...products, { key: newKey, masanpham: '', tensanpham: '', soluong: 1 }]);
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
  const handleQuantityChange = (value: number, key: string) => {
    setProducts(
      products.map(product => {
        if (product.key === key) {
          return { ...product, soluong: value };
        }
        return product;
      })
    );
  };  // Check if all products have valid information
  const validateProducts = () => {
    if (products.length === 0) {
      showErrorNotification('Vui lòng thêm ít nhất một sản phẩm!');
      return false;
    }

    const invalidProducts = products.filter(product => !product.masanpham || !product.soluong);
    if (invalidProducts.length > 0) {
      showErrorNotification('Vui lòng nhập đầy đủ thông tin cho tất cả sản phẩm!');
      return false;
    }    const invalidQuantities = products.filter(product => 
      !product.soluong || product.soluong <= 0
    );
    if (invalidQuantities.length > 0) {
      showErrorNotification('Vui lòng nhập số lượng hợp lệ cho tất cả sản phẩm!');
      return false;
    }

    return true;
  };
  // Submit form to receive products
  const handleSubmit = async () => {
    try {
      if (!pharmacy?.machinhanh) {
        showErrorNotification('Không tìm thấy thông tin chi nhánh!');
        return;
      }

      // Validate products before submission
      if (!validateProducts()) {
        return;
      }

      setLoading(true);      // Format products data for API
      const productData = products.map(product => ({
        masanpham: product.masanpham,
        soluong: product.soluong // Ensuring soluong is passed as a number
      }));      try {
        // Log the product data to verify types
        console.log('Product data before API call:', productData, 
          'First product soluong type:', typeof productData[0]?.soluong);
        
        // Call API to create multiple products
        const result = await createMultipleProducts(pharmacy.machinhanh, productData);
        
        console.log('API Response:', result);
        
        // Force success handling for successful API calls regardless of message
        // HTTP 200-299 codes are considered successful
        if (result && (result.statusCode === 200 || typeof result.statusCode === 'undefined')) {
          // Save the list of products that were successfully added
          const successProducts = [...products];
          
          // Show success notification
          showSuccessNotification(`Đã nhập ${products.length} sản phẩm vào kho thành công!`);
          
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
          // Show error notification only for actual error responses
          const errorMsg = result.message || 'Lỗi khi nhập hàng!';
          console.error('Error response from API:', errorMsg);
          showErrorNotification(errorMsg);
        }
      } catch (error: any) {
        // Additional error handling for API call failures
        console.error('Error in API call:', error);
        showErrorNotification(error.message || 'Lỗi kết nối đến máy chủ');
      }    } catch (error: any) {
      console.error('Error submitting receive products:', error);
      
      // Determine if this is actually a success response mislabeled as an error
      const responseData = error.response?.data;
      
      // Check for terms in the message that might indicate success despite being in an error
      const messageText = (typeof responseData?.message === 'string' ? responseData.message : '').toLowerCase();
      const isActuallySuccess = messageText.includes('success') || 
                               messageText.includes('thành công') || 
                               messageText.includes('successfully');
                               
      if (isActuallySuccess) {
        // This is actually a success response
        console.log('Detected success in error response:', responseData?.message);
        
        const successProducts = [...products];
        
        // Show success notification
        showSuccessNotification(`Đã nhập ${products.length} sản phẩm vào kho thành công!`);
        
        // Reset form
        setProducts([]);
        
        // Show success modal
        Modal.success({
          title: 'Nhập hàng thành công',
          content: `Đã nhập ${successProducts.length} sản phẩm vào kho thành công!`,
          centered: true,
          onOk: () => {
            loadPharmacyProducts();
          }
        });
        
        return;
      }
      
      // Handle actual errors
      let errorMessage = 'Có lỗi xảy ra khi nhập hàng!';
      
      if (error.response?.data?.message) {
        // Get message from API error response
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Get direct error message
        errorMessage = error.message;
      }
      
      // Show error notification
      showErrorNotification(errorMessage);
      
      // Display error modal for better visibility
      Modal.error({
        title: 'Lỗi nhập hàng',
        content: errorMessage,
        centered: true
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
      width: 150,      render: (text: number, record: ProductForm) => (
        <InputNumber
          min={1}
          value={text}
          onChange={(value) => handleQuantityChange(value ?? 1, record.key)}
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

  // Load products when modal becomes visible
  useEffect(() => {
    if (productModalVisible) {
      loadInitialProducts(1);
    }
    
    return () => {
      // Clear any pending timers on unmount
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [productModalVisible]);

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
      </div>      {/* Product Selection Modal */}
      <Modal
        title="Chọn sản phẩm cần nhập kho"
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
        width={800}
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
                    width: 80,                    render: (_, record) => (
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<PlusOutlined />}
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

        <Divider />          <div className="flex justify-between">
          <Space>
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
          </Space>
          <Button 
            type="primary" 
            size="large"
            onClick={() => setProductModalVisible(false)}
          >
            Hoàn thành
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
      `}</style>      {/* Ant Design notification context holder */}
      {contextHolder}
    </div>
  );
};

export default ReceiveProductsComponent;

// Make component available for importing from other files
export { ReceiveProductsComponent };
