'use client';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import { Button, InputNumber } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            <div className="flex items-center space-x-4">
              <InputNumber
                min={1}
                value={item.quantity}
                onChange={(value) =>
                  updateQuantity(item.id, item.option, value as number)
                }
              />
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => removeItem(item.id, item.option)}
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
          <Button onClick={clearCart}>Xóa giỏ hàng</Button>
          <Button type="primary" size="large">
            Thanh toán
          </Button>
        </div>
      </div>
    </div>
  );
}