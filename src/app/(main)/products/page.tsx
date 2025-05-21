import { getProducts } from '@/lib/api/productApi';
import ProductCard from '@/components/common/ProductCard';
import { Metadata } from 'next';
import ClientErrorDisplay from '@/components/common/ClientErrorDisplay';

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
  let errorMessage = '';

  if (!Array.isArray(products)) {
    errorMessage = "Không thể tải sản phẩm. Vui lòng thử lại sau.";
    console.error("Products is not an array:", products);
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Sản phẩm</h1>
        <ClientErrorDisplay error={errorMessage} />
        <div className="mt-4">
          <p>Vui lòng quay lại sau.</p>
        </div>
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
              product={product}
              buttonText="Thêm vào giỏ"
            />
          ))
        ) : (
          <div className="col-span-full">
            <ClientErrorDisplay error="Không có sản phẩm nào để hiển thị." />
          </div>
        )}
      </div>
    </div>
  );
}