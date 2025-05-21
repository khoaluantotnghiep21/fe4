'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product.types';
import Image from 'next/image';
import { Button, Tabs, message } from 'antd';
import { useCartStore } from '@/store/cartStore';
import ClientErrorDisplay from '@/components/common/ClientErrorDisplay';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedUnit, setSelectedUnit] = useState<Product['chitietdonvi'][0] | null>(
    product.chitietdonvi[0] || null
  );
  const addItem = useCartStore((state) => state.addItem);

  // Format unit display string with x separator
  const formatUnitString = (unit: Product['chitietdonvi'][0] | null) => {
    if (!unit || !unit.donvitinh?.donvitinh) return 'Không xác định';
    return unit.dinhluong === 1
      ? unit.donvitinh.donvitinh
      : `${unit.dinhluong} x ${unit.donvitinh.donvitinh}`;
  };

  const handleUnitChange = (unit: Product['chitietdonvi'][0]) => {
    setSelectedUnit(unit);
  };

  const handleAddToCart = () => {
    if (!product || !selectedUnit) {
      message.error('Vui lòng chọn đơn vị tính!');
      return;
    }

    addItem({
      id: product.id,
      name: product.tensanpham,
      option: formatUnitString(selectedUnit),
      price: selectedUnit.giaban,
      image: product.anhsanpham[0]?.url || '/placeholder.png',
      quantity: 1,
    });
    message.success(`${product.tensanpham} (${formatUnitString(selectedUnit)}) đã được thêm vào giỏ hàng!`);
  };

  // Memoize tab items to prevent unnecessary re-renders
  const items = [
    {
      key: '1',
      label: 'Thông tin sản phẩm',
      children: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Mã sản phẩm:</h3>
            <p>{product.masanpham || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Danh mục:</h3>
            <p>{product.danhmuc?.tendanhmuc || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Thương hiệu:</h3>
            <p>{product.thuonghieu?.tenthuonghieu || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Dạng bảo quản:</h3>
            <p>{product.dangbaoche || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Công dụng:</h3>
            <p>{product.congdung || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Chỉ định:</h3>
            <p>{product.chidinh || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Chống chỉ định:</h3>
            <p>{product.chongchidinh || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Đối tượng sử dụng:</h3>
            <p>{product.doituongsudung || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Lưu ý:</h3>
            <p>{product.luuy || 'Không có'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Ngày sản xuất:</h3>
            <p>
              {product.ngaysanxuat
                ? new Date(product.ngaysanxuat).toLocaleDateString('vi-VN')
                : 'Không có'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Hạn sử dụng:</h3>
            <p>{product.hansudung ? `${product.hansudung} ngày` : 'Không có'}</p>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Thành phần',
      children: (
        <div className="space-y-4">
          {product.chitietthanhphan.length > 0 ? (
            product.chitietthanhphan.map((tp, index) => (
              <div key={`${tp.thanhphan.tenthanhphan}-${index}`}>
                <h3 className="font-semibold">{tp.thanhphan.tenthanhphan}:</h3>
                <p>{tp.hamluong || 'Không có'}</p>
              </div>
            ))
          ) : (
            <p>Không có thông tin thành phần</p>
          )}
        </div>
      ),
    },
  ];

  // Debugging: Log data sizes
  useEffect(() => {
    console.log('Product data:', {
      images: product.anhsanpham.length,
      components: product.chitietthanhphan.length,
      units: product.chitietdonvi.length,
    });
  }, [product]);

  return (
    <div className="container mx-auto py-8">
      {product ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative w-full aspect-square">
              <Image
                src={product.anhsanpham[0]?.url || '/placeholder.png'}
                alt={product.tensanpham}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority // Optimize main image loading
                quality={75} // Reduce image quality for faster loading
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.anhsanpham.slice(1).map((image, index) => (
                <div key={`${image.url}-${index}`} className="relative w-full aspect-square">
                  <Image
                    src={image.url}
                    alt={`${product.tensanpham} - ${index + 2}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                    loading="lazy" // Lazy-load thumbnails
                    quality={50} // Lower quality for thumbnails
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.tensanpham}</h1>
              <p className="text-gray-600">{product.motangan || 'Không có mô tả'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Chọn đơn vị:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.chitietdonvi.length > 0 ? (
                    product.chitietdonvi.map((unit) => (
                      <button
                        key={`${unit.dinhluong}-${unit.donvitinh.donvitinh}`}
                        onClick={() => handleUnitChange(unit)}
                        className={`px-4 py-2 border rounded-md text-sm ${
                          selectedUnit?.dinhluong === unit.dinhluong &&
                          selectedUnit?.donvitinh.donvitinh === unit.donvitinh.donvitinh
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300'
                        } hover:bg-blue-100 transition`}
                      >
                        {formatUnitString(unit)}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Không có đơn vị tính</p>
                  )}
                </div>
              </div>

              <div className="text-2xl font-bold text-red-500">
                {selectedUnit?.giaban
                  ? `${selectedUnit.giaban.toLocaleString('vi-VN')} VNĐ`
                  : 'Liên hệ'}
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleAddToCart}
                className="w-full"
                disabled={!selectedUnit}
              >
                Thêm vào giỏ hàng
              </Button>
            </div>

            <Tabs items={items} defaultActiveKey="1" />
          </div>
        </div>
      ) : (
        <ClientErrorDisplay
          title="Không tìm thấy sản phẩm"
          message="Sản phẩm không tồn tại hoặc đã bị xóa."
        />
      )}
    </div>
  );
}