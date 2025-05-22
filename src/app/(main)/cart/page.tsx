'use client';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import { Button, InputNumber, Spin } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const { showLoading, hideLoading } = useLoading();

  // Simulate loading when component mounts
  useEffect(() => {
    // Show loading when cart page loads
    setLoading(true);

    // Hide loading after a short delay (simulating data fetching)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemoveItem = (id: string, option: string) => {
    showLoading();
    // Simulate API call to remove item
    setTimeout(() => {
      removeItem(id, option);
      hideLoading();
    }, 500);
  };

  const handleUpdateQuantity = (id: string, option: string, value: number) => {
    setLoading(true);
    // Simulate API call to update quantity
    setTimeout(() => {
      updateQuantity(id, option, value);
      setLoading(false);
    }, 300);
  };

  const handleClearCart = () => {
    showLoading();
    // Simulate API call to clear cart
    setTimeout(() => {
      clearCart();
      hideLoading();
    }, 500);
  };

  const handleCheckout = () => {
    showLoading();
    // Simulate API call for checkout
    setTimeout(() => {
      hideLoading();
      alert('Đã chuyển tới trang thanh toán');
    }, 1000);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>
        <p className="text-gray-600 mb-4">Giỏ hàng của bạn đang trống.</p>
        <Link href="/products">
          <Button type="primary" size="large">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>
        <div className="grid grid-cols-1 gap-6">
          {items.map((item) => (

            <div
              key={`${item.id}-${item.option}`}
              className="flex items-center bg-white rounded-xl shadow-lg p-4"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                className="object-contain mr-4"
              />
              <div className="flex-grow">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-gray-600">Loại: {item.option}</p>
                {(() => { console.log('Option value:', item.option); return null; })()}
                <p className="text-red-500 font-bold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(value) =>
                    handleUpdateQuantity(item.id, item.option, value as number)
                  }
                />
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleRemoveItem(item.id, item.option)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-between items-center">
          <div>
            <p className="text-xl font-bold">
              Tổng cộng: {total.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
          <div className="space-x-4">
            <Button onClick={handleClearCart}>Xóa giỏ hàng</Button>
            <Button type="primary" size="large" onClick={handleCheckout}>
              Thanh toán
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  );
}