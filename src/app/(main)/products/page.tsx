import { getProducts } from '@/lib/api/productApi';
import ProductCard from '@/components/common/ProductCard';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sản phẩm - Long Châu E-Commerce',
    description: 'Xem tất cả sản phẩm y tế, thuốc, thực phẩm chức năng và thiết bị y tế tại Nhà thuốc Long Châu.',
    openGraph: {
      title: 'Sản phẩm - Long Châu',
      description: 'Mua sắm sản phẩm y tế và sức khỏe tại Long Châu.',
      url: 'https://longchau.com.vn/products',
      images: ['/assets/images/logo.png'],
    },
  };
}

export default async function Products() {
  const products = await getProducts();
  if (!Array.isArray(products)) {
    console.error("Products is not an array:", products);
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Sản phẩm</h1>
        <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sản phẩm</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              productId={product.id}
              imageUrl={product.image}
              discount={product.discount}
              title={product.name}
              options={product.options || ['Hộp']}
              price={product.price.toLocaleString('vi-VN') + ' VNĐ'}
              originalPrice={product.originalPrice?.toLocaleString('vi-VN') + ' VNĐ' || ''}
              subText={product.subText || ''}
              buttonText="Thêm vào giỏ"
            />
          ))
        ) : (
          <p>Không có sản phẩm nào để hiển thị.</p>
        )}
      </div>
    </div>
  );
}