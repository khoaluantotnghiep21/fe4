import { getProductsByCategory } from '@/lib/api/productApi';
import { getDanhMucBySlug } from '@/lib/api/danhMucApi';
import ProductCard from '@/components/common/ProductCard';
import { Metadata } from 'next';
import ClientErrorDisplay from '@/components/common/ClientErrorDisplay';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
    params: {
        slug: string;
    };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { slug } = params;
    const category = await getDanhMucBySlug(slug);

    if (!category) {
        return {
            title: 'Danh mục không tồn tại - Long Châu E-Commerce',
            description: 'Danh mục không tồn tại hoặc đã bị xóa.',
        };
    }

    return {
        title: `${category.tendanhmuc} - Long Châu E-Commerce`,
        description: `Xem tất cả sản phẩm trong danh mục ${category.tendanhmuc} tại Nhà thuốc Long Châu.`,
        openGraph: {
            title: `${category.tendanhmuc} - Long Châu`,
            description: `Mua sắm sản phẩm thuộc danh mục ${category.tendanhmuc} tại Long Châu.`,
            url: `https://longchau.com.vn/categories/${slug}`,
            images: ['/assets/images/logo.png'],
        },
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = params;
    const category = await getDanhMucBySlug(slug);

    // If category not found, return 404
    if (!category) {
        return notFound();
    }

    const products = await getProductsByCategory(slug);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-2">{category.tendanhmuc}</h1>
            {category.mota && <p className="text-gray-600 mb-6">{category.mota}</p>}

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
                        <ClientErrorDisplay title="Lỗi" message="Không có sản phẩm nào trong danh mục này." />
                    </div>
                )}
            </div>
        </div>
    );
} 