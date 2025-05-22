'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { message, Spin } from 'antd';
import { Product } from '@/types/product.types';

interface ProductCardProps {
  product: Product;
  buttonText: string;
}

interface UnitDetail {
  donvitinh: {
    donvitinh: string;
  };
  dinhluong: number;
  giaban: number;
  parentUnit?: UnitDetail;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, buttonText }) => {
  // Sort units by unit name to ensure consistent order
  const sortedUnits = [...product.chitietdonvi].sort((a, b) =>
    a.donvitinh.donvitinh.localeCompare(b.donvitinh.donvitinh)
  );

  const [selectedUnit, setSelectedUnit] = useState<UnitDetail | null>(
    sortedUnits[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  const mainImage = product.anhsanpham.find(img => img.isMain)?.url || product.anhsanpham[0]?.url || '/placeholder.png';
  const additionalImages = product.anhsanpham.filter(img => !img.isMain).slice(0, 2).map(img => img.url);

  // Get short description, safely handling potentially missing properties
  const shortDescription = (() => {
    // Cast to unknown first, then to Record to satisfy TypeScript
    const productAsRecord = product as unknown as Record<string, unknown>;
    const shortDesc = productAsRecord.motangan;
    const fullDesc = productAsRecord.mota;

    if (typeof shortDesc === 'string' && shortDesc) {
      return shortDesc;
    } else if (typeof fullDesc === 'string' && fullDesc) {
      return fullDesc.length > 100 ? fullDesc.substring(0, 100) + '...' : fullDesc;
    }
    return 'Không có mô tả';
  })();

  // Handle mouse leave when user's mouse leaves the document/window
  useEffect(() => {
    const handleMouseLeave = () => {
      setIsFlipped(false);
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const formatUnitString = (unit: UnitDetail | null): string => {
    if (!unit || !unit.donvitinh?.donvitinh) {
      return 'Không xác định';
    }

    if (!unit.dinhluong || unit.dinhluong === 1) {
      return unit.donvitinh.donvitinh;
    }
    return `${unit.dinhluong} x ${unit.donvitinh.donvitinh}`;
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
        option: selectedUnit.donvitinh.donvitinh,
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

  const goToDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/products/${product.slug}`;
  };

  return (
    <div
      className="block h-full relative cursor-pointer"
      ref={cardRef}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={goToDetails}
      style={{ perspective: '1000px' }}
    >
      <Spin spinning={loading}>
        <div
          className={`w-full h-full transition-all duration-500 ${isFlipped ? 'card-flipped' : ''}`}
          style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        >
          {/* Front of card */}
          <div className="w-full h-full bg-white rounded-xl shadow-lg p-4 font-sans flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              position: 'relative',
              zIndex: isFlipped ? 0 : 1
            }}>
            {/* Row 1: Promotion tag (if any) */}
            {product.khuyenmai?.tenchuongtrinh && (
              <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                {product.khuyenmai.tenchuongtrinh}
              </div>
            )}

            {/* Row 2: Product image */}
            <div className="flex justify-center mb-3 aspect-square relative">
              <Image
                src={mainImage}
                alt={product.tensanpham}
                fill
                className="object-contain p-3"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>

            {/* Row 3: Product name */}
            <div className="flex flex-col items-center justify-center min-h-[2.5rem]">
              <h2 className="text-lg font-semibold text-gray-800 text-center mb-2 line-clamp-2">
                {product.tensanpham}
              </h2>
            </div>

            {/* Row 4: Price information */}
            <div className="text-center mt-auto mb-3 flex-grow flex flex-col justify-center">
              <p className="text-xl font-bold text-red-500">
                {selectedUnit?.giaban
                  ? `${selectedUnit.giaban.toLocaleString('vi-VN')} đồng/${selectedUnit.donvitinh.donvitinh}`
                  : 'Liên hệ'}
              </p>
              <p className="text-sm text-gray-500 line-through">
                {selectedUnit?.giaban
                  ? `${(selectedUnit.giaban + 10000).toLocaleString('vi-VN')} đồng`
                  : 'Liên hệ'}
              </p>
              <p className="text-xs text-gray-600 mt-1">{product.thuonghieu?.tenthuonghieu || 'Không xác định'}</p>
              <div className="mt-3 text-sm text-blue-500">
                Lật để xem đơn vị tính
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div
            className="w-full h-full bg-white rounded-xl shadow-lg p-4 font-sans flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: isFlipped ? 1 : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">
              {product.tensanpham}
            </h2>

            {/* Unit selection (Hộp, Vỉ, Viên, etc.) */}
            <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-md font-medium mb-1 text-center">Đơn vị tính:</h3>
              {sortedUnits.length > 0 ? (
                <>
                  <div className="flex flex-wrap justify-center gap-2 h-10 items-center">
                    {sortedUnits.map((unit) => (
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
                  <div className="text-center text-sm text-gray-600 flex flex-wrap justify-center gap-1 min-h-[1.8rem]">
                    {sortedUnits.map((unit, index, array) => (
                      <div key={`${unit.donvitinh.donvitinh}-${unit.dinhluong}`}>
                        {unit.dinhluong} {unit.donvitinh.donvitinh}
                        {index < array.length - 1 ? ' x' : ''}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center">Không có đơn vị tính</p>
              )}
            </div>

            {/* Additional images gallery */}
            <div className="flex justify-center gap-2 mb-3">
              <div className="h-16 w-16 relative rounded-md overflow-hidden">
                <Image
                  src={mainImage}
                  alt={product.tensanpham}
                  fill
                  className="object-cover"
                />
              </div>
              {additionalImages.map((img, index) => (
                <div key={index} className="h-16 w-16 relative rounded-md overflow-hidden">
                  <Image
                    src={img}
                    alt={`${product.tensanpham} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Product description */}
            <div className="flex-grow overflow-auto mb-3">
              <h3 className="text-md font-medium mb-1">Mô tả:</h3>
              <p className="text-sm text-gray-600">{shortDescription}</p>
            </div>

            {/* Price on back */}
            <p className="text-xl font-bold text-red-500 text-center">
              {selectedUnit?.giaban
                ? `${selectedUnit.giaban.toLocaleString('vi-VN')} đồng/${selectedUnit.donvitinh.donvitinh}`
                : 'Liên hệ'}
            </p>

            {/* Add to cart button */}
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                disabled={loading || !selectedUnit}
              >
                {loading ? 'Đang xử lý...' : buttonText}
              </button>
            </div>
          </div>
        </div>
      </Spin>

      {/* CSS for 3D flip effect */}
      <style jsx>{`
        .card-flipped {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default ProductCard;