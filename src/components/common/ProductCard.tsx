'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { Button, message, Spin } from 'antd';
import { Product } from '@/types/product.types';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

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
  giabanSauKhuyenMai?: number;
  parentUnit?: UnitDetail;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, buttonText }) => {
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
  const { user } = useUser();
  const router = useRouter();

  const mainImage = product.anhsanpham.find(img => img.ismain)?.url || '/assets/images/404.png';
  const additionalImages = product.anhsanpham.filter(img => !img.ismain).slice(0, 2).map(img => img.url);

  const shortDescription = (() => {
    const productAsRecord = product as unknown as Record<string, unknown>;
    const shortDesc = productAsRecord.motangan;
    const fullDesc = productAsRecord.mota;

    if (typeof shortDesc === 'string' && shortDesc) {
      return shortDesc;
    } else if (typeof fullDesc === 'string' && fullDesc) {
      return fullDesc.length > 80 ? fullDesc.substring(0, 80) + '...' : fullDesc;
    }
    return 'Không có mô tả';
  })();

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      message.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      router.push('/login');
      return;
    }
    if (!selectedUnit) {
      message.error('Vui lòng chọn đơn vị tính!');
      return;
    }
    setLoading(true);
    try {
      await addItem({
        id: product.id,
        code: product.masanpham,
        name: product.tensanpham,
        option: selectedUnit.donvitinh.donvitinh,
        price: selectedUnit.giaban,
        image: mainImage,
        quantity: 1,
        slug: product.slug,
      });
      message.success(
        `${product.tensanpham} (${formatUnitString(selectedUnit)}) đã được thêm vào giỏ hàng!`
      );
    } finally {
      setLoading(false);
    }
  };

  const goToDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      window.location.href = `/products/${product.slug}`;
    } catch (error) {
      console.error('Error navigating to product details:', error);
    }
  };

  const checkKhuyenMai = (product: Product) => {
    if (product.khuyenmai?.tenchuongtrinh === 'Không khuyến mãi') {
      return null;
    }
    return product.khuyenmai.tenchuongtrinh;
  };

  return (
    <div
      className="block h-full flex flex-col relative cursor-pointer group"
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
          <div
            className="w-full h-full bg-white rounded-lg shadow-md p-3 font-sans flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              position: 'relative',
              zIndex: isFlipped ? 0 : 1,
            }}
          >
            {/* Promotion tag */}
            {checkKhuyenMai(product) && (
              <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                {checkKhuyenMai(product)}
              </div>
            )}

            {/* Product image */}
            <div className="relative aspect-square mb-2">
              <Image
                src={mainImage}
                alt={product.tensanpham}
                fill
                className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>

            {/* Product name */}
            <div className="flex flex-col items-center justify-center min-h-[3.2rem] mb-2 px-1">
              <h2 className="text-base font-semibold text-gray-800 text-center line-clamp-2 break-words">
                {product.tensanpham}
              </h2>
            </div>

            {/* Price and brand (Front) */}
            <div className="flex flex-col items-center justify-center mb-2 min-h-[2.5rem]">
              {selectedUnit?.giabanSauKhuyenMai !== undefined && selectedUnit.giabanSauKhuyenMai < selectedUnit.giaban ? (
                <>
                  <span className="text-xl font-bold text-red-600 text-center leading-tight">
                    {selectedUnit.giabanSauKhuyenMai.toLocaleString('vi-VN')}đ
                    <span className="text-xs text-gray-500 font-normal">/{selectedUnit.donvitinh.donvitinh}</span>
                  </span>
                  <span className="text-xs text-gray-400 line-through text-center block">
                    {selectedUnit.giaban.toLocaleString('vi-VN')}đ
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-red-600 text-center leading-tight">
                  {selectedUnit?.giaban
                    ? `${selectedUnit.giaban.toLocaleString('vi-VN')}đ/${selectedUnit.donvitinh.donvitinh}`
                    : 'Liên hệ'}
                </span>
              )}
            </div>
          </div>

          {/* Back of card */}
          <div
            className="w-full h-full bg-white rounded-lg shadow-md p-3 font-sans flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: isFlipped ? 1 : 0,
            }}
          >
            {/* Product name */}
            <h2 className="text-base font-semibold text-gray-800 text-center line-clamp-2 mb-2">
              {product.tensanpham}
            </h2>

            {/* Unit selection */}
            <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-sm font-medium text-center">Đơn vị tính:</h3>
              {sortedUnits.length > 0 ? (
                <>
                  <div className="flex flex-wrap justify-center gap-1.5 h-8 items-center">
                    {sortedUnits.map((unit) => (
                      <Button
                        disabled={true}
                        key={`${unit.donvitinh.donvitinh}-${unit.dinhluong}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Thêm dòng này để ngăn chuyển trang
                          if (
                            selectedUnit?.donvitinh.donvitinh !== unit.donvitinh.donvitinh ||
                            selectedUnit?.dinhluong !== unit.dinhluong
                          ) {
                            handleUnitChange(unit);
                          }
                        }}
                        className={`px-2 py-1 border rounded-md text-xs font-medium transition ${selectedUnit?.donvitinh.donvitinh === unit.donvitinh.donvitinh &&
                          selectedUnit?.dinhluong === unit.dinhluong
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                          }`}
                      >
                        {unit.donvitinh.donvitinh}
                      </Button>
                    ))}
                  </div>
                  <div className="text-center text-xs text-gray-600 flex flex-wrap justify-center gap-1 min-h-[1.5rem]">
                    {sortedUnits.map((unit, index, array) => (
                      <div key={`${unit.donvitinh.donvitinh}-${unit.dinhluong}`}>
                        {unit.dinhluong} {unit.donvitinh.donvitinh}
                        {index < array.length - 1 ? ' x' : ''}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 text-center">Không có đơn vị tính</p>
              )}
            </div>

            {/* Additional images */}
            <div className="flex justify-center gap-1.5 mb-2">
              <div className="h-12 w-12 relative rounded overflow-hidden">
                <Image
                  src={mainImage}
                  alt={product.tensanpham}
                  fill
                  className="object-cover"
                />
              </div>
              {additionalImages.map((img, index) => (
                <div key={index} className="h-12 w-12 relative rounded overflow-hidden">
                  <Image
                    src={img}
                    alt={`${product.tensanpham} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>


            {/* Price */}
            {/* Price (Back) */}
            <div className="flex flex-col items-center justify-center mb-2 min-h-[2.5rem]">
              <span className="text-xl font-bold text-red-600 text-center leading-tight">
                {selectedUnit?.giaban
                  ? `${selectedUnit.giaban.toLocaleString('vi-VN')}đ/${selectedUnit.donvitinh.donvitinh}`
                  : 'Liên hệ'}
              </span>
            </div>

            {/* Add to cart button */}
            <div className="mt-auto">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/products/${product.slug}`);
                }}
                className="w-full"
                type="primary"
              >
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>
      </Spin>

      {/* CSS for 3D flip effect and responsive adjustments */}
      <style jsx>{`
        .card-flipped {
          transform: rotateY(180deg);
        }
        .group:hover .shadow-md {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 1024px) {
          .text-lg {
            font-size: 0.95rem;
          }
          .text-base {
            font-size: 0.9rem;
          }
          .text-sm {
            font-size: 0.8rem;
          }
          .text-xs {
            font-size: 0.7rem;
          }
          .h-12 {
            height: 2.5rem;
            width: 2.5rem;
          }
          .h-8 {
            height: 1.75rem;
          }
          .py-1\.5 {
            padding-top: 0.3rem;
            padding-bottom: 0.3rem;
          }
          .px-2 {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;