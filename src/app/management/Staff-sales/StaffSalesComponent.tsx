'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Table, Card, Button, Input, Select, Typography, Space, Badge, 
  Tag, Modal, Form, InputNumber, Image, Row, Col, Divider, 
  Spin, Empty, message, Pagination, Statistic, Tooltip 
} from 'antd';
import { 
  SearchOutlined, ShoppingCartOutlined, PlusOutlined, 
  MinusOutlined, DeleteOutlined, CreditCardOutlined, 
  DollarOutlined, ShopOutlined, BarcodeOutlined, 
  InboxOutlined, InfoCircleOutlined, CheckOutlined, 
  PrinterOutlined, UserOutlined
} from '@ant-design/icons';
import { useUser } from '@/context/UserContext';
import { getPharmacyByEmployeeId } from '@/lib/api/pharmacyService';
import { getListProductInPharmacy, PharmacyProduct } from '@/lib/api/receiveApi';
import { getProductByMaSanPham } from '@/lib/api/productApi';
import { createPurchaseOrder } from '@/lib/api/orderApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Define interfaces
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

// PharmacyProduct is now imported from '@/lib/api/receiveApi'

interface DetailedProduct {
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
  mathuonghieu: string;
  madanhmuc: string;
  machuongtrinh: string;
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
    donvitinh: {
      donvitinh: string;
    };
    giabanSauKhuyenMai: number;
  }[];
  chitietthanhphan: {
    hamluong: string;
    thanhphan: {
      tenthanhphan: string;
    };
  }[];
}

interface CartItem {
  masanpham: string;
  tensanpham: string;
  soluong: number;
  dongia: number;
  donvitinh: string;
  giaban: number;
  anhSanPham?: string;
  thuocKedon: boolean;
  key: string;
}

const StaffSalesComponent = () => {
  // States
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<PharmacyProduct[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productDetailVisible, setProductDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DetailedProduct | null>(null);
  const [detailedProductMap, setDetailedProductMap] = useState<Record<string, DetailedProduct>>({});
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  // Calculate totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.dongia * item.soluong, 0);
  }, [cart]);

  // Fetch pharmacy data for the current user
  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        if (user?.id) {
          setLoading(true);
          const pharmacyData = await getPharmacyByEmployeeId(user.id);
          
          if (pharmacyData && pharmacyData.length > 0) {
            setPharmacy(pharmacyData[0]);
            // Load products once we have the pharmacy data
            fetchProducts(pharmacyData[0].machinhanh);
          } else {
            message.error('Không tìm thấy thông tin chi nhánh cho nhân viên này!');
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy data:', error);
        message.error('Lỗi khi lấy thông tin chi nhánh!');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyData();
  }, [user]);

  // Fetch products for the pharmacy
  const fetchProducts = async (branchCode: string) => {
    try {
      setLoading(true);
      const response = await getListProductInPharmacy(branchCode);
      
      const productsData = response.data || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
      setPagination(prev => ({
        ...prev,
        total: productsData.length
      }));

      // Extract unique categories for filtering
      const uniqueCategories = new Set<string>();
      
      // Fetch detailed product information for each product
      const detailedProducts: Record<string, DetailedProduct> = {};
      for (const product of productsData) {
        try {
          const detailedProduct = await getProductByMaSanPham(product.masanpham);
          if (detailedProduct) {
            // Ensure khuyenmai.giatrikhuyenmai exists
            if (detailedProduct.khuyenmai) {
              if (typeof (detailedProduct.khuyenmai as any).giatrikhuyenmai === 'undefined') {
                (detailedProduct.khuyenmai as any).giatrikhuyenmai = 0;
              }
              if (typeof (detailedProduct.khuyenmai as any).tenchuongtrinh === 'undefined') {
                (detailedProduct.khuyenmai as any).tenchuongtrinh = '';
              }
            } else {
              detailedProduct.khuyenmai = { tenchuongtrinh: '', giatrikhuyenmai: 0 } as any;
            }
            detailedProducts[product.masanpham] = detailedProduct as DetailedProduct;
            
            // Add category to unique set
            if (detailedProduct.danhmuc?.tendanhmuc) {
              uniqueCategories.add(detailedProduct.danhmuc.tendanhmuc);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch details for product ${product.masanpham}:`, err);
        }
      }

      setDetailedProductMap(detailedProducts);
      
      // Create categories filter array
      const categoryOptions = [
        { value: 'all', label: 'Tất cả danh mục' },
        ...Array.from(uniqueCategories).map(category => ({
          value: category,
          label: category,
        })),
      ];
      setCategories(categoryOptions);

    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Lỗi khi tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    filterProducts(value, selectedCategory);
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    filterProducts(searchText, value);
  };

  // Filter products based on search text and category
  const filterProducts = (search: string, category: string) => {
    let filtered = [...products];
    
    // Filter by search text
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        product => 
          product.tensanpham.toLowerCase().includes(searchLower) ||
          product.masanpham.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product => {
        const detailedProduct = detailedProductMap[product.masanpham];
        return detailedProduct?.danhmuc?.tendanhmuc === category;
      });
    }
    
    setFilteredProducts(filtered);
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // Get current page data
  const getCurrentPageData = () => {
    const { current, pageSize } = pagination;
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // View product details
  const viewProductDetails = async (masanpham: string) => {
    try {
      setLoading(true);
      
      // Check if we already have detailed info for this product
      let detailedProduct = detailedProductMap[masanpham];
      
      // If not, fetch it
      if (!detailedProduct) {
        const fetchedProduct = await getProductByMaSanPham(masanpham);
        if (fetchedProduct) {
          // Ensure khuyenmai.giatrikhuyenmai exists
          if (fetchedProduct.khuyenmai) {
            if (typeof (fetchedProduct.khuyenmai as any).giatrikhuyenmai === 'undefined') {
              (fetchedProduct.khuyenmai as any).giatrikhuyenmai = 0;
            }
          } else {
            fetchedProduct.khuyenmai = { tenchuongtrinh: '', giatrikhuyenmai: 0 } as any;
          }
          
          detailedProduct = fetchedProduct as DetailedProduct;
          setDetailedProductMap(prev => ({
            ...prev,
            [masanpham]: detailedProduct!
          }));
        }
      }
      
      if (detailedProduct) {
        setSelectedProduct(detailedProduct);
        setProductDetailVisible(true);
      } else {
        message.error('Không thể tải thông tin chi tiết sản phẩm!');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      message.error('Lỗi khi tải thông tin chi tiết sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = (product: PharmacyProduct, quantity: number = 1) => {
    const detailedProduct = detailedProductMap[product.masanpham];
    
    if (!detailedProduct || !detailedProduct.chitietdonvi || detailedProduct.chitietdonvi.length === 0) {
      message.error('Không đủ thông tin về đơn giá sản phẩm!');
      return;
    }
    
    // Get price and unit details
    const priceInfo = detailedProduct.chitietdonvi[0];
    const price = priceInfo.giabanSauKhuyenMai || priceInfo.giaban;
    const unit = priceInfo.donvitinh.donvitinh;
    
    // Get main image url
    const mainImage = detailedProduct.anhsanpham?.find(img => img.ismain === true)?.url 
      || detailedProduct.anhsanpham?.[0]?.url;
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.masanpham === product.masanpham);
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      const updatedCart = [...cart];
      const totalQuantity = updatedCart[existingItemIndex].soluong + quantity;
      
      // Ensure we don't exceed available stock
      if (totalQuantity > product.soluong) {
        message.warning(`Chỉ còn ${product.soluong} sản phẩm trong kho!`);
        updatedCart[existingItemIndex].soluong = product.soluong;
      } else {
        updatedCart[existingItemIndex].soluong = totalQuantity;
      }
      
      setCart(updatedCart);
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        key: product.masanpham,
        masanpham: product.masanpham,
        tensanpham: product.tensanpham,
        soluong: Math.min(quantity, product.soluong),
        dongia: price,
        donvitinh: unit,
        giaban: price,
        anhSanPham: mainImage,
        thuocKedon: detailedProduct.thuockedon
      };
      
      setCart([...cart, newItem]);
    }
    
    message.success(`Đã thêm ${product.tensanpham} vào giỏ hàng!`);
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (masanpham: string, quantity: number) => {
    const product = products.find(p => p.masanpham === masanpham);
    
    if (!product) {
      message.error('Sản phẩm không tồn tại trong kho!');
      return;
    }
    
    // Check if quantity exceeds available stock
    if (quantity > product.soluong) {
      message.warning(`Chỉ còn ${product.soluong} sản phẩm trong kho!`);
      quantity = product.soluong;
    }
    
    // Update cart
    const updatedCart = cart.map(item => {
      if (item.masanpham === masanpham) {
        return { ...item, soluong: quantity };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (masanpham: string) => {
    setCart(cart.filter(item => item.masanpham !== masanpham));
    message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống!');
      return;
    }
    
    setPaymentModalVisible(true);
    
    // Pre-fill payment form
    paymentForm.setFieldsValue({
      paymentMethod: 'CASH',
      deliveryMethod: 'PICKUP',
      totalAmount: cartTotal,
      discount: 0,
      shippingFee: 0,
      finalAmount: cartTotal,
    });
  };

  // Confirm checkout
  const confirmCheckout = async (values: any) => {
    if (!pharmacy) {
      message.error('Không tìm thấy thông tin chi nhánh!');
      return;
    }
    
    try {
      setCheckoutLoading(true);
      
      const orderDetails = cart.map(item => ({
        masanpham: item.masanpham,
        soluong: item.soluong,
        giaban: item.dongia,
        donvitinh: item.donvitinh
      }));
      
      const orderData = {
        phuongthucthanhtoan: values.paymentMethod,
        hinhthucnhanhang: values.deliveryMethod,
        mavoucher: "VC00000", // Default value as required by API
        tongtien: values.totalAmount,
        giamgiatructiep: values.discount || 0,
        thanhtien: values.finalAmount,
        phivanchuyen: values.shippingFee || 0,
        machinhhanh: pharmacy.machinhanh,
        details: orderDetails
      };
      
      const result = await createPurchaseOrder(orderData);
      
      if (result) {
        // Success
        message.success('Đặt hàng thành công!');
        setPaymentModalVisible(false);
        
        // Clear cart
        setCart([]);
        
        // Show success modal with order information
        Modal.success({
          title: 'Đặt hàng thành công!',
          content: (
            <div>
              <p className="text-lg mb-2">Mã đơn hàng: <strong>{result.data.madonhang}</strong></p>
              <p>Tổng tiền: {values.finalAmount.toLocaleString('vi-VN')} VNĐ</p>
              <p>Phương thức thanh toán: {values.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Thẻ'}</p>
              <p>Thời gian: {dayjs().format('DD/MM/YYYY HH:mm')}</p>
            </div>
          ),
          okText: 'In hóa đơn',
          okButtonProps: {
            icon: <PrinterOutlined />
          },
          onOk: () => {
            // Print functionality can be added here
            message.info('Chức năng in hóa đơn đang phát triển!');
          }
        });
        
        // Refresh product list to get updated quantities
        if (pharmacy) {
          fetchProducts(pharmacy.machinhanh);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      message.error('Đặt hàng thất bại!');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Render product card
  const renderProductCard = (product: PharmacyProduct) => {
    const detailedProduct = detailedProductMap[product.masanpham];
    const mainImage = detailedProduct?.anhsanpham?.find(img => img.ismain === true)?.url 
      || detailedProduct?.anhsanpham?.[0]?.url;
    const price = detailedProduct?.chitietdonvi?.[0]?.giabanSauKhuyenMai 
      || detailedProduct?.chitietdonvi?.[0]?.giaban || 0;
    const unit = detailedProduct?.chitietdonvi?.[0]?.donvitinh.donvitinh || '';
    
    return (
      <Card 
        hoverable
        className="h-full"
        cover={
          <div className="h-40 flex items-center justify-center p-2 bg-gray-50">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.tensanpham}
                className="max-h-full object-contain"
                preview={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100">
                <InboxOutlined style={{ fontSize: '3rem', color: '#d9d9d9' }} />
              </div>
            )}
          </div>
        }
        actions={[
          <Tooltip title="Xem chi tiết" key="view">
            <Button 
              type="text" 
              icon={<InfoCircleOutlined />} 
              onClick={() => viewProductDetails(product.masanpham)}
            />
          </Tooltip>,
          <Tooltip title="Thêm vào giỏ" key="add">
            <Button 
              type="primary" 
              icon={<ShoppingCartOutlined />} 
              onClick={() => addToCart(product)}
              className="bg-blue-600"
            >
              Thêm
            </Button>
          </Tooltip>,
        ]}
      >
        <Card.Meta
          title={
            <Tooltip title={product.tensanpham}>
              <div className="truncate">{product.tensanpham}</div>
            </Tooltip>
          }
          description={
            <div>
              <div className="flex justify-between items-center">
                <Text type="secondary">{product.masanpham}</Text>
                <Badge 
                  count={product.soluong} 
                  overflowCount={999}
                  color={product.soluong > 10 ? 'green' : product.soluong > 5 ? 'gold' : 'red'}
                  showZero
                />
              </div>
              <div className="mt-2 flex justify-between items-center">
                <Text strong className="text-red-600">
                  {price.toLocaleString('vi-VN')} đ
                </Text>
                <Text type="secondary">/{unit}</Text>
              </div>
              
              {detailedProduct?.thuockedon && (
                <Tag color="orange" className="mt-2">Thuốc kê đơn</Tag>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  // Cart columns definition
  const cartColumns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (record: CartItem) => (
        <div className="flex items-center">
          {record.anhSanPham ? (
            <Image
              src={record.anhSanPham}
              alt={record.tensanpham}
              width={50}
              height={50}
              className="object-cover mr-3"
              preview={false}
            />
          ) : (
            <div className="w-[50px] h-[50px] bg-gray-100 flex items-center justify-center mr-3">
              <InboxOutlined style={{ color: '#d9d9d9' }} />
            </div>
          )}
          <div>
            <Tooltip title={record.tensanpham}>
              <div className="font-medium truncate max-w-[200px]">{record.tensanpham}</div>
            </Tooltip>
            <div className="text-gray-500 text-xs">{record.masanpham}</div>
            {record.thuocKedon && <Tag color="orange">Kê đơn</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'dongia',
      key: 'dongia',
      render: (dongia: number) => `${dongia.toLocaleString('vi-VN')} đ`,
    },
    {
      title: 'Số lượng',
      key: 'soluong',
      render: (record: CartItem) => (
        <div className="flex items-center">
          <Button
            icon={<MinusOutlined />}
            onClick={() => updateCartItemQuantity(record.masanpham, Math.max(1, record.soluong - 1))}
            size="small"
          />
          <InputNumber
            min={1}
            value={record.soluong}
            onChange={(value) => updateCartItemQuantity(record.masanpham, Number(value))}
            style={{ width: 60, margin: '0 8px' }}
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => updateCartItemQuantity(record.masanpham, record.soluong + 1)}
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (record: CartItem) => (
        <Text strong className="text-red-600">
          {(record.dongia * record.soluong).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: CartItem) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.masanpham)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Product listing section */}
      <div className="md:col-span-2">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="w-full md:w-auto">
              <Input.Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                enterButton="Tìm kiếm"
                size="large"
                onSearch={handleSearch}
                className="max-w-md"
                prefix={<SearchOutlined />}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <Select
                placeholder="Lọc theo danh mục"
                style={{ width: 200 }}
                size="large"
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={categories}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Empty description="Không tìm thấy sản phẩm nào" />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {getCurrentPageData().map((product) => (
                  <Col xs={24} sm={12} lg={8} key={product.masanpham}>
                    {renderProductCard(product)}
                  </Col>
                ))}
              </Row>
              
              <div className="mt-6 flex justify-center">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePaginationChange}
                  showSizeChanger
                  pageSizeOptions={['12', '24', '36']}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Cart and checkout section */}
      <div className="md:col-span-1">
        <Card 
          title={
            <div className="flex items-center">
              <ShoppingCartOutlined style={{ fontSize: '1.2rem', marginRight: 8 }} />
              <span>Giỏ hàng ({cart.length})</span>
            </div>
          }
          extra={
            <Button 
              type="primary" 
              danger 
              size="small"
              disabled={cart.length === 0}
              onClick={() => setCart([])}
            >
              Xóa tất cả
            </Button>
          }
          className="sticky top-4"
        >
          {cart.length === 0 ? (
            <Empty description="Giỏ hàng trống" />
          ) : (
            <>
              <div className="max-h-[500px] overflow-y-auto mb-4">
                <Table
                  dataSource={cart}
                  columns={cartColumns}
                  pagination={false}
                  rowKey="masanpham"
                  size="small"
                />
              </div>
              
              <Divider />
              
              <div className="flex justify-between items-center mb-4">
                <Text strong>Tổng tiền:</Text>
                <Text strong className="text-xl text-red-600">
                  {cartTotal.toLocaleString('vi-VN')} đ
                </Text>
              </div>
              
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="large"
                block
                onClick={handleCheckout}
                className="bg-green-600 hover:bg-green-700"
              >
                Thanh toán
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Product detail modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BarcodeOutlined />
            <span>Chi tiết sản phẩm</span>
          </div>
        }
        open={productDetailVisible}
        onCancel={() => setProductDetailVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setProductDetailVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="addToCart"
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              if (selectedProduct) {
                const product = products.find(p => p.masanpham === selectedProduct.masanpham);
                if (product) {
                  addToCart(product);
                }
              }
              setProductDetailVisible(false);
            }}
          >
            Thêm vào giỏ
          </Button>,
        ]}
      >
        {selectedProduct && (
          <div>
            <Row gutter={24}>
              <Col span={10}>
                <div className="flex justify-center mb-4">
                  {selectedProduct.anhsanpham && selectedProduct.anhsanpham.length > 0 ? (
                    <Image
                      src={selectedProduct.anhsanpham.find(img => img.ismain)?.url || selectedProduct.anhsanpham[0].url}
                      alt={selectedProduct.tensanpham}
                      height={200}
                      className="object-contain"
                    />
                  ) : (
                    <div className="h-[200px] w-full bg-gray-100 flex items-center justify-center">
                      <InboxOutlined style={{ fontSize: '3rem', color: '#d9d9d9' }} />
                    </div>
                  )}
                </div>
                
                {selectedProduct.anhsanpham && selectedProduct.anhsanpham.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {selectedProduct.anhsanpham.map((img, index) => (
                      <Image
                        key={index}
                        src={img.url}
                        alt={`${selectedProduct.tensanpham} - ${index}`}
                        width={60}
                        height={60}
                        className="object-cover border rounded"
                      />
                    ))}
                  </div>
                )}
                
                <Divider />
                
                <div>
                  <Text strong>Giá bán:</Text>
                  <div className="text-red-600 text-xl font-bold my-2">
                    {(selectedProduct.chitietdonvi?.[0]?.giabanSauKhuyenMai || 
                      selectedProduct.chitietdonvi?.[0]?.giaban || 0).toLocaleString('vi-VN')} đ
                    <Text type="secondary" className="text-sm ml-1">
                      /{selectedProduct.chitietdonvi?.[0]?.donvitinh?.donvitinh}
                    </Text>
                  </div>
                  
                  <div className="mt-4">
                    <Text strong>Mã sản phẩm:</Text> {selectedProduct.masanpham}
                  </div>
                  
                  <div className="mt-2">
                    <Text strong>Thương hiệu:</Text> {selectedProduct.thuonghieu?.tenthuonghieu}
                  </div>
                  
                  <div className="mt-2">
                    <Text strong>Danh mục:</Text> {selectedProduct.danhmuc?.tendanhmuc}
                  </div>
                  
                  {selectedProduct.thuockedon && (
                    <div className="mt-3">
                      <Tag color="orange">Thuốc kê đơn</Tag>
                    </div>
                  )}
                </div>
              </Col>
              
              <Col span={14}>
                <Title level={4}>{selectedProduct.tensanpham}</Title>
                
                <Divider />
                
                <div className="mb-4">
                  <Text strong>Mô tả:</Text>
                  <div className="mt-1 text-gray-700">{selectedProduct.motangan}</div>
                </div>
                
                <div className="mb-4">
                  <Text strong>Công dụng:</Text>
                  <div className="mt-1 text-gray-700">{selectedProduct.congdung}</div>
                </div>
                
                <div className="mb-4">
                  <Text strong>Chỉ định:</Text>
                  <div className="mt-1 text-gray-700">{selectedProduct.chidinh}</div>
                </div>
                
                {selectedProduct.chongchidinh && (
                  <div className="mb-4">
                    <Text strong>Chống chỉ định:</Text>
                    <div className="mt-1 text-gray-700">{selectedProduct.chongchidinh}</div>
                  </div>
                )}
                
                {selectedProduct.luuy && (
                  <div className="mb-4">
                    <Text strong type="danger">Lưu ý:</Text>
                    <div className="mt-1 text-red-600">{selectedProduct.luuy}</div>
                  </div>
                )}
                
                {selectedProduct.chitietthanhphan && selectedProduct.chitietthanhphan.length > 0 && (
                  <div className="mb-4">
                    <Text strong>Thành phần:</Text>
                    <ul className="list-disc pl-5 mt-1">
                      {selectedProduct.chitietthanhphan.map((tp, index) => (
                        <li key={index}>
                          {tp.thanhphan.tenthanhphan}: {tp.hamluong}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <Text strong>Hạn sử dụng:</Text>{' '}
                  {selectedProduct.hansudung} ngày kể từ ngày sản xuất
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Payment modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DollarOutlined />
            <span>Thanh toán</span>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <ShopOutlined className="mr-2" />
            <Text strong>Chi nhánh: </Text>
            <Text className="ml-2">{pharmacy?.machinhanh}</Text>
          </div>
          
          <div className="flex items-center">
            <UserOutlined className="mr-2" />
            <Text strong>Nhân viên: </Text>
            <Text className="ml-2">{user?.hoten}</Text>
          </div>
        </div>
        
        <Divider />
        
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={confirmCheckout}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán!' }]}
                initialValue="CASH"
              >
                <Select>
                  <Option value="CASH">
                    <DollarOutlined /> Tiền mặt
                  </Option>
                  <Option value="CARD">
                    <CreditCardOutlined /> Thẻ
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="deliveryMethod"
                label="Hình thức nhận hàng"
                rules={[{ required: true, message: 'Vui lòng chọn hình thức nhận hàng!' }]}
                initialValue="PICKUP"
              >
                <Select>
                  <Option value="PICKUP">Nhận tại cửa hàng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16} className="mt-4">
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="Tổng tiền hàng"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={((value: string | undefined) => Number((value || '').replace(/\$\s?|(,*)/g, ''))) as any}
                  addonAfter="VNĐ"
                  disabled
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="discount"
                label="Giảm giá"
                initialValue={0}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={((value: string | undefined) => Number((value || '').replace(/\$\s?|(,*)/g, ''))) as any}
                  addonAfter="VNĐ"
                  min={0}
                  onChange={val => {
                    const totalAmount = paymentForm.getFieldValue('totalAmount');
                    const shippingFee = paymentForm.getFieldValue('shippingFee') || 0;
                    paymentForm.setFieldsValue({
                      finalAmount: totalAmount - (val || 0) + shippingFee
                    });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shippingFee"
                label="Phí vận chuyển"
                initialValue={0}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={((value: string | undefined) => Number((value || '').replace(/\$\s?|(,*)/g, ''))) as any}
                  addonAfter="VNĐ"
                  min={0}
                  onChange={val => {
                    const totalAmount = paymentForm.getFieldValue('totalAmount');
                    const discount = paymentForm.getFieldValue('discount') || 0;
                    paymentForm.setFieldsValue({
                      finalAmount: totalAmount - discount + (val || 0)
                    });
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="finalAmount"
                label="Thành tiền"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="VNĐ"
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <div className="mt-4 flex justify-between">
            <Text strong className="text-lg">Tổng thanh toán:</Text>
            <Statistic
              value={paymentForm.getFieldValue('finalAmount') || cartTotal}
              suffix="VNĐ"
              precision={0}
              valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
            />
          </div>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button onClick={() => setPaymentModalVisible(false)}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={checkoutLoading}
              className="bg-green-600 hover:bg-green-700"
              icon={<CheckOutlined />}
            >
              Xác nhận thanh toán
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffSalesComponent;
