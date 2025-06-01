'use client';

import { useEffect, useState } from 'react';
import { getProductBySearch, getProducts, Meta } from '@/lib/api/productApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi';
import ProductCard from '@/components/common/ProductCard';
//import { Metadata } from 'next';
import { Select, Spin } from 'antd';
import { Product } from '@/types/product.types';
import { DanhMuc } from '@/types/danhmuc.types';
import { useSearchParams } from 'next/navigation';


export default function ProductsPage() {

  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let productRes;
        if (query) {
          productRes = await getProductBySearch(query);
        } else {
          productRes = await getProducts();
        }
        if (Array.isArray(productRes)) {
          setProducts(productRes);
          setMeta(null);
          setFilteredProducts(productRes);
        } else {
          setProducts(productRes.data);
          setMeta(productRes.meta);
          setFilteredProducts(productRes.data);
        }

        const allCategories = await getAllDanhMuc();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  const handleCategoryChange = (value: string) => {
  setSelectedCategory(value === 'all' ? null : value);
  if (value === 'all') {
    setFilteredProducts(products);
  } else {
    setFilteredProducts(
      products.filter((p) => p.danhmuc && p.danhmuc.slug === value || p.madanhmuc === value)
    );
  }
};

// Khi products hoặc selectedCategory thay đổi, tự động lọc lại
useEffect(() => {
  if (!selectedCategory || selectedCategory === 'all') {
    setFilteredProducts(products);
  } else {
    setFilteredProducts(
      products.filter((p) => p.danhmuc && (p.danhmuc.slug === selectedCategory || p.madanhmuc === selectedCategory))
    );
  }
}, [products, selectedCategory]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Tất cả sản phẩm</h1>

      <div className="mb-6">
        <Select
          className="w-64"
          placeholder="Chọn danh mục"
          onChange={handleCategoryChange}
          defaultValue="all"
          options={[
            { value: 'all', label: 'Tất cả danh mục' },
            ...categories.map(cat => ({
              value: cat.madanhmuc,
              label: cat.tendanhmuc
            }))
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                buttonText="Thêm vào giỏ"
              />
            ))
          ) : (
            <div className="col-span-full text-center p-8 bg-gray-100 rounded-lg">
              <p className="text-lg">Không có sản phẩm nào trong danh mục này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}