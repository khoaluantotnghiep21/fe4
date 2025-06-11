import axiosClient from '../axiosClient';
import { Product } from '@/types/product.types';

/**
 * Interface for product in request
 */
interface ProductRequest {
  masanpham: string;
  soluong: string;
}

/**
 * Interface for multiple products request
 */
interface CreateMultipleProductsRequest {
  machinhanh: string;
  products: ProductRequest[];
}

/**
 * Interface for API response
 */
interface ApiResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data?: any;
}

/**
 * Interface for Pharmacy Product
 */
export interface PharmacyProduct {
  id: string;
  masanpham: string;
  machinhanh: string;
  tensanpham: string;
  giaban: number;
  soluong: number;
  trangthai: string;
  anhsanpham?: string;
  manhaphang?: string;
  ngaynhap?: string;
}

/**
 * Interface for Pharmacy Product List Response
 */
export interface PharmacyProductListResponse {
  data: PharmacyProduct[];
  meta: {
    total: number;
    page: number;
    take: number;
    pageCount: number;
  };
}

/**
 * Add multiple products to a pharmacy branch
 * @param machinhanh Pharmacy branch code
 * @param products Array of product objects with masanpham and soluong
 * @returns Promise with response data
 */
export const createMultipleProducts = async (
  machinhanh: string, 
  products: ProductRequest[]
): Promise<ApiResponse> => {
  try {
    const response = await axiosClient.post('/pharmacy-product/createMultipleProducts', {
      machinhanh,
      products
    });
    return response.data;
  } catch (error: any) {
    console.error('Error adding multiple products to pharmacy:', error);
    throw error;
  }
};

/**
 * Add multiple products to a pharmacy branch (alternative function accepting a complete request object)
 * @param request Object containing machinhanh and products array
 * @returns Promise with response data
 */
export const createMultipleProductsWithRequest = async (
  request: CreateMultipleProductsRequest
): Promise<ApiResponse> => {
  try {
    const response = await axiosClient.post('/pharmacy-product/createMultipleProducts', request);
    return response.data;
  } catch (error: any) {
    console.error('Error adding multiple products to pharmacy:', error);
    throw error;
  }
};

/**
 * Get all pharmacy products (with pagination)
 * @param params Optional pagination parameters
 * @returns Promise with pharmacy products list response
 */
export const getListPharmacyProducts = async (
  params?: { page?: number; take?: number }
): Promise<PharmacyProductListResponse> => {
  try {
    const response = await axiosClient.get('/pharmacy-product/getListPharmacyProducts', {
      params: params || { page: 1, take: 12 },
    });
    
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        total: 0,
        page: params?.page || 1,
        take: params?.take || 12,
        pageCount: 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching pharmacy products:', error);
    return {
      data: [],
      meta: {
        total: 0,
        page: params?.page || 1,
        take: params?.take || 12,
        pageCount: 0
      }
    };
  }
};

/**
 * Get list of products in a specific pharmacy branch
 * @param machinhanh Pharmacy branch code
 * @param params Optional pagination parameters
 * @returns Promise with pharmacy products list response
 */
export const getListProductInPharmacy = async (
  machinhanh: string,
  params?: { page?: number; take?: number }
): Promise<PharmacyProductListResponse> => {
  try {
    const response = await axiosClient.get(`/pharmacy-product/getListProductInPharmacy/${machinhanh}`, {
      params: params || { page: 1, take: 12 },
    });
    
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        total: 0,
        page: params?.page || 1,
        take: params?.take || 12,
        pageCount: 0
      }
    };
  } catch (error: any) {
    console.error(`Error fetching products for pharmacy branch ${machinhanh}:`, error);
    return {
      data: [],
      meta: {
        total: 0,
        page: params?.page || 1,
        take: params?.take || 12,
        pageCount: 0
      }
    };
  }
};

/**
 * @param manhaphang Receipt code (receipt ID to update)
 * @returns Promise with API response
 */
export const updateReceiptStatus = async (
  manhaphang: string
): Promise<ApiResponse> => {
  try {
    console.log(`Updating receipt status for: ${manhaphang}`);
    
    const response = await axiosClient.put(`/pharmacy-product/updateStatus/${manhaphang}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error updating status for receipt ${manhaphang}:`, error);
    
    // Handle specific error cases
    const errorResponse = error.response?.data;
    if (error.response?.status === 404) {
      console.error('Detail:', errorResponse);
      throw new Error(errorResponse?.message || `Không tìm thấy đơn nhập hàng ${manhaphang}`);
    }
    
    throw error;
  }
};

