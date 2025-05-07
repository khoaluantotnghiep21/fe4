import { Product } from '@/types/product.types';

export async function getProducts(): Promise<Product[]> {
  return [
    {
      id: '1',
      name: 'Thuốc Paracetamol 500mg',
      price: 50000,
      image: '/assets/images/404.png',
      discount: '10% OFF',
      options: ['Hộp', 'Vỉ', 'Ống'],
      originalPrice: 55000,
      subText: 'Hỗ trợ giảm đau, hạ sốt',
    },
    {
      id: '2',
      name: 'Vitamin C 1000mg',
      price: 120000,
      image: '/assets/images/404.png',
      discount: '15% OFF',
      options: ['Hộp', 'Lọ'],
      originalPrice: 140000,
      subText: 'Tăng cường đề kháng',
    },
  ];
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.id === id) || null;
}

export async function getCarouselItems() {
  return [
    {
      desktopSrc: '/assets/images/banner1_desktop.png',
      mobileSrc: '/assets/images/banner1_mobile.png',
      alt: 'Khuyến mãi Long Châu',
      desktopWidth: 1200,
      desktopHeight: 400,
      mobileWidth: 768,
      mobileHeight: 300,
    },
    {
      desktopSrc: '/assets/images/banner2_desktop.png',
      mobileSrc: '/assets/images/banner2_mobile.png',
      alt: 'Sản phẩm mới Long Châu',
      desktopWidth: 1200,
      desktopHeight: 400,
      mobileWidth: 768,
      mobileHeight: 300,
    },
  ];
}

export async function getSliderItems() {
    return [
      {
        desktopSrc: '/assets/images/slider1.png',
        mobileSrc: '/assets/images/slider1_mobile.png',
        alt: 'Khuyến mãi Long Châu',
        desktopWidth: 960,
        desktopHeight: 300,
        mobileWidth: 384,
        mobileHeight: 200,
      },
      {
        desktopSrc: '/assets/images/slider1.png',
        mobileSrc: '/assets/images/slider1_mobile.png',
        alt: 'Sản phẩm mới Long Châu',
        desktopWidth: 960,
        desktopHeight: 300,
        mobileWidth: 384,
        mobileHeight: 200,
      },
    ];
  }
