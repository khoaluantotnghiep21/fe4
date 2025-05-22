'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { message, Spin } from 'antd';
import { Product } from '@/types/product.types';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  buttonText: string;
}

interface UnitDetail {
  donvitinh: {
    donvitinh: string; // e.g., "Hộp", "Vỉ", "Viên"
  };
  dinhluong: number; // e.g., 10 (for 10 Vỉ in a Hộp, or 10 Viên in a Vỉ)
  giaban: number; // Price for this unit
  parentUnit?: UnitDetail; // Reference to parent unit for nested structure
}

const ProductCard: React.FC<ProductCardProps> = ({ product, buttonText }) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(
    product.chitietdonvi[0] || null
  );
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Find main image or use the first one as fallback
  const mainImage = product.anhsanpham.find(img => img.isMain)?.url || product.anhsanpham[0]?.url || '/placeholder.png';

  // Format unit string showing unit type and quantity
  const formatUnitString = (unit: UnitDetail | null): string => {
    if (!unit || !unit.donvitinh?.donvitinh) {
      return 'Không xác định';
    }
    // If dinhluong is not available or is 1, only show the unit type
    if (!unit.dinhluong || unit.dinhluong === 1) {
      return unit.donvitinh.donvitinh;
    }
    // Show quantity and unit type (e.g., "10 Viên")
    return `${unit.dinhluong} ${unit.donvitinh.donvitinh}`;
  };

  const handleUnitChange = (unit: UnitDetail) => {
    setSelectedUnit(unit);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedUnit) {
      message.error('Vui lòng chọn đơn vị tính!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      addItem({
        id: product.id,
        name: product.tensanpham,
        option: formatUnitString(selectedUnit),
        price: selectedUnit.giaban,
        image: mainImage,
        quantity: 1,
      });
      setLoading(false);
      message.success(
        `${product.tensanpham} (${formatUnitString(selectedUnit)}) đã được thêm vào giỏ hàng!`
      );
    }, 500);
  };

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <Spin spinning={loading}>
        <div className="w-full bg-white rounded-xl shadow-lg p-4 font-sans relative h-full flex flex-col">
          {/* Row 1: Promotion tag (if any) */}
          {product.khuyenmai?.tenchuongtrinh && (
            <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {product.khuyenmai.tenchuongtrinh}
            </div>
          )}

          {/* Row 2: Product image */}
          <div className="flex justify-center mb-4 aspect-square relative">
            <Image
              src={mainImage}
              alt={product.tensanpham}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Row 3: Product name */}
          <div className="flex flex-col items-center justify-center flex-grow">
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-4 line-clamp-2">
              {product.tensanpham}
            </h2>
          </div>

          {/* Row 4: Unit selection (Hộp, Vỉ, Viên, etc.) */}
          <div className="flex flex-col gap-2 mb-4">
            {product.chitietdonvi.length > 0 ? (
              <>
                <div className="flex flex-wrap justify-center gap-2 h-10 items-center">
                  {[...product.chitietdonvi]
                    .sort((a, b) => a.donvitinh.donvitinh.localeCompare(b.donvitinh.donvitinh))
                    .map((unit) => (
                      <button
                        key={`${unit.donvitinh.donvitinh}-${unit.dinhluong}`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            selectedUnit?.donvitinh.donvitinh !== unit.donvitinh.donvitinh ||
                            selectedUnit?.dinhluong !== unit.dinhluong
                          ) {
                            handleUnitChange(unit);
                          }
                        }}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${selectedUnit?.donvitinh.donvitinh === unit.donvitinh.donvitinh &&
                          selectedUnit?.dinhluong === unit.dinhluong
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300'
                          } hover:bg-blue-100 transition`}
                      >
                        {unit.donvitinh.donvitinh}
                      </button>
                    ))}
                </div>
                <div className="text-center text-sm text-gray-600 flex flex-wrap justify-center gap-2">
                  {[...product.chitietdonvi]
                    .sort((a, b) => a.donvitinh.donvitinh.localeCompare(b.donvitinh.donvitinh))
                    .map((unit) => (
                      <div key={`${unit.donvitinh.donvitinh}-${unit.dinhluong}`}>
                        {unit.dinhluong} {unit.donvitinh.donvitinh}
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Không có đơn vị tính</p>
            )}
          </div>

          {/* Row 5: Price information */}
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-red-500">
              {selectedUnit?.giaban
                ? `${selectedUnit.giaban.toLocaleString('vi-VN')} đồng/${selectedUnit.donvitinh.donvitinh}`
                : 'Liên hệ'}
            </p>
            <p className="text-sm text-gray-500 line-through">
              {selectedUnit?.giaban
                ? `${(selectedUnit.giaban + 10000).toLocaleString('vi-VN')} đồng/${selectedUnit.donvitinh.donvitinh}`
                : 'Liên hệ'}
            </p>
            <p className="text-xs text-gray-600 mt-1">{product.thuonghieu?.tenthuonghieu || 'Không xác định'}</p>
          </div>

          {/* Row 6: Add to cart button */}
          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
              disabled={loading || !selectedUnit}
            >
              {loading ? 'Đang xử lý...' : buttonText}
            </button>
          </div>
        </div>
      </Spin>
    </Link>
  );
};

export default ProductCard;