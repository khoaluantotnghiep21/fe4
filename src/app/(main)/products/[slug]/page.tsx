import { getProducts, getProductByCode } from '@/lib/api/productApi';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    try {
        const { slug } = await params;
        
        const products = await getProducts();
        const foundProduct = products.find(p => p.slug === slug);

        if (!foundProduct) {
            return <div className="container mx-auto py-8 text-center">Sản phẩm không tồn tại</div>;
        }

        const productDetails = await getProductByCode(foundProduct.masanpham);

        if (!productDetails) {
            return <div className="container mx-auto py-8 text-center">Không thể tải thông tin sản phẩm</div>;
        }

        return <ProductDetailClient product={productDetails} />;
    } catch (error) {
        console.error('Error loading product:', error);
        return <div className="container mx-auto py-8 text-center">Đã xảy ra lỗi khi tải sản phẩm</div>;
    }
}