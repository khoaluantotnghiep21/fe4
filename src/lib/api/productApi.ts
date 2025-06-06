import { Product, UpdateProductRequest } from "@/types/product.types";
import { message } from "antd";
import axiosClient from "../axiosClient";

export interface Meta {
  total: number;
  page: number;
  take: number;
  pageCount: number;
}

export interface ProductListResponse {
  data: Product[];
  meta: Meta;
}

export async function createProduct(data: any): Promise<any> {
  try {
    const res = await axiosClient.post('/product/createProduct', data);
    console.log('API response from createProduct:', res);
    // Return the data directly, could be in res.data or res.data.data depending on API structure
    return res.data.data || res.data;
  } catch (err) {
    console.error('Error in createProduct API:', err);
    message.error('Lỗi khi thêm sản phẩm');
    throw err;
  }
}

export async function getProducts(params?: { page?: number; take?: number }): Promise<ProductListResponse> {
  try {
    const res = await axiosClient.get("/product/getAllProducts", {
      params: params || {},
    });
    const rawProducts = Array.isArray(res.data.data?.data)
      ? res.data.data.data
      : [];
    const meta = res.data.data?.meta || {
      total: rawProducts.length,
      page: params?.page ?? 1,
      take: params?.take ?? rawProducts.length,
      pageCount: Math.ceil(rawProducts.length / (params?.take ?? rawProducts.length)),
    };
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
    return {
      data: mappedProducts,
      meta: meta,
    };
  } catch (err) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi fetch sản phẩm");
    } else {
      console.error("Lỗi khi fetch sản phẩm:", err);
    }
    return {
      data: [],
      meta: { total: 0, page: params?.page ?? 1, take: params?.take ?? 0, pageCount: 0 },
    };
  }
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  try {
    // First get all products
    const productsResponse = await getProducts();

    // Then filter by category slug
    const filteredProducts = productsResponse.data.filter(
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

/**
 * Xóa sản phẩm theo mã sản phẩm
 * @param masanpham Mã sản phẩm cần xóa
 * @returns Kết quả xóa sản phẩm
 */
export async function deleteProductByMaSanPham(masanpham: string): Promise<boolean> {
  try {
    console.log(`Calling API to delete product with masanpham: ${masanpham}`);
    const response = await axiosClient.delete(`/product/deleteProduct/${masanpham}`);

    console.log('Delete API response:', response);

    // Kiểm tra kết quả trả về từ API
    if (response.data && response.data.success) {
      console.log('API indicated success');
      return true;
    }

    // Nếu không có response.data.success, kiểm tra mã trạng thái
    const success = response.status === 200 || response.status === 204;
    console.log(`API status code ${response.status}, success: ${success}`);
    return success;  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Lỗi khi xóa sản phẩm';
    
    console.error('Delete API error details:', {
      message: errorMessage,
      status: err.response?.status,
      data: err.response?.data,
      error: err.message
    });

    if (typeof window !== "undefined") {
      message.error(errorMessage);
    }
    
    // Luôn throw lỗi để component xử lý
    throw err;

    throw err; // Ném lỗi để hàm gọi có thể bắt và xử lý
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

export async function getProductByMaSanPham(masanpham: string): Promise<Product | null> {
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

export async function updateProduct(
  masanpham: string,
  productData: UpdateProductRequest
): Promise<Product | null> {
  try {
    const res = await axiosClient.put(`/product/updateProduct/${masanpham}`, productData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Thêm console.log để debug
    console.log('API raw response:', res);

    if (res.data) {

      return res.data.data || res.data;
    } else {
      console.error('Không có dữ liệu trả về');
      return null;
    }
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật sản phẩm';

    if (typeof window !== "undefined") {
      console.error('API error:', errorMessage, err);
    } else {
      console.error("Lỗi khi cập nhật sản phẩm:", err);
    }
    return null;
  }
}

export async function getProductBySearch(
  query: string,
  params?: { page?: number; take?: number }
): Promise<ProductListResponse> {
  try {
    const res = await axiosClient.get("/product/search", {
      params: { query, ...(params || {}) },
    });
    return res.data.data;
  } catch (err) {
    return {
      data: [],
      meta: {
        total: 0,
        page: params?.page ?? 1,
        take: params?.take ?? 0,
        pageCount: 0,
      },
    };
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
