import { Product } from "@/types/product.types";
import { message } from "antd";
import axiosClient from "../axiosClient";

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await axiosClient.get("/product/getAllProducts");
    const rawProducts = res.data.data.data;

    // Map the raw products to our Product interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedProducts: Product[] = rawProducts.map((item: any) => ({
      id: item.id,
      masanpham: item.masanpham,
      tensanpham: item.tensanpham,
      slug: item.slug,
      dangbaoche: item.dangbaoche,
      congdung: item.congdung,
      chidinh: item.chidinh,
      chongchidinh: item.chongchidinh,
      thuockedon: item.thuockedon,
      motangan: item.motangan,
      doituongsudung: item.doituongsudung,
      luuy: item.luuy,
      ngaysanxuat: item.ngaysanxuat,
      hansudung: item.hansudung,
      gianhap: item.gianhap,
      mathuonghieu: item.mathuonghieu,
      madanhmuc: item.madanhmuc,
      machuongtrinh: item.machuongtrinh,
      danhmuc: item.danhmuc,
      thuonghieu: item.thuonghieu,
      khuyenmai: item.khuyenmai,
      anhsanpham: item.anhsanpham,
      chitietdonvi: item.chitietdonvi,
      chitietthanhphan: item.chitietthanhphan,
    }));

    return mappedProducts;
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi fetch sản phẩm");
    } else {
      console.error("Lỗi khi fetch sản phẩm:", err);
    }
    return [];
  }
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  try {
    // First get all products
    const allProducts = await getProducts();

    // Then filter by category slug
    const filteredProducts = allProducts.filter(
      (product) => product.danhmuc && product.danhmuc.slug === categorySlug
    );

    return filteredProducts;
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy sản phẩm theo danh mục");
    } else {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", err);
    }
    return [];
  }
}

export async function getProductByCode(
  masanpham: string
): Promise<Product | null> {
  try {
    const res = await axiosClient.get(`/product/findProduct/${masanpham}`);
    return res.data.data;
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi fetch chi tiết sản phẩm");
    } else {
      console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
    }
    return null;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await axiosClient.get(`/product/getProductById/${id}`);
    return res.data.data;
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi fetch chi tiết sản phẩm");
    } else {
      console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
    }
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await axiosClient.get(`/product/getProductBySlug/${slug}`);
    return res.data.data;
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi fetch chi tiết sản phẩm");
    } else {
      console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
    }
    return null;
  }
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
