import { getProducts, getProductByCode, getProductBySlug, getProducstBySlug } from '@/lib/api/productApi';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = params;

  // Lấy tất cả sản phẩm
  const productsRes = await getProducts();
  const products = Array.isArray(productsRes)
    ? productsRes
    : Array.isArray(productsRes?.data)
      ? productsRes.data
      : [];

  // Tìm sản phẩm theo slug từ danh sách
  let foundProduct = products.find(p => p.slug === slug);

  // Nếu không tìm thấy, gọi API trực tiếp theo slug
  if (!foundProduct) {
    foundProduct = await getProducstBySlug(slug);
    if (!foundProduct) {
      return (
        <div className="container mx-auto py-8 text-center">
          Sản phẩm không tồn tại
        </div>
      );
    }
  }

  // Tìm chi tiết sản phẩm theo mã
  const productDetails = await getProductByCode(foundProduct.masanpham);

  if (!productDetails) {
    return (
      <div className="container mx-auto py-8 text-center">
        Không thể tải thông tin sản phẩm
      </div>
    );
  }

  return <ProductDetailClient product={productDetails} />;
}
