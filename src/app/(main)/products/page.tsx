'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api/productApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi';
import ProductCard from '@/components/common/ProductCard';
//import { Metadata } from 'next';
import { Select, Spin } from 'antd';
import { Product } from '@/types/product.types';
import { DanhMuc } from '@/types/danhmuc.types';


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all products
        const allProducts = await getProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);

        // Fetch all categories
        const allCategories = await getAllDanhMuc();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        product => product.madanhmuc === selectedCategory
      );
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? null : value);
  };

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