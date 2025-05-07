import { getProducts, getCarouselItems, getSliderItems } from '@/lib/api/productApi';
import CarouselCustom from '@/components/common/Carousel';
import ProductCard from '@/components/common/ProductCard';
import Link from 'next/link';
import { Button} from 'antd';
import { Metadata } from 'next';
import Image from 'next/image';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Long Châu E-Commerce - Trang chủ',
    description: 'Khám phá các sản phẩm y tế, thuốc, thực phẩm chức năng và thiết bị y tế tại Nhà thuốc Long Châu. Mua sắm an toàn, tiện lợi, giao hàng nhanh chóng.',
    openGraph: {
      title: 'Long Châu E-Commerce',
      description: 'Mua sắm sản phẩm y tế và sức khỏe tại Long Châu.',
      url: 'https://nhathuoclongchau.com.vn',
      images: ['/assets/images/logo.png'],
    },
  };
}

export default async function Home() {
  const products = await getProducts();
  const carouselItems = await getCarouselItems();
  const sliderItems = await getSliderItems();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Carousel đầu trang */}
        <CarouselCustom items={carouselItems} />

        <div className="container mx-auto py-8 flex flex-col gap-8">

          {/* Khu vực Slider + Banner */}
          <div className="hidden md:grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <CarouselCustom items={sliderItems} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="w-full">
                            <Image
                                src="/assets/images/bannerungthu.png"
                                alt="Banner nhỏ 1"
                                width={480}
                                height={300}
                                className="object-cover w-full h-auto"
                            />
                        </div>
                        <div className="w-full">
                            <Image
                                src="/assets/images/banneryte1.png"
                                alt="Banner nhỏ 2"
                                width={480}
                                height={300}
                                className="object-cover w-full h-auto"
                            />
                        </div>
                    </div>
                </div>

          {/* Tiêu đề và nút xem tất cả */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Sản phẩm nổi bật</h1>
            <Link href="/products">
              <Button type="primary" size="large" className="bg-blue-500 hover:bg-blue-600">
                Xem tất cả sản phẩm
              </Button>
            </Link>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
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
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
