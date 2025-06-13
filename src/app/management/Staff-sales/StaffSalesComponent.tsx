'use client';

import { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Input, Select, Typography, Space, Badge, 
  Tag, Modal, Form, InputNumber, Image, Row, Col, Divider, 
  Spin, Empty, message, Pagination, Statistic, Tooltip, Tabs, 
  Avatar, Drawer, Radio, Checkbox
} from 'antd';
import { 
  SearchOutlined, ShoppingCartOutlined, PlusOutlined, 
  MinusOutlined, DeleteOutlined, CreditCardOutlined, 
  DollarOutlined, ShopOutlined, BarcodeOutlined, 
  InboxOutlined, InfoCircleOutlined, CheckOutlined, 
  PrinterOutlined, UserOutlined, FilterOutlined, 
  CalendarOutlined, MedicineBoxOutlined, HeartOutlined,
  ScanOutlined, FileTextOutlined, HistoryOutlined, EyeOutlined
} from '@ant-design/icons';
import { getProducts, getProductByMaSanPham } from '@/lib/api/productApi';
import { Product as ProductBase } from '@/types/product.types';

// Extend Product type to include hasBeenReceived
type Product = ProductBase & {
  hasBeenReceived?: boolean;
};
import { useUser } from '@/context/UserContext';
import { getPharmacyByEmployeeId, findOne } from '@/lib/api/pharmacyService';
import { getListProductInPharmacy, PharmacyProduct } from '@/lib/api/receiveApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock data for UI design
const mockCategories = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'thuoc-khang-sinh', label: 'Thuốc kháng sinh' },
  { value: 'thuoc-ha-sot', label: 'Thuốc hạ sốt' },
  { value: 'thuoc-da-day', label: 'Thuốc dạ dày' },
  { value: 'vitamin-khoang-chat', label: 'Vitamin & Khoáng chất' },
  { value: 'cham-soc-da', label: 'Chăm sóc da' },
  { value: 'thuc-pham-chuc-nang', label: 'Thực phẩm chức năng' },
];

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
  tennhathuoc?: string;
}

const StaffSalesComponent = () => {
  // User context
  const { user } = useUser();
  // States
  const [loading, setLoading] = useState(false);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<any[]>([]);
  const [productDetailVisible, setProductDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [prescriptionMode, setPrescriptionMode] = useState(false);
  const [customerInfoVisible, setCustomerInfoVisible] = useState(false);
  const [customerForm] = Form.useForm();
  const [orderHistoryVisible, setOrderHistoryVisible] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  
  // State for product unit selections - to avoid hook in render function
  const [productUnitSelections, setProductUnitSelections] = useState<Record<string, string>>({});
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.dongia || 0) * (item.soluong || 0), 0);

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
      filtered = filtered.filter(product => 
        product.danhmuc?.slug === category
      );
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
  const viewProductDetails = (product: Product) => {
    fetchProductDetail(product.masanpham);
  };

  // Add product to cart
  const addToCart = (product: Product, quantity: number = 1, selectedUnit?: string) => {
    // Check if product is prescription-only and we're not in prescription mode
    if (product.thuockedon && !prescriptionMode) {
      Modal.confirm({
        title: 'Thuốc kê đơn',
        content: 'Sản phẩm này là thuốc kê đơn. Bạn cần chuyển sang chế độ bán theo đơn thuốc.',
        okText: 'Chuyển sang chế độ đơn thuốc',
        cancelText: 'Hủy',
        onOk: () => {
          setPrescriptionMode(true);
          setCustomerInfoVisible(true);
        }
      });
      return;
    }
    
    // Lấy đơn vị tính và giá được chọn hoặc mặc định
    const unitToUse = selectedUnit || getDefaultPriceAndUnit(product).unit;
    const unitDetail = product.chitietdonvi.find(detail => detail.donvitinh.donvitinh === unitToUse);
    
    if (!unitDetail) {
      message.error('Không tìm thấy thông tin đơn vị tính!');
      return;
    }
    
    // Tính giá dựa trên đơn vị tính được chọn
    const price = unitDetail.giaban;
    const priceAfterDiscount = unitDetail.giabanSauKhuyenMai !== undefined ? 
      unitDetail.giabanSauKhuyenMai : price;
    const mainImage = getMainImage(product);
    
    // Kiểm tra sản phẩm với đơn vị tính này đã có trong giỏ hàng chưa
    const existingItemIndex = cart.findIndex(item => 
      item.masanpham === product.masanpham && item.donvitinh === unitToUse
    );
    
    if (existingItemIndex !== -1) {
      // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
      const updatedCart = [...cart];
      const totalQuantity = updatedCart[existingItemIndex].soluong + quantity;
      
      // Tính số lượng tối đa dựa trên định lượng của đơn vị
      const maxQuantityForUnit = unitDetail.dinhluong
        ? Math.floor((product.soluong || 0) / unitDetail.dinhluong)
        : (product.soluong || 0);
        
      if (totalQuantity > maxQuantityForUnit) {
        message.warning(`Chỉ còn ${maxQuantityForUnit} ${unitToUse} trong kho!`);
        updatedCart[existingItemIndex].soluong = maxQuantityForUnit;
      } else {
        updatedCart[existingItemIndex].soluong = totalQuantity;
      }
      
      setCart(updatedCart);
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      // Tính số lượng tối đa dựa trên định lượng của đơn vị
      const maxQuantityForUnit = unitDetail.dinhluong
        ? Math.floor((product.soluong || 0) / unitDetail.dinhluong)
        : (product.soluong || 0);
        
      if (maxQuantityForUnit <= 0) {
        message.warning(`Sản phẩm ${product.tensanpham} (${unitToUse}) đã hết hàng!`);
        return;
      }
      
      // Lấy danh sách các đơn vị tính có sẵn
      const availableUnits = product.chitietdonvi.map(detail => detail.donvitinh.donvitinh);
      
      const newItem = {
        key: `${product.masanpham}-${unitToUse}`,
        masanpham: product.masanpham,
        tensanpham: product.tensanpham,
        soluong: Math.min(quantity, maxQuantityForUnit),
        dongia: priceAfterDiscount,
        giaGoc: price !== priceAfterDiscount ? price : null,
        donvitinh: unitToUse,
        availableUnits: availableUnits, // Thêm mảng đơn vị tính có sẵn
        anhSanPham: mainImage,
        thuocKedon: product.thuockedon,
        manhaphang: product.manhaphang,
        ngaynhap: product.ngaynhap,
        dinhluong: unitDetail.dinhluong // Store the ratio for this unit
      };
      
      setCart([...cart, newItem]);
    }
    
    message.success(`Đã thêm ${product.tensanpham} (${unitToUse}) vào giỏ hàng!`);
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (itemKey: string, quantity: number) => {
    // Extract product code and unit from key (format: "masanpham-donvitinh")
    const [masanpham, donvitinh] = itemKey.split('-');
    
    const product = products.find(p => p.masanpham === masanpham);
    
    if (!product) {
      message.error('Sản phẩm không tồn tại trong kho!');
      return;
    }
    
    // Find unit detail to get dinhluong (ratio)
    const unitDetail = product.chitietdonvi.find(detail => detail.donvitinh.donvitinh === donvitinh);
    
    if (!unitDetail) {
      message.error('Không tìm thấy thông tin đơn vị tính!');
      return;
    }
    
    // Calculate max available quantity for this unit based on ratio
    const maxQuantityForUnit = unitDetail.dinhluong
      ? Math.floor((product.soluong || 0) / unitDetail.dinhluong)
      : (product.soluong || 0);
    
    // Check if quantity exceeds available stock (considering unit ratio)
    if (quantity > maxQuantityForUnit) {
      message.warning(`Chỉ còn ${maxQuantityForUnit} ${donvitinh} trong kho!`);
      quantity = maxQuantityForUnit;
    }
    
    // Update cart
    const updatedCart = cart.map(item => {
      if (item.key === itemKey) {
        return { ...item, soluong: quantity };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (itemKey: string) => {
    setCart(cart.filter(item => item.key !== itemKey));
    message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
  };

  // Handle unit change
  const handleUnitChange = (itemKey: string, newUnit: string) => {
    // Extract the product code from the key
    const [masanpham] = itemKey.split('-');
    
    // Tìm sản phẩm trong danh sách sản phẩm
    const product = products.find(p => p.masanpham === masanpham);
    if (!product) {
      message.error('Không tìm thấy thông tin sản phẩm!');
      return;
    }
    
    // Tìm thông tin đơn vị tính mới
    const unitDetail = product.chitietdonvi.find(detail => detail.donvitinh.donvitinh === newUnit);
    if (!unitDetail) {
      message.error('Không tìm thấy thông tin đơn vị tính!');
      return;
    }
    
    // Tính giá mới dựa trên đơn vị tính mới
    const price = unitDetail.giaban;
    const priceAfterDiscount = unitDetail.giabanSauKhuyenMai !== undefined ? 
      unitDetail.giabanSauKhuyenMai : price;
    
    // Cập nhật giỏ hàng với đơn vị tính và giá mới
    const updatedCart = cart.map(item => {
      if (item.key === itemKey) {
        // Create a new key with the new unit
        const newKey = `${masanpham}-${newUnit}`;
        return {
          ...item,
          key: newKey,
          donvitinh: newUnit,
          dongia: priceAfterDiscount,
          giaGoc: price !== priceAfterDiscount ? price : null
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống!');
      return;
    }
    
    if (prescriptionMode && !customerForm.getFieldValue('hoTen')) {
      message.warning('Vui lòng nhập thông tin khách hàng trước khi thanh toán!');
      setCustomerInfoVisible(true);
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
  const confirmCheckout = (values: any) => {
    setCheckoutLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCheckoutLoading(false);
      setPaymentModalVisible(false);
      setCart([]);
      
      // Show success modal
      Modal.success({
        title: 'Thanh toán thành công!',
        content: (
          <div>
            <p className="text-lg mb-2">Mã đơn hàng: <strong>DH{Math.floor(Math.random() * 10000).toString().padStart(5, '0')}</strong></p>
            <p>Tổng tiền: {values.finalAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p>Phương thức thanh toán: {values.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Thẻ'}</p>
            <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
            {prescriptionMode && (
              <p>Khách hàng: {customerForm.getFieldValue('hoTen')}</p>
            )}
          </div>
        ),
        okText: 'In hóa đơn',
        okButtonProps: {
          icon: <PrinterOutlined />
        },
        onOk: () => {
          message.info('Chức năng in hóa đơn đang phát triển!');
        }
      });
      
      // Reset prescription mode
      setPrescriptionMode(false);
    }, 1500);
  };

  // Hàm fetch sản phẩm từ nhà thuốc
  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        message.error('Không tìm thấy thông tin người dùng!');
        setLoading(false);
        return;
      }
      const pharmacyData = await getPharmacyByEmployeeId(user.id);
      const pharmacy = pharmacyData?.[0];
      if (!pharmacy.machinhanh) {
        console.error('Không có thông tin chi nhánh nhà thuốc');
        message.warning('Vui lòng đợi đến khi thông tin chi nhánh được tải xong');
        return;
      }

      // Lấy danh sách sản phẩm trong nhà thuốc
      console.log('Mã chi nhánh:', pharmacy.machinhanh);
      const pharmacyProductsResponse = await getListProductInPharmacy(pharmacy.machinhanh);
      console.log('API Response:', pharmacyProductsResponse);
      
      // Debug dữ liệu đầu ra từ API
      if (pharmacyProductsResponse) {
        console.log('Cấu trúc data:', Object.keys(pharmacyProductsResponse));
        
        if (pharmacyProductsResponse.data) {
          console.log('Cấu trúc data.data:', Object.keys(pharmacyProductsResponse.data));
          
          // Kiểm tra nếu data chứa một message
          if (
            typeof pharmacyProductsResponse.data === 'object' &&
            !Array.isArray(pharmacyProductsResponse.data) &&
            'message' in pharmacyProductsResponse.data
          ) {
            if (typeof pharmacyProductsResponse.data === 'object' && pharmacyProductsResponse.data !== null && 'message' in pharmacyProductsResponse.data) {
              console.log('Message:', (pharmacyProductsResponse.data as { message?: string }).message);
            }
          }
          
          // Kiểm tra nếu data chứa thành phần data
          if (
            pharmacyProductsResponse.data &&
            typeof pharmacyProductsResponse.data === 'object' &&
            !Array.isArray(pharmacyProductsResponse.data) &&
            'data' in pharmacyProductsResponse.data
          ) {
            const innerData = (pharmacyProductsResponse.data as any).data;
            if (Array.isArray(innerData)) {
              console.log('data.data là một mảng với', innerData.length, 'phần tử');
              if (innerData.length > 0) {
                console.log('Phần tử đầu tiên:', innerData[0]);
              }
            } else {
              console.log('data.data không phải mảng:', typeof innerData);
              console.log('Kết quả JSON.stringify:', JSON.stringify(innerData).substring(0, 200) + '...');
            }
          }
        }
      }
      
      // Xem hình ảnh: API Response có cấu trúc: 
      // {data: {data: [...], message: '...', success: true, totalProducts: 9}, meta: {...}}
      let pharmacyProducts: any[] = [];
      
      if (
        pharmacyProductsResponse?.data &&
        typeof pharmacyProductsResponse.data === 'object' &&
        !Array.isArray(pharmacyProductsResponse.data) &&
        'data' in pharmacyProductsResponse.data &&
        Array.isArray((pharmacyProductsResponse.data as any).data)
      ) {
        // Trường hợp API trả về {data: {data: [...]}}
        pharmacyProducts = (pharmacyProductsResponse.data as any).data;
      } else if (
        pharmacyProductsResponse?.data &&
        !Array.isArray(pharmacyProductsResponse.data) &&
        (pharmacyProductsResponse.data as any).data
      ) {
        // Trường hợp API trả về {data: {data: [{},...,{}]}} nhưng không phải mảng
        console.log('Dữ liệu không phải mảng, kiểm tra cấu trúc:', (pharmacyProductsResponse.data as any).data);
        // Thử chuyển đổi từ đối tượng sang mảng bằng cách trích xuất giá trị
        const objectData = (pharmacyProductsResponse.data as any).data;
        pharmacyProducts = Object.values(objectData).filter(item => typeof item === 'object' && item !== null);
      } else if (pharmacyProductsResponse?.data && Array.isArray(pharmacyProductsResponse.data)) {
        // Trường hợp API trả về {data: [...]}
        pharmacyProducts = pharmacyProductsResponse.data;
      } else {
        // Trích xuất giá trị thông báo để hiển thị
        let apiMessage = 'Không tìm thấy sản phẩm';
        if (
          pharmacyProductsResponse?.data &&
          typeof pharmacyProductsResponse.data === 'object' &&
          !Array.isArray(pharmacyProductsResponse.data) &&
          'message' in pharmacyProductsResponse.data
        ) {
          apiMessage = (pharmacyProductsResponse.data as { message?: string }).message || apiMessage;
        }
        console.log('Thông báo từ API:', apiMessage);
      }
      
      console.log('Pharmacy Products:', pharmacyProducts);

      if (pharmacyProducts.length === 0) {
        message.info('Không có sản phẩm nào trong kho của nhà thuốc');
        setProducts([]);
        setFilteredProducts([]);
        setPagination(prev => ({
          ...prev,
          total: 0
        }));
        return;
      }
      
      // Lấy thông tin chi tiết cho từng sản phẩm
      const productDetailsPromises = pharmacyProducts.map(async (pharmacyProduct) => {
        try {
          console.log('Đang lấy chi tiết sản phẩm:', pharmacyProduct);
          
          // Kiểm tra và đảm bảo pharmacyProduct có thuộc tính masanpham
          const productCode = pharmacyProduct.masanpham;
          if (!productCode) {
            console.error('Sản phẩm không có mã:', pharmacyProduct);
            return null;
          }
          
          const productDetail = await getProductByMaSanPham(productCode);
          if (productDetail) {
            // Kết hợp thông tin sản phẩm chi tiết với thông tin số lượng từ kho nhà thuốc
            // Kiểm tra xem sản phẩm đã được nhập kho (có mã nhập hàng) hay không
            const hasBeenReceived = Boolean(pharmacyProduct.manhaphang);
            
            return {
              ...productDetail,
              // Nếu sản phẩm đã được nhập kho, sử dụng số lượng từ API
              // Nếu chưa nhập kho, đánh dấu là null để hiển thị khác biệt
              soluong: hasBeenReceived ? pharmacyProduct.soluong : null,
              manhaphang: pharmacyProduct.manhaphang,
              ngaynhap: pharmacyProduct.ngaynhap || pharmacyProduct.ngaygui,
              hasBeenReceived, // Thêm flag để biết sản phẩm đã nhập kho hay chưa
            };
          } else {
            console.error(`Không tìm thấy thông tin chi tiết cho sản phẩm ${productCode}`);
          }
          return null;
        } catch (error) {
          console.error(`Lỗi khi lấy chi tiết sản phẩm:`, error);
          return null;
        }
      });
      
      const productDetails = await Promise.all(productDetailsPromises);
      const validProducts = productDetails.filter(product => product !== null) as Product[];
      
      console.log('Số lượng sản phẩm hợp lệ:', validProducts.length);
      if (validProducts.length > 0) {
        console.log('Mẫu sản phẩm đầu tiên:', validProducts[0]);
      }
      
      setProducts(validProducts);
      setFilteredProducts(validProducts);
      setPagination(prev => ({
        ...prev,
        total: validProducts.length
      }));
      
      if (validProducts.length > 0) {
        message.success(`Đã tải ${validProducts.length} sản phẩm thành công`);
      } else {
        message.warning('Không có sản phẩm nào được tải thành công');
      }
      
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', error);
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm lấy chi tiết sản phẩm
  const fetchProductDetail = async (masanpham: string) => {
    try {
      const product = await getProductByMaSanPham(masanpham);
      if (product) {
        // Tìm sản phẩm trong danh sách sản phẩm đã tải về để lấy thông tin tồn kho
        const existingProduct = products.find(p => p.masanpham === masanpham);
        
        // Lấy đơn vị đã được chọn từ state (nếu có)
        const selectedUnit = productUnitSelections[masanpham];
        
        // Gán đơn vị đã chọn và thông tin tồn kho vào product để sử dụng trong modal
        const enhancedProduct = {
          ...product,
          selectedUnit,
          // Ghi đè các thông tin liên quan đến tồn kho từ sản phẩm đã có
          soluong: existingProduct ? existingProduct.soluong : null,
          hasBeenReceived: existingProduct ? existingProduct.hasBeenReceived : false,
          manhaphang: existingProduct ? existingProduct.manhaphang : null,
          ngaynhap: existingProduct ? existingProduct.ngaynhap : null
        };
        
        setSelectedProduct(enhancedProduct);
        setProductDetailVisible(true);
      } else {
        message.error('Không tìm thấy thông tin sản phẩm');
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
      message.error('Không thể tải chi tiết sản phẩm');
    }
  };
  
  // Gọi API khi component mount
  useEffect(() => {
    // Fetch pharmacy data for the current user
    const fetchPharmacyData = async () => {
      try {
        if (user?.id) {
          setLoading(true);
          const pharmacyData = await getPharmacyByEmployeeId(user.id);
          
          if (pharmacyData && pharmacyData.length > 0) {
            const userPharmacy = pharmacyData[0];
            
            // Get detailed pharmacy information
            const detailedPharmacy = await findOne(userPharmacy.machinhanh);
            
            if (detailedPharmacy) {
              // Combine the data
              const combinedPharmacy = {
                ...userPharmacy,
                ...detailedPharmacy
              };
              setPharmacy(combinedPharmacy);
              
              // Fetch products after we have pharmacy data
              await fetchProducts();
              
            } else {
              setPharmacy(userPharmacy);
              
              // Fetch products after we have pharmacy data
              await fetchProducts();
            }
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
  
  // Hàm lấy ảnh chính của sản phẩm
  const getMainImage = (product: Product): string | undefined => {
    if (!product.anhsanpham || product.anhsanpham.length === 0) return undefined;
    
    // Ưu tiên ảnh có ismain = true
    const mainImage = product.anhsanpham.find(img => img.ismain === true);
    return mainImage ? mainImage.url : product.anhsanpham[0].url;
  };
  
  // Hàm lấy giá và đơn vị tính mặc định
  const getDefaultPriceAndUnit = (product: Product) => {
    if (!product.chitietdonvi || product.chitietdonvi.length === 0) {
      return { price: 0, priceAfterDiscount: 0, unit: '' };
    }
    
    // Lấy đơn vị đầu tiên làm mặc định
    const defaultUnit = product.chitietdonvi[0];
    
    // Ưu tiên giá sau khuyến mãi nếu có
    const price = defaultUnit.giaban;
    const priceAfterDiscount = defaultUnit.giabanSauKhuyenMai !== undefined 
      ? defaultUnit.giabanSauKhuyenMai 
      : price;
      
    console.log('Price info for', product.tensanpham, ':', {
      price,
      priceAfterDiscount, 
      hasDiscount: price !== priceAfterDiscount
    });
    
    return {
      price: price,
      priceAfterDiscount: priceAfterDiscount,
      unit: defaultUnit.donvitinh?.donvitinh || ''
    };
  };
  
  // Helper function to get unit info outside of renderProductCard
  const getUnitInfo = (product: Product, unitName: string) => {
    const unitDetail = product.chitietdonvi.find(detail => detail.donvitinh.donvitinh === unitName);
    if (!unitDetail) return { price: 0, priceAfterDiscount: 0 };
    
    const unitPrice = unitDetail.giaban;
    const unitPriceAfterDiscount = unitDetail.giabanSauKhuyenMai !== undefined ? 
      unitDetail.giabanSauKhuyenMai : unitPrice;
    
    return {
      price: unitPrice,
      priceAfterDiscount: unitPriceAfterDiscount
    };
  };
  
  // Cập nhật hàm renderProductCard
  const renderProductCard = (product: Product) => {
    const mainImage = getMainImage(product);
    const { price, priceAfterDiscount, unit } = getDefaultPriceAndUnit(product);
    const hasDiscount = price !== priceAfterDiscount;
    
    // Use the selectedUnit from our global state or default to the unit from product
    const selectedUnit = productUnitSelections[product.masanpham] || unit;
    
    // Lấy giá dựa trên đơn vị được chọn
    const selectedUnitInfo = getUnitInfo(product, selectedUnit);
    const displayPrice = selectedUnitInfo.price;
    const displayPriceAfterDiscount = selectedUnitInfo.priceAfterDiscount;
    const displayHasDiscount = displayPrice !== displayPriceAfterDiscount;
    
    return (
      <Card 
        hoverable
        className="h-full"
        bodyStyle={{ padding: '8px' }}
      >
        {/* Product image */}
        <div className="relative">
          <div className="h-28 flex items-center justify-center p-1 bg-gray-50">
            {product.khuyenmai && typeof (product.khuyenmai as any).giatrikhuyenmai === 'number' && (product.khuyenmai as any).giatrikhuyenmai > 0 && (
              <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-0.5 text-xs font-bold z-10">
                -{(product.khuyenmai as any).giatrikhuyenmai}%
              </div>
            )}
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.tensanpham}
                height={80}
                className="object-contain"
                preview={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100">
                <InboxOutlined style={{ fontSize: '1.5rem', color: '#d9d9d9' }} />
              </div>
            )}
          </div>
          
          {product.thuockedon && (
            <Tag color="orange" className="absolute top-1 left-1 text-xs py-0 px-1 m-0">Kê đơn</Tag>
          )}
        </div>
        
        {/* Product name and info */}
        <div className="px-1 py-1">
          <Tooltip title={product.tensanpham}>
            <div className="truncate text-sm font-medium mb-1">{product.tensanpham}</div>
          </Tooltip>
          
          <div className="text-xs text-gray-500 mb-1">{product.masanpham}</div>
          
          <div className="flex justify-between items-center mb-2">
            {product.hasBeenReceived ? (
              (() => {
                // Tìm đơn vị cơ bản (định lượng = 1)
                const baseUnitDetail = product.chitietdonvi.find(detail => detail.dinhluong === 1);
                // Tìm đơn vị được chọn
                const selectedUnitDetail = product.chitietdonvi.find(detail => detail.donvitinh.donvitinh === selectedUnit);
                
                if (!baseUnitDetail || !selectedUnitDetail) {
                  return (
                    <Badge 
                      count={product.soluong || 0} 
                      overflowCount={999}
                      size="small"
                      color={(product.soluong || 0) > 10 ? 'green' : (product.soluong || 0) > 5 ? 'gold' : 'red'}
                      showZero
                    />
                  );
                }
                
                // Số lượng hiện tại là đơn vị cơ bản, để hiển thị cho đơn vị khác, 
                // ta nhân với định lượng của đơn vị đó
                const displayQuantity = Math.floor((product.soluong || 0) * selectedUnitDetail.dinhluong);
                
                return (
                  <Badge 
                    count={displayQuantity} 
                    overflowCount={999}
                    size="small"
                    color={displayQuantity > 10 ? 'green' : displayQuantity > 5 ? 'gold' : 'red'}
                    showZero
                  />
                );
              })()
            ) : (
              <Tag color="blue" className="text-xs">Chưa nhập kho</Tag>
            )}
          </div>
          
          {/* Price and unit display */}
          <div className="mb-2">
            {displayHasDiscount ? (
              <>
                <Text delete type="secondary" className="block text-xs">
                  {displayPrice.toLocaleString('vi-VN')}đ / {selectedUnit || 'Không có'}
                </Text>
                <Text className="text-red-600 text-sm font-medium">
                  {displayPriceAfterDiscount.toLocaleString('vi-VN')}đ / {selectedUnit || 'Không có'}
                </Text>
              </>
            ) : (
              <Text className="text-red-600 text-sm font-medium">
                {displayPrice.toLocaleString('vi-VN')}đ / {selectedUnit || 'Không có'}
              </Text>
            )}
          </div>
          
          {/* Unit selection */}
          <Select
            size="small"
            value={selectedUnit}
            style={{ width: '100%', marginBottom: '8px' }}
            onChange={(value) => setProductUnitSelections(prev => ({
              ...prev,
              [product.masanpham]: value as string
            }))}
            options={
              product.chitietdonvi && product.chitietdonvi.length > 0 
                ? product.chitietdonvi.map(detail => ({
                    label: detail.donvitinh.donvitinh,
                    value: detail.donvitinh.donvitinh
                  }))
                : [{ label: 'Không có', value: '' }]
            }
          />
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              icon={<EyeOutlined />}
              onClick={() => viewProductDetails(product)}
              size="small"
              style={{ width: '50%' }}
            />
            <Button 
              type="primary" 
              icon={<ShoppingCartOutlined />} 
              onClick={() => addToCart(product, 1, selectedUnit)}
              size="small"
              className="bg-blue-600"
              style={{ width: '50%' }}
            />
          </div>
        </div>
      </Card>
    );
  };
  
  // Cart columns definition
  const cartColumns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: '50%',
      render: (record: any) => (
        <div className="flex items-start">
          {record.anhSanPham ? (
            <Image
              src={record.anhSanPham}
              alt={record.tensanpham}
              width={40}
              height={40}
              className="object-cover mr-2"
              preview={false}
            />
          ) : (
            <div className="w-[40px] h-[40px] bg-gray-100 flex items-center justify-center mr-2">
              <InboxOutlined style={{ color: '#d9d9d9' }} />
            </div>
          )}
          <div className="flex flex-col">
            <Tooltip title={record.tensanpham}>
              <div className="font-medium truncate max-w-[150px] text-sm">{record.tensanpham}</div>
            </Tooltip>
            <div className="text-gray-500 text-xs">{record.masanpham}</div>
            <div className="mt-1 flex items-center gap-1">
              <Text className="text-xs">{record.donvitinh}</Text>
              {record.thuocKedon && <Tag color="orange" style={{ fontSize: '10px', lineHeight: '16px', padding: '0 4px', margin: 0 }}>Kê đơn</Tag>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'dongia',
      key: 'dongia',
      width: '20%',
      render: (dongia: number, record: any) => {
        const hasDiscount = record.giaGoc && record.giaGoc > dongia;
        return hasDiscount ? (
          <div className="text-xs">
            <Text delete type="secondary" className="block">
              {record.giaGoc.toLocaleString('vi-VN')} đ
            </Text>
            <Text className="text-red-600">
              {dongia.toLocaleString('vi-VN')} đ
            </Text>
          </div>
        ) : (
          <div className="text-xs">{dongia.toLocaleString('vi-VN')} đ</div>
        );
      },
    },
    {
      title: 'SL',
      key: 'soluong',
      width: '20%',
      render: (record: any) => (
        <div className="flex items-center">
          <Button
            icon={<MinusOutlined />}
            onClick={() => updateCartItemQuantity(record.key, Math.max(1, record.soluong - 1))}
            size="small"
            style={{ padding: '0 4px', minWidth: '24px', height: '24px' }}
          />
          <InputNumber
            min={1}
            value={record.soluong}
            onChange={(value) => updateCartItemQuantity(record.key, Number(value))}
            style={{ width: 40, margin: '0 2px' }}
            size="small"
          />
          <Button
            icon={<PlusOutlined />}
            onClick={() => updateCartItemQuantity(record.key, record.soluong + 1)}
            size="small"
            style={{ padding: '0 4px', minWidth: '24px', height: '24px' }}
          />
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: '10%',
      render: (record: any) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.key)}
          size="small"
          type="text"
          style={{ padding: '0', minWidth: '24px' }}
        />
      ),
    },
  ];

  // Mock order history data
  const orderHistoryData = [
    {
      key: '1',
      madonhang: 'DH00123',
      ngayban: '12/06/2025',
      khachhang: 'Nguyễn Văn B',
      tongtien: 250000,
      trangthai: 'Hoàn thành'
    },
    {
      key: '2',
      madonhang: 'DH00122',
      ngayban: '11/06/2025',
      khachhang: 'Trần Thị C',
      tongtien: 420000,
      trangthai: 'Hoàn thành'
    },
    {
      key: '3',
      madonhang: 'DH00121',
      ngayban: '10/06/2025',
      khachhang: 'Lê Văn D',
      tongtien: 185000,
      trangthai: 'Hoàn thành'
    },
  ];

  return (
    <div>
      {/* Header Section with Pharmacy Info and Quick Actions */}
      <Card className="mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            {loading ? (
              <Spin size="small" className="mr-2" />
            ) : pharmacy ? (
              <>
                <Title level={4} className="m-0">{pharmacy.tennhathuoc || `Nhà thuốc Long Châu - ${pharmacy.machinhanh}`}</Title>
                <Text type="secondary">{pharmacy.diachi || `${pharmacy.diachicuthe}, ${pharmacy.tenduong}, ${pharmacy.phuong}, ${pharmacy.quan}, ${pharmacy.thanhpho}`}</Text>
              </>
            ) : (
              <Text>Không có thông tin chi nhánh</Text>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button 
              icon={<ScanOutlined />} 
              onClick={() => setBarcodeModalVisible(true)}
            >
              Quét mã vạch
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              type={prescriptionMode ? 'primary' : 'default'}
              onClick={() => {
                setPrescriptionMode(!prescriptionMode);
                if (!prescriptionMode) {
                  setCustomerInfoVisible(true);
                }
              }}
            >
              {prescriptionMode ? 'Đang bán theo đơn' : 'Bán theo đơn thuốc'}
            </Button>
            <Button 
              icon={<HistoryOutlined />}
              onClick={() => setOrderHistoryVisible(true)}
            >
              Lịch sử bán hàng
            </Button>
          </div>
        </div>
        
        {prescriptionMode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <MedicineBoxOutlined className="text-blue-500 mr-2" />
              <Text strong>Chế độ bán theo đơn thuốc</Text>
              <Button 
                type="link" 
                size="small" 
                className="ml-auto"
                onClick={() => setCustomerInfoVisible(true)}
              >
                {customerForm.getFieldValue('hoTen') ? 'Sửa thông tin khách hàng' : 'Thêm thông tin khách hàng'}
              </Button>
            </div>
            {customerForm.getFieldValue('hoTen') && (
              <div className="mt-2">
                <Text>Khách hàng: <strong>{customerForm.getFieldValue('hoTen')}</strong></Text>
                {customerForm.getFieldValue('soDienThoai') && (
                  <Text className="ml-4">SĐT: {customerForm.getFieldValue('soDienThoai')}</Text>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
        <TabPane 
          tab={
            <span>
              <ShoppingCartOutlined />
              Sản phẩm
            </span>
          } 
          key="products"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Product listing section */}
            <div className="md:col-span-3">
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
                  
                  <div className="flex gap-2">
                    <Select
                      placeholder="Lọc theo danh mục"
                      style={{ width: 200 }}
                      size="large"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      options={mockCategories}
                    />
                    <Button 
                      icon={<FilterOutlined />} 
                      size="large"
                      onClick={() => setFilterDrawerVisible(true)}
                    >
                      Lọc
                    </Button>
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

            {/* Cart section */}
            <div className="md:col-span-2">
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
                        rowKey="key"
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
          </div>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <HeartOutlined />
              Sản phẩm bán chạy
            </span>
          } 
          key="popular"
        >
          <Card>
            <Row gutter={[16, 16]}>
              {products.slice(0, 3).map(product => (
                <Col xs={24} sm={12} md={8} key={product.masanpham}>
                  <Card className="h-full">
                    <div className="flex">
                      <div className="mr-4">
                        <Image
                          src={getMainImage(product)}
                          alt={product.tensanpham}
                          width={80}
                          height={80}
                          className="object-contain"
                          preview={false}
                        />
                      </div>
                      <div>
                        <Text strong className="block mb-1">{product.tensanpham}</Text>
                        <Text type="secondary" className="block mb-1">{product.masanpham}</Text>
                        <Text className="text-red-600 block mb-2">
                          {getDefaultPriceAndUnit(product).priceAfterDiscount.toLocaleString('vi-VN')} đ/
                          {getDefaultPriceAndUnit(product).unit}
                        </Text>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<ShoppingCartOutlined />}
                          onClick={() => addToCart(product)}
                        >
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

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
                // Sử dụng đơn vị đã được chọn khi thêm vào giỏ hàng
                addToCart(selectedProduct, 1, selectedProduct.selectedUnit);
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
                <div className="flex justify-center mb-4 relative">
                  {selectedProduct.khuyenmai && selectedProduct.khuyenmai.giatrikhuyenmai > 0 && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-bold z-10">
                      -{selectedProduct.khuyenmai.giatrikhuyenmai}%
                    </div>
                  )}
                  {selectedProduct.anhsanpham && selectedProduct.anhsanpham.length > 0 ? (
                    <Image
                      src={getMainImage(selectedProduct)}
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
                
                <Divider />
                
                <div>
                  {selectedProduct.chitietdonvi && selectedProduct.chitietdonvi.length > 0 && (
                    <>
                      <Text strong>Giá bán theo đơn vị tính:</Text>
                      {selectedProduct.chitietdonvi.map((unit: any, index: number) => {
                        // Kiểm tra xem có giảm giá không
                        const hasDiscount = unit.giabanSauKhuyenMai !== undefined && 
                          unit.giabanSauKhuyenMai !== null && 
                          unit.giabanSauKhuyenMai !== unit.giaban;
                          
                        const discountPercent = hasDiscount 
                          ? Math.round((1 - (unit.giabanSauKhuyenMai / unit.giaban)) * 100) 
                          : 0;
                          
                        const finalPrice = hasDiscount ? unit.giabanSauKhuyenMai : unit.giaban;
                        
                        // Xác định đơn vị hiện tại có phải là đơn vị đang được chọn không
                        const isCurrentUnit = unit.donvitinh?.donvitinh === (selectedProduct.selectedUnit || selectedProduct.chitietdonvi?.[0]?.donvitinh?.donvitinh);
                        
                        return (
                          <div 
                            key={index} 
                            className={`my-2 py-1 px-2 rounded ${isCurrentUnit ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                            onClick={() => {
                              // Cập nhật đơn vị tính được chọn khi người dùng click vào
                              const newUnit = unit.donvitinh?.donvitinh;
                              setProductUnitSelections(prev => ({
                                ...prev,
                                [selectedProduct.masanpham]: newUnit
                              }));
                              setSelectedProduct({
                                ...selectedProduct,
                                selectedUnit: newUnit
                              });
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="text-sm mb-1 flex justify-between items-center">
                              <div>
                                <span className="font-medium">{unit.donvitinh?.donvitinh}</span>
                                {unit.dinhluong > 1 && 
                                  <span className="text-gray-500 ml-1">({unit.dinhluong} đơn vị)</span>
                                }
                              </div>
                              {hasDiscount && (
                                <Tag color="red" className="ml-2 text-xs">
                                  -{discountPercent}%
                                </Tag>
                              )}
                            </div>
                            <div className="text-red-600 text-lg font-bold flex items-center">
                              {hasDiscount && (
                                <Text delete type="secondary" className="mr-2">
                                  {unit.giaban.toLocaleString('vi-VN')} đ
                                </Text>
                              )}
                              <span>{finalPrice.toLocaleString('vi-VN')} đ</span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  
                  <div className="mt-4">
                    <Text strong>Mã sản phẩm:</Text> {selectedProduct.masanpham}
                  </div>
                  
                  <div className="mt-2">
                    <Text strong>Danh mục:</Text> {selectedProduct.danhmuc?.tendanhmuc}
                  </div>
                  
                  <div className="mt-2">
                    <Text strong>Thương hiệu:</Text> {selectedProduct.thuonghieu?.tenthuonghieu}
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong>Đơn vị tính:</Text>
                      <Select
                        size="small"
                        value={selectedProduct.selectedUnit || selectedProduct.chitietdonvi?.[0]?.donvitinh?.donvitinh || ''}
                        style={{ width: '120px' }}
                        onChange={(value) => {
                          // Cập nhật đơn vị tính được chọn trong state toàn cục
                          setProductUnitSelections(prev => ({
                            ...prev,
                            [selectedProduct.masanpham]: value as string
                          }));
                          // Cập nhật đơn vị tính trong selectedProduct
                          setSelectedProduct({
                            ...selectedProduct,
                            selectedUnit: value as string
                          });
                        }}
                        options={
                          selectedProduct.chitietdonvi && selectedProduct.chitietdonvi.length > 0 
                            ? selectedProduct.chitietdonvi.map((detail: any) => ({
                                label: detail.donvitinh.donvitinh,
                                value: detail.donvitinh.donvitinh
                              }))
                            : [{ label: 'Không có', value: '' }]
                        }
                      />
                    </div>
                    
                    <div className="mt-2">
                      <Text strong>Tồn kho:</Text>{' '}
                      {selectedProduct.hasBeenReceived ? (
                        (() => {
                          // Lấy đơn vị hiện tại được chọn
                          const currentUnitName = selectedProduct.selectedUnit || selectedProduct.chitietdonvi?.[0]?.donvitinh?.donvitinh || '';
                          
                          // Tìm đơn vị cơ bản (định lượng = 1)
                          const baseUnitDetail = selectedProduct.chitietdonvi?.find(
                            (detail: any) => detail.dinhluong === 1
                          );
                          
                          // Tìm thông tin chi tiết của đơn vị được chọn
                          const selectedUnitDetail: {
                            donvitinh: { donvitinh: string };
                            giaban: number;
                            giabanSauKhuyenMai?: number;
                            dinhluong: number;
                          } | undefined = selectedProduct.chitietdonvi?.find(
                            (detail: any) => detail.donvitinh?.donvitinh === currentUnitName
                          );
                          
                          if (!baseUnitDetail || !selectedUnitDetail) {
                            return (
                              <span className="font-medium text-red-600">
                                {selectedProduct.soluong || 0} {currentUnitName}
                              </span>
                            );
                          }
                          
                          // Tính toán số lượng tồn kho dựa trên định lượng của đơn vị
                          // Công thức: soluong (số lượng đơn vị cơ bản) * dinhluong của đơn vị hiện tại
                          const displayQuantity = Math.floor((selectedProduct.soluong || 0) * selectedUnitDetail.dinhluong);
                          
                          // Tạo class color dựa trên số lượng sau khi đã tính theo đơn vị
                          const colorClass = displayQuantity > 10 
                            ? 'text-green-600' 
                            : displayQuantity > 5 
                              ? 'text-orange-500' 
                              : 'text-red-600';
                              
                          return (
                            <span className={`font-medium ${colorClass}`}>
                              {displayQuantity} {currentUnitName}
                            </span>
                          );
                        })()
                      ) : (
                        <Tag color="blue" className="text-xs">Chưa nhập kho</Tag>
                      )}
                    </div>
                  </div>
                  
                  {selectedProduct.ngaynhap && (
                    <div className="mt-2">
                      <Text strong>Ngày nhập:</Text> {new Date(selectedProduct.ngaynhap).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                  
                  {selectedProduct.manhaphang && (
                    <div className="mt-2">
                      <Text strong>Mã nhập hàng:</Text> {selectedProduct.manhaphang}
                    </div>
                  )}
                  
                  {selectedProduct.thuockedon && (
                    <Tag color="orange" className="mt-2">Thuốc kê đơn</Tag>
                  )}
                </div>
              </Col>
              
              <Col span={14}>
                <Title level={4}>{selectedProduct.tensanpham}</Title>
                
                <Divider />
                
                {selectedProduct.motangan && (
                  <div className="mb-4">
                    <Text strong>Mô tả:</Text>
                    <div className="mt-1 text-gray-700">{selectedProduct.motangan}</div>
                  </div>
                )}
                
                {selectedProduct.congdung && (
                  <div className="mb-4">
                    <Text strong>Công dụng:</Text>
                    <div className="mt-1 text-gray-700">{selectedProduct.congdung}</div>
                  </div>
                )}
                
                {selectedProduct.chidinh && (
                  <div className="mb-4">
                    <Text strong>Chỉ định:</Text>
                    <div className="mt-1 text-gray-700">{selectedProduct.chidinh}</div>
                  </div>
                )}
                
                {selectedProduct.luuy && (
                  <div className="bg-blue-50 p-3 border border-blue-200 rounded-md mt-4">
                    <div className="flex items-center mb-2">
                      <InfoCircleOutlined className="text-blue-500 mr-2" />
                      <Text strong>Lưu ý:</Text>
                    </div>
                    <Paragraph>{selectedProduct.luuy}</Paragraph>
                  </div>
                )}
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

          {prescriptionMode && customerForm.getFieldValue('hoTen') && (
            <div className="flex items-center mt-2">
              <UserOutlined className="mr-2" />
              <Text strong>Khách hàng: </Text>
              <Text className="ml-2">{customerForm.getFieldValue('hoTen')}</Text>
              {customerForm.getFieldValue('soDienThoai') && (
                <Text className="ml-4">SĐT: {customerForm.getFieldValue('soDienThoai')}</Text>
              )}
            </div>
          )}
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
                  parser={value => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as 0}
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
                  parser={value => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as 0}
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
                  parser={value => Number(value?.replace(/\$\s?|(,*)/g, '') || 0) as 0}
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
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
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

      {/* Filter drawer */}
      <Drawer
        title="Lọc sản phẩm"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={320}
      >
        <div className="mb-6">
          <Text strong className="block mb-2">Danh mục</Text>
          <Radio.Group className="flex flex-col gap-2" value={selectedCategory}>
            {mockCategories.map((category) => (
              <Radio value={category.value} key={category.value} onChange={() => {
                handleCategoryChange(category.value);
                setFilterDrawerVisible(false);
              }}>
                {category.label}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        
        <Divider />
        
        <div className="mb-6">
          <Text strong className="block mb-2">Giá bán</Text>
          <div className="flex items-center">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Từ"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
            <div className="mx-2">-</div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Đến"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </div>
        </div>
        
        <Divider />
        
        <div className="mb-6">
          <Text strong className="block mb-2">Loại thuốc</Text>
          <div className="flex flex-col gap-2">
            <Checkbox>Thuốc kê đơn</Checkbox>
            <Checkbox>Thuốc không kê đơn</Checkbox>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={() => setFilterDrawerVisible(false)}>Hủy</Button>
          <Button type="primary" onClick={() => setFilterDrawerVisible(false)}>Áp dụng</Button>
        </div>
      </Drawer>

      {/* Customer info modal */}
      <Modal
        title="Thông tin khách hàng"
        open={customerInfoVisible}
        onCancel={() => setCustomerInfoVisible(false)}
        footer={null}
      >
        <Form
          form={customerForm}
          layout="vertical"
          onFinish={(values) => {
            setCustomerInfoVisible(false);
            message.success('Đã lưu thông tin khách hàng!');
          }}
        >
          <Form.Item
            name="hoTen"
            label="Họ tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên khách hàng!' }]}
          >
            <Input placeholder="Nhập họ tên khách hàng" />
          </Form.Item>
          
          <Form.Item
            name="soDienThoai"
            label="Số điện thoại"
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          
          <Form.Item
            name="diaChi"
            label="Địa chỉ"
          >
            <Input.TextArea placeholder="Nhập địa chỉ" rows={2} />
          </Form.Item>
          
          <Form.Item
            name="ghiChu"
            label="Ghi chú"
          >
            <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
          </Form.Item>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCustomerInfoVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu thông tin</Button>
          </div>
        </Form>
      </Modal>

      {/* Order history modal */}
      <Modal
        title="Lịch sử bán hàng"
        open={orderHistoryVisible}
        onCancel={() => setOrderHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <div className="mb-4 flex justify-between">
          <div className="flex gap-2">
            <Select 
              defaultValue="today" 
              style={{ width: 150 }}
              options={[
                { value: 'today', label: 'Hôm nay' },
                { value: 'yesterday', label: 'Hôm qua' },
                { value: 'week', label: 'Tuần này' },
                { value: 'month', label: 'Tháng này' },
              ]}
            />
            <Button icon={<SearchOutlined />}>Tìm kiếm</Button>
          </div>
          <Button icon={<PrinterOutlined />}>Xuất báo cáo</Button>
        </div>
        
        <Table
          dataSource={orderHistoryData}
          columns={[
            {
              title: 'Mã đơn hàng',
              dataIndex: 'madonhang',
              key: 'madonhang',
            },
            {
              title: 'Ngày bán',
              dataIndex: 'ngayban',
              key: 'ngayban',
            },
            {
              title: 'Khách hàng',
              dataIndex: 'khachhang',
              key: 'khachhang',
            },
            {
              title: 'Tổng tiền',
              dataIndex: 'tongtien',
              key: 'tongtien',
              render: (tongtien) => `${tongtien.toLocaleString('vi-VN')} đ`,
            },
            {
              title: 'Trạng thái',
              dataIndex: 'trangthai',
              key: 'trangthai',
              render: (trangthai) => (
                <Tag color="green">{trangthai}</Tag>
              ),
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<InfoCircleOutlined />}>Chi tiết</Button>
                  <Button size="small" icon={<PrinterOutlined />}>In</Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      {/* Barcode scanner modal */}
      <Modal
        title="Quét mã vạch"
        open={barcodeModalVisible}
        onCancel={() => setBarcodeModalVisible(false)}
        footer={null}
      >
        <div className="flex flex-col items-center">
          <div className="border-2 border-dashed border-gray-300 p-4 w-full mb-4 bg-gray-50 rounded-md">
            <div className="h-40 flex items-center justify-center">
              <ScanOutlined style={{ fontSize: '5rem', color: '#d9d9d9' }} />
            </div>
          </div>
          <Text className="mb-4">Đặt mã vạch vào vùng quét</Text>
          <div className="w-full">
            <Input 
              placeholder="Hoặc nhập mã sản phẩm" 
              size="large" 
              suffix={<SearchOutlined />} 
            />
          </div>
          <Button 
            type="primary" 
            className="mt-4" 
            onClick={() => {
              message.info('Chức năng quét mã vạch đang phát triển!');
              setBarcodeModalVisible(false);
            }}
          >
            Tìm kiếm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffSalesComponent;

function handleUnitChange(masanpham: any, value: any): void {
  throw new Error('Function not implemented.');
}
