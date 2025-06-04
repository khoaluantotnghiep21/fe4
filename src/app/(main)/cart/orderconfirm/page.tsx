'use client';
import { useCartStore } from '@/store/cartStore';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { Button, InputNumber, Spin, Alert } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { useRouter } from 'next/navigation';
import { createPurchaseOrder, CreatePurchaseOrderRequest } from '@/lib/api/orderApi';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, loadUserCart, isLoading: cartLoading } = useCartStore();
  const [loading, setLoading] = useState(true);
  const { showLoading, hideLoading } = useLoading();
  const { user, isUserLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    const initCart = async () => {
      if (isUserLoaded) {
        if (!user) {
          setLoading(false);
          return;
        }
        await loadUserCart();
        setLoading(false);
      }
    };

    initCart();
  }, [isUserLoaded, user, loadUserCart]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemoveItem = async (id: string, option: string) => {
    showLoading();
    await removeItem(id, option);
    hideLoading();
  };

  const handleUpdateQuantity = async (id: string, option: string, value: number) => {
    setLoading(true);
    await updateQuantity(id, option, value);
    setLoading(false);
  };

  const handleClearCart = async () => {
    showLoading();
    await clearCart();
    hideLoading();
  };

  const handleCheckout = async () => {
    router.push('/cart/checkout');
  };

  if (!isUserLoaded || loading || cartLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert
          message="Đăng nhập để xem giỏ hàng"
          description={
            <div className="mt-4">
              <p>Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn.</p>
              <Button type="primary" onClick={() => router.push('/login')} className="mt-4">
                Đăng nhập ngay
              </Button>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    );
  }

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
                <p className="text-red-500 font-bold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="flex items-center gap-4">
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
            <Button 
              type="primary" 
              size="large" 
              onClick={handleCheckout}
              disabled={items.length === 0}
            >
              Mua hàng
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  );
}