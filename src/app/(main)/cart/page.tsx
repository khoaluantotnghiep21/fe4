'use client';
import { useCartStore } from '@/store/cartStore';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { Button, InputNumber, Spin, Alert, Radio, Input, Select, Table, Card, Checkbox } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { useRouter } from 'next/navigation';
import { createPurchaseOrder, CreatePurchaseOrderRequest } from '@/lib/api/orderApi';

const { Option } = Select;

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, loadUserCart, isLoading: cartLoading } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
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

  // Tính toán các giá trị
  const selectedCartItems = items.filter(item =>
    selectedItems.includes(`${item.id}-${item.option}`)
  );

  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const directDiscount = subtotal * 0.2; // Giảm giá trực tiếp 20%
  const voucherDiscount = 0; // Tạm thời để 0
  const totalSavings = directDiscount + voucherDiscount;
  const finalTotal = subtotal - totalSavings;

  const handleRemoveItem = async (id: string, option: string) => {
    showLoading();
    await removeItem(id, option);
    // Remove from selected items if it was selected
    setSelectedItems(prev => prev.filter(key => key !== `${id}-${option}`));
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
    setSelectedItems([]);
    hideLoading();
  };

  const handleSelectItem = (itemKey: string, checked: boolean) => {
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, itemKey];
      } else {
        return prev.filter(key => key !== itemKey);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => `${item.id}-${item.option}`));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCheckout = async () => {
    if (!user || selectedCartItems.length === 0) {
      return;
    }

    showLoading();

    try {
      const orderData: CreatePurchaseOrderRequest = {
        phuongthucthanhtoan: 'COD',
        hinhthucnhanhang: 'delivery',
        mavoucher: 'VC00000',
        tongtien: subtotal,
        giamgiatructiep: directDiscount,
        thanhtien: finalTotal,
        phivanchuyen: 0,
        machinhhanh: 'default',
        details: selectedCartItems.map(item => ({
          masanpham: item.id,
          soluong: item.quantity,
          giaban: item.price,
          donvitinh: item.option || 'cái'
        }))
      };

      const result = await createPurchaseOrder(orderData);

      if (result) {
        // Remove only selected items from cart
        for (const item of selectedCartItems) {
          await removeItem(item.id, item.option);
        }
        setSelectedItems([]);

        router.push(`/order-confirmation?orderId=${result.data.id}&orderCode=${result.data.madonhang}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      hideLoading();
    }
  };

  const columns: any[] = [
    {
      title: (
        <Checkbox
          checked={selectedItems.length === items.length && items.length > 0}
          indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Chọn tất cả
        </Checkbox>
      ),
      dataIndex: 'select',
      key: 'select',
      width: 120,
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedItems.includes(`${record.id}-${record.option}`)}
          onChange={(e) => handleSelectItem(`${record.id}-${record.option}`, e.target.checked)}
        />
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.image}
            alt={record.name}
            width={60}
            height={60}
            className="object-contain rounded-lg"
          />
          <div>
            <Link href={`/products/${record.slug}`}>
              <h3 className="font-medium text-gray-900 hover:text-blue-500">{record.name}</h3>
            </Link>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá thành',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      render: (price: number) => (
        <Input
          value={`${price.toLocaleString('vi-VN')}đ`}
          disabled
          style={{
            borderRadius: '8px',
            backgroundColor: '#f5f5f5',
            color: '#d32f2f',
            fontWeight: 'bold'
          }}
        />
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity: number, record: any) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) =>
            handleUpdateQuantity(record.id, record.option, value as number)
          }
          style={{ borderRadius: '8px' }}
        />
      ),
    },
    {
      title: 'Đơn vị tính',
      dataIndex: 'option',
      key: 'option',
      width: 120,
      render: (option: string, record: any) => (
        <Select
          disabled={true}
          value={option}
          style={{ width: '100%', borderRadius: '8px' }}
          onChange={(value) => {
          }}
        >
          <Option value="cái">Cái</Option>
          <Option value="kg">Kg</Option>
          <Option value="thùng">Thùng</Option>
          <Option value="gói">Gói</Option>
        </Select>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          type="text"
          onClick={() => handleRemoveItem(record.id, record.option)}
          style={{ borderRadius: '8px' }}
        />
      ),
    },
  ];

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Giỏ hàng</h1>
          <Button onClick={handleClearCart} danger>
            Xóa toàn bộ giỏ hàng
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Bảng sản phẩm - 70% */}
          <div className="flex-1" style={{ width: '70%' }}>
            <Card>
              <Table
                columns={columns}
                dataSource={items.map(item => ({
                  ...item,
                  key: `${item.id}-${item.option}`
                }))}
                pagination={false}
                className="cart-table"
              />
            </Card>
          </div>

          {/* Thông tin thanh toán - 30% */}
          <div style={{ width: '30%' }}>
            <Card title="Thông tin đơn hàng" className="sticky top-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Tổng tiền</span>
                  <span className="font-bold text-lg">
                    {subtotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex justify-between items-center text-green-600">
                  <span>Giảm giá trực tiếp</span>
                  <span className="font-bold">
                    -{directDiscount.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Giảm giá voucher</span>
                  <span className="font-bold">
                    {voucherDiscount.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                  <span>Tiết kiệm được</span>
                  <span className="font-bold text-green-600">
                    {totalSavings.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Thành tiền</span>
                    <div className="text-right">
                      <div className="text-gray-400 line-through text-sm">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-xl font-bold text-red-500">
                        {finalTotal.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="mt-6"
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    borderRadius: '8px'
                  }}
                >
                  Mua hàng ({selectedItems.length})
                </Button>

                <div className="text-xs text-gray-500 text-center mt-2">
                  * Chỉ thanh toán các sản phẩm đã chọn
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Spin>
  );
}