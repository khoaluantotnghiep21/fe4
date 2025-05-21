'use client';

import React from 'react';
import { Spin, Card, Button, Divider, Space, Badge, Avatar } from 'antd';
import { useLoading } from '@/context/LoadingContext';
import { ShoppingCartOutlined } from '@ant-design/icons';
import axiosClient from '@/lib/axiosClient';

// Example for component with built-in loading state
const ComponentWithLoading = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<string[]>([]);

  const handleLoadData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setData(['Item 1', 'Item 2', 'Item 3']);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card title="Component với loading bên trong">
      <Spin spinning={loading}>
        <div style={{ minHeight: '100px' }}>
          {data.length > 0 ? (
            <ul>
              {data.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Chưa có dữ liệu</p>
          )}
        </div>
      </Spin>
      <Button type="primary" onClick={handleLoadData}>
        Tải dữ liệu (1.5s)
      </Button>
    </Card>
  );
};

// Example for API call with loading
const ApiCallExample = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any>(null);

  const handleApiCall = async () => {
    setLoading(true);
    try {
      // Call API with loading state
      const response = await axiosClient.get('/product/getAllProducts');
      setData(response.data);
    } catch (error) {
      console.error('API call failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="API call với loading">
      <Spin spinning={loading}>
        <div style={{ minHeight: '100px' }}>
          {data ? (
            <pre>{JSON.stringify(data, null, 2).substring(0, 100) + '...'}</pre>
          ) : (
            <p>Chưa có dữ liệu từ API</p>
          )}
        </div>
      </Spin>
      <Button type="primary" onClick={handleApiCall}>
        Gọi API
      </Button>
    </Card>
  );
};

// Example for global loading
const GlobalLoadingExample = () => {
  const { showLoading, hideLoading } = useLoading();

  const handleShowGlobalLoading = () => {
    showLoading();
    setTimeout(() => {
      hideLoading();
    }, 2000);
  };

  return (
    <Card title="Global loading (toàn màn hình)">
      <p>Khi nhấn nút, loading sẽ hiển thị toàn màn hình trong 2 giây</p>
      <Button type="primary" onClick={handleShowGlobalLoading}>
        Hiển thị global loading
      </Button>
    </Card>
  );
};

// Example for cart interaction with loading
const CartExample = () => {
  const [loading, setLoading] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<string[]>([]);
  const [cartCount, setCartCount] = React.useState(0);

  const handleAddToCart = () => {
    setLoading(true);
    
    // Simulate cart API call
    setTimeout(() => {
      const newItem = `Sản phẩm ${cartItems.length + 1}`;
      setCartItems([...cartItems, newItem]);
      setCartCount(cartCount + 1);
      setLoading(false);
    }, 1000);
  };

  const handleViewCart = () => {
    const { showLoading, hideLoading } = useLoading();
    
    showLoading();
    
    // Simulate loading cart contents
    setTimeout(() => {
      hideLoading();
      alert(`Giỏ hàng có ${cartCount} sản phẩm: ${cartItems.join(', ')}`);
    }, 1500);
  };

  return (
    <Card title="Giỏ hàng với loading">
      <div className="flex justify-between items-center mb-4">
        <h3>Giỏ hàng của bạn</h3>
        <Badge count={cartCount}>
          <Button 
            type="primary" 
            shape="circle" 
            icon={<ShoppingCartOutlined />} 
            onClick={handleViewCart}
          />
        </Badge>
      </div>

      <Spin spinning={loading}>
        <div style={{ minHeight: '100px' }}>
          {cartItems.length > 0 ? (
            <ul>
              {cartItems.map((item, index) => (
                <li key={index} className="py-1">{item}</li>
              ))}
            </ul>
          ) : (
            <p>Giỏ hàng trống</p>
          )}
        </div>
      </Spin>

      <Button type="primary" onClick={handleAddToCart}>
        Thêm vào giỏ hàng
      </Button>
    </Card>
  );
};

export default function LoadingDemoPage() {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-5">Demo Loading với Ant Design Spin</h1>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <CartExample />
        
        <Divider />
        
        <ComponentWithLoading />
        
        <Divider />
        
        <ApiCallExample />
        
        <Divider />
        
        <GlobalLoadingExample />
      </Space>
    </div>
  );
} 