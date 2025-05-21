'use client';

import { useState } from 'react';
import { Product } from '@/types/product.types';
import Image from 'next/image';
import { Button, Tabs, message } from 'antd';
import { useCartStore } from '@/store/cartStore';
import ClientErrorDisplay from '@/components/common/ClientErrorDisplay';

interface ProductDetailClientProps {
    product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
    const [selectedUnit, setSelectedUnit] = useState<Product['chitietdonvi'][0]>(
        product.chitietdonvi[0] || null
    );
    const addItem = useCartStore((state) => state.addItem);

    const handleUnitChange = (unit: Product['chitietdonvi'][0]) => {
        setSelectedUnit(unit);
    };

    const handleAddToCart = () => {
        if (!product || !selectedUnit) return;

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

    const items = [
        {
            key: '1',
            label: 'Thông tin sản phẩm',
            children: (
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Mã sản phẩm:</h3>
                        <p>{product.masanpham}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Danh mục:</h3>
                        <p>{product.danhmuc?.tendanhmuc}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Thương hiệu:</h3>
                        <p>{product.thuonghieu?.tenthuonghieu}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Dạng bảo quản:</h3>
                        <p>{product.dangbaoche}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Công dụng:</h3>
                        <p>{product.congdung}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Chỉ định:</h3>
                        <p>{product.chidinh}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Chống chỉ định:</h3>
                        <p>{product.chongchidinh}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Đối tượng sử dụng:</h3>
                        <p>{product.doituongsudung}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Lưu ý:</h3>
                        <p>{product.luuy}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Ngày sản xuất:</h3>
                        <p>{new Date(product.ngaysanxuat).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Hạn sử dụng:</h3>
                        <p>{product.hansudung} ngày</p>
                    </div>
                </div>
            ),
        },
        {
            key: '2',
            label: 'Thành phần',
            children: (
                <div className="space-y-4">
                    {product.chitietthanhphan.map((tp, index) => (
                        <div key={index}>
                            <h3 className="font-semibold">{tp.thanhphan.tenthanhphan}:</h3>
                            <p>{tp.hamluong}</p>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="relative w-full aspect-square">
                        <Image
                            src={product.anhsanpham[0]?.url || ''}
                            alt={product.tensanpham}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {product.anhsanpham.slice(1).map((image, index) => (
                            <div key={index} className="relative w-full aspect-square">
                                <Image
                                    src={image.url}
                                    alt={`${product.tensanpham} - ${index + 2}`}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 25vw, 12.5vw"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{product.tensanpham}</h1>
                        <p className="text-gray-600">{product.motangan}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Chọn đơn vị:</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.chitietdonvi.map((unit) => (
                                    <button
                                        key={`${unit.dinhluong}-${unit.donvitinh.donvitinh}`}
                                        onClick={() => handleUnitChange(unit)}
                                        className={`px-4 py-2 border rounded-md ${selectedUnit?.dinhluong === unit.dinhluong &&
                                            selectedUnit?.donvitinh.donvitinh === unit.donvitinh.donvitinh
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white text-gray-700 border-gray-300'
                                            } hover:bg-blue-100 transition`}
                                    >
                                        {`${unit.dinhluong} ${unit.donvitinh.donvitinh}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="text-2xl font-bold text-red-500">
                            {selectedUnit?.giaban.toLocaleString('vi-VN')} VNĐ
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            onClick={handleAddToCart}
                            className="w-full"
                        >
                            Thêm vào giỏ hàng
                        </Button>
                    </div>

                    <Tabs items={items} />
                </div>
            </div>
        </div>
    );
} 