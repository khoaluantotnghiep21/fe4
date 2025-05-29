'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product.types';
import Image from 'next/image';
import { Button, Tabs, message } from 'antd';
import { useCartStore } from '@/store/cartStore';
import ClientErrorDisplay from '@/components/common/ClientErrorDisplay';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const initialUnit = useMemo(() => product.chitietdonvi[0] || null, [product.chitietdonvi]);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const addItem = useCartStore((state) => state.addItem);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const { user } = useUser();
  const router = useRouter();

  const sortedImages = useMemo(() => {
    return [...product.anhsanpham].sort((a, b) => {
      if (a.ismain && !b.ismain) return -1;
      if (!a.ismain && b.ismain) return 1;
      return 0;
    });
  }, [product.anhsanpham]);
  useEffect(() => {
    if (sortedImages.length > 0) {
      setSelectedImage(sortedImages[0].url);
    }
  }, [sortedImages]);

  const formatUnitString = useMemo(() => {
    return (unit: Product['chitietdonvi'][0] | null) => {
      if (!unit || !unit.donvitinh?.donvitinh) return 'Không xác định';
      return unit.donvitinh.donvitinh;
    };
  }, []);

  const handleUnitChange = (unit: Product['chitietdonvi'][0]) => {
    setSelectedUnit(unit);
  };

  const handleAddToCart = async () => {
    if (!user) {
      message.info("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      router.push('/login');
      return;
    }

    if (!product || !selectedUnit) {
      message.error('Vui lòng chọn đơn vị tính!');
      return;
    }

    setIsAddingToCart(true);

    try {
      await addItem({
        id: product.id,
        name: product.tensanpham,
        option: formatUnitString(selectedUnit),
        price: selectedUnit.giaban,
        image: sortedImages[0]?.url || '/placeholder.png',
        quantity: 1,
      });
      message.success(`${product.tensanpham} (${formatUnitString(selectedUnit)}) đã được thêm vào giỏ hàng!`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleContact = () => {
    // Replace with actual contact logic, e.g., redirect to contact page or open a modal
    router.push('/contact');
  };

  const items = useMemo(() => [
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
            <h3 className="font-semibold">Quy cách sản phẩm:</h3>
            <p>
              {product.chitietdonvi
                .sort((a, b) => a.donvitinh.donvitinh.localeCompare(b.donvitinh.donvitinh))
                .map((unit, index) => (
                  <span key={index}>
                    {unit.dinhluong > 1 ? `${unit.dinhluong} ` : ''}
                    {unit.donvitinh.donvitinh}
                    {index < product.chitietdonvi.length - 1 ? ' x ' : ''}
                  </span>
                ))}
            </p>
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
  ], [product]);

  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.tensanpham,
      image: product.anhsanpham[0]?.url || '',
      description: product.motangan || '',
      brand: {
        '@type': 'Brand',
        name: product.thuonghieu?.tenthuonghieu || '',
      },
      offers: {
        '@type': 'Offer',
        price: selectedUnit?.giaban || 0,
        priceCurrency: 'VND',
        availability: 'https://schema.org/InStock',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [product, selectedUnit]);

  return (
    <div className="container mx-auto py-8">
      {product ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative w-full aspect-square">
              <Image
                src={selectedImage || sortedImages[0]?.url || '/placeholder.png'}
                alt={product.tensanpham}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority 
                quality={75} 
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sortedImages.map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className={`relative w-full aspect-square cursor-pointer ${selectedImage === image.url ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
                  onClick={() => setSelectedImage(image.url)}
                >
                  <Image
                    src={image.url}
                    alt={`${product.tensanpham} - ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                    loading="lazy" 
                    quality={50} 
                  />
                  {image.ismain && (
                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1">Chính</div>
                  )}
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
                        className={`px-4 py-2 border rounded-md text-sm ${selectedUnit?.dinhluong === unit.dinhluong &&
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
                  ? `${selectedUnit.giaban.toLocaleString('vi-VN')} đồng/${selectedUnit.donvitinh.donvitinh}`
                  : 'Liên hệ'}
              </div>

              <div className="flex gap-4">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={!selectedUnit || isAddingToCart}
                  loading={isAddingToCart}
                >
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={handleContact}
                  className="flex-1"
                >
                  Liên hệ
                </Button>
              </div>
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