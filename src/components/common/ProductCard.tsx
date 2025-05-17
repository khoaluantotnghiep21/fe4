'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { message } from 'antd';

interface ProductCardProps {
  imageUrl: string;
  discount?: string;
  title: string;
  options: string[];
  price: string;
  originalPrice: string;
  subText: string;
  buttonText: string;
  productId: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  imageUrl,
  discount,
  title,
  options,
  price,
  originalPrice,
  subText,
  buttonText,
  productId,
}) => {
  const [selectedOption, setSelectedOption] = useState(options[0] || '');
  const addItem = useCartStore((state) => state.addItem);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
  };

  const handleAddToCart = () => {
    addItem({
      id: productId,
      name: title,
      option: selectedOption,
      price: parseFloat(price.replace(' VNĐ', '').replace('.', '')),
      image: imageUrl,
      quantity: 1,
    });
    message.success(`${title} (${selectedOption}) đã được thêm vào giỏ hàng!`);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-4 font-sans relative">
      {discount && (
        <div className="absolute -top-3 -left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {discount}
        </div>
      )}

      <div className='flex flex-col h-full'>
        <div className="flex justify-center mb-4">
          <Image
            src={imageUrl}
            alt={title}
            width={192}
            height={192}
            className="w-full max-w-[12rem] h-auto object-contain"
          />
        </div>
        <h2 className="product-name text-lg font-semibold text-gray-800 text-center mb-4 h-14 flex justify-center line-clamp-2">{title}</h2>
        <div className="flex flex-wrap justify-center gap-2 mb-4 h-10 items-center">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionChange(option)}
              className={`px-3 py-1 border rounded-md text-sm font-medium ${selectedOption === option
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300'
                } hover:bg-blue-100 transition`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="text-center mb-4 flex-grow">
          <p className="text-xl font-bold text-red-500">{price}</p>
          <p className="text-sm text-gray-500 line-through">{originalPrice}</p>
          <p className="text-xs text-gray-600 mt-1">{subText}</p>
        </div>
        <div>
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;