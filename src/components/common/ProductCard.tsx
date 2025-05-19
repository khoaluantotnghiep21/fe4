'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { message } from 'antd';
import { Product } from '@/types/product.types';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  buttonText: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  buttonText,
}) => {
  const [selectedUnit, setSelectedUnit] = useState(product.chitietdonvi[0] || null);
  const addItem = useCartStore((state) => state.addItem);

  const handleUnitChange = (unit: typeof product.chitietdonvi[0]) => {
    setSelectedUnit(unit);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking add to cart
    if (!selectedUnit) return;

    addItem({
      id: product.id,
      name: product.tensanpham,
      option: `${selectedUnit.dinhluong} ${selectedUnit.donvitinh.donvitinh}`,
      price: selectedUnit.giaban,
      image: product.anhsanpham[0]?.url || '',
      quantity: 1,
    });
    message.success(`${product.tensanpham} (${selectedUnit.dinhluong} ${selectedUnit.donvitinh.donvitinh}) đã được thêm vào giỏ hàng!`);
  };

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <div className="w-full bg-white rounded-xl shadow-lg p-4 font-sans relative h-full flex flex-col">
        {product.khuyenmai?.tenchuongtrinh && (
          <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {product.khuyenmai.tenchuongtrinh}
          </div>
        )}

        <div className="flex justify-center mb-4 aspect-square relative">
          <Image
            src={product.anhsanpham[0]?.url || ''}
            alt={product.tensanpham}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <div className='flex flex-col items-center justify-center flex-grow'>
          <h2 className='text-lg font-semibold text-gray-800 text-center mb-4 line-clamp-2'>
            {product.tensanpham}
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-4 h-10 items-center">
          {product.chitietdonvi.map((unit) => (
            <button
              key={`${unit.dinhluong}-${unit.donvitinh.donvitinh}`}
              onClick={(e) => {
                e.preventDefault();
                handleUnitChange(unit);
              }}
              className={`px-3 py-1 border rounded-md text-sm font-medium ${selectedUnit?.dinhluong === unit.dinhluong &&
                  selectedUnit?.donvitinh.donvitinh === unit.donvitinh.donvitinh
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300'
                } hover:bg-blue-100 transition`}
            >
              {`${unit.dinhluong} ${unit.donvitinh.donvitinh}`}
            </button>
          ))}
        </div>

        <div className="text-center mb-4">
          <p className="text-xl font-bold text-red-500">
            {selectedUnit?.giaban.toLocaleString('vi-VN')} VNĐ
          </p>
          <p className="text-sm text-gray-500 line-through">
            {(selectedUnit?.giaban + 10000).toLocaleString('vi-VN')} VNĐ
          </p>
          <p className="text-xs text-gray-600 mt-1">{product.thuonghieu?.tenthuonghieu}</p>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;