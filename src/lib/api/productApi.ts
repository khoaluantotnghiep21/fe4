import { Product } from "@/types/product.types";

import axiosClient from "../axiosClient";

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await axiosClient.get('/product/getAllProducts');
    const rawProducts = res.data.data.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedProducts: Product[] = rawProducts.map((item: any) => ({
      id: item.id,
      name: item.tensanpham,
      price: item.gianhap,
      image: item.anhsanpham?.[0]?.url || '',
      discount: item.khuyenmai?.tenchuongtrinh || undefined,
      originalPrice: item.gianhap + 10000, 
      subText: item.thuonghieu?.tenthuonghieu || '',
    }));

    return mappedProducts;
  } catch (err) {
    console.error('Lỗi khi fetch sản phẩm:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.id === id) || null;
}

export async function getCarouselItems() {
  return [
    {
      desktopSrc: "/assets/images/banner1_desktop.png",
      mobileSrc: "/assets/images/banner1_mobile.png",
      alt: "Khuyến mãi Long Châu",
      desktopWidth: 1200,
      desktopHeight: 400,
      mobileWidth: 768,
      mobileHeight: 300,
    },
    {
      desktopSrc: "/assets/images/banner2_desktop.png",
      mobileSrc: "/assets/images/banner2_mobile.png",
      alt: "Sản phẩm mới Long Châu",
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
      desktopSrc: "/assets/images/slider1.png",
      mobileSrc: "/assets/images/slider1_mobile.png",
      alt: "Khuyến mãi Long Châu",
      desktopWidth: 960,
      desktopHeight: 300,
      mobileWidth: 384,
      mobileHeight: 200,
    },
    {
      desktopSrc: "/assets/images/slider1.png",
      mobileSrc: "/assets/images/slider1_mobile.png",
      alt: "Sản phẩm mới Long Châu",
      desktopWidth: 960,
      desktopHeight: 300,
      mobileWidth: 384,
      mobileHeight: 200,
    },
  ];
}
