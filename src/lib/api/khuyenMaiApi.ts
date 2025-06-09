import axiosClient from '../axiosClient';
import { message } from 'antd';
import { KhuyenMai } from '@/types/khuyenmai.types';
import { Product } from '@/types/product.types';

/**
 * Interface cho dữ liệu tạo chương trình khuyến mãi mới
 */
export interface CreatePromotionRequest {
  tenchuongtrinh: string;
  giatrikhuyenmai: number;
  donviapdung: string;
  ngaybatdau: string;
  ngayketthuc: string;
}

/**
 * Interface cho dữ liệu áp dụng chương trình khuyến mãi cho sản phẩm
 */
export interface ApplyPromotionRequest {
  productIds: string[];
}

/**
= * @returns Danh sách các chương trình khuyến mãi
 */
export async function getAllKhuyenMai(): Promise<KhuyenMai[]> {
  try {
    // Sửa lại đường dẫn API từ promition thành promotion cho đúng
    // Dựa vào ảnh bạn chia sẻ, trên BE endpoint vẫn đang là /promition/
    const res = await axiosClient.get('/promotion/getAllPromotion');

    console.log('Get all promotions response:', res);
    
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching promotions:', err);
    message.error('Lỗi khi tải danh sách khuyến mãi');
    return [];
  }
}

/**
 * API để tạo mới chương trình khuyến mãi
 * @param data Thông tin chương trình khuyến mãi cần tạo
 * @returns Kết quả tạo chương trình khuyến mãi
 */
export async function createNewPromotion(data: CreatePromotionRequest): Promise<KhuyenMai | null> {
  try {    console.log('Creating new promotion with data:', data);
    const response = await axiosClient.post('/promotion/createNewPromotion', data);
    
    console.log('Create promotion response:', response);
    
    // Kiểm tra kết quả trả về từ API
    if (response.data && response.status >= 200 && response.status < 300) {
      // Hiển thị thông báo thành công
      message.success('Tạo chương trình khuyến mãi thành công!');
      
      // Trả về dữ liệu đã được xử lý từ API
      const responseData = response.data.data || response.data;
      return responseData as KhuyenMai;
    }
    
    return null;
  } catch (err: any) {
    console.error('Error creating promotion:', err);
    
    // Hiển thị thông báo lỗi
    const errorMessage = err.response?.data?.message || 'Lỗi khi tạo chương trình khuyến mãi';
    message.error(errorMessage);
    
    throw err;
  }
}

/**
 * Cập nhật thông tin chương trình khuyến mãi
 * @param machuongtrinh Mã chương trình khuyến mãi cần cập nhật
 * @param data Thông tin cập nhật cho chương trình khuyến mãi
 * @returns Chương trình khuyến mãi sau khi cập nhật
 */
export async function updatePromotion(machuongtrinh: string, data: Partial<CreatePromotionRequest>): Promise<KhuyenMai | null> {
  try {    console.log(`Updating promotion ${machuongtrinh} with data:`, data);
    const response = await axiosClient.put(`/promotion/updatePromotion/${machuongtrinh}`, data);
    
    console.log('Update promotion response:', response);
    
    if (response.data && response.status >= 200 && response.status < 300) {
      message.success('Cập nhật chương trình khuyến mãi thành công!');
      
      const responseData = response.data.data || response.data;
      return responseData as KhuyenMai;
    }
    
    return null;
  } catch (err: any) {
    console.error('Error updating promotion:', err);
    
    const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật chương trình khuyến mãi';
    message.error(errorMessage);
    
    throw err;
  }
}

/**
 * Xóa chương trình khuyến mãi
 * @param machuongtrinh Mã chương trình khuyến mãi cần xóa
 * @returns true nếu xóa thành công, false nếu thất bại
 */
export async function deletePromotion(machuongtrinh: string): Promise<boolean> {
  try {    console.log(`Deleting promotion with code: ${machuongtrinh}`);
    const response = await axiosClient.delete(`/promotion/deletePromotion/${machuongtrinh}`);
    
    console.log('Delete promotion response:', response);
    
    if (response.status >= 200 && response.status < 300) {
      message.success('Xóa chương trình khuyến mãi thành công!');
      return true;
    }
    
    return false;
  } catch (err: any) {
    console.error('Error deleting promotion:', err);
    
    const errorMessage = err.response?.data?.message || 'Lỗi khi xóa chương trình khuyến mãi';
    message.error(errorMessage);
    
    throw err;
  }
}

/**
 * Áp dụng chương trình khuyến mãi cho danh sách sản phẩm
 * @param machuongtrinh Mã chương trình khuyến mãi cần áp dụng
 * @param data Danh sách ID sản phẩm cần áp dụng khuyến mãi
 * @returns true nếu áp dụng thành công, false nếu thất bại
 */
export async function applyPromotionToProducts(machuongtrinh: string, data: ApplyPromotionRequest): Promise<boolean> {
  try {    console.log(`Applying promotion ${machuongtrinh} to products:`, data.productIds);
    const response = await axiosClient.post(`/promotion/apply/${machuongtrinh}`, data);
    
    console.log('Apply promotion response:', response);
    
    if (response.status >= 200 && response.status < 300) {
      message.success('Áp dụng chương trình khuyến mãi thành công!');
      return true;
    }
    
    return false;
  } catch (err: any) {
    console.error('Error applying promotion to products:', err);
    
    // Hiển thị lỗi chi tiết từ backend nếu có
    const serverErrorMessage = err.response?.data?.message;
    const errorMessage = `Lỗi khi áp dụng chương trình khuyến mãi: ${serverErrorMessage || err.message}`;
    message.error(errorMessage);
    
    throw err;
  }
}

/**
 * Xóa tất cả sản phẩm khỏi một chương trình khuyến mãi
 * @param machuongtrinh Mã chương trình khuyến mãi
 * @param data Danh sách ID sản phẩm cần xóa khỏi chương trình khuyến mãi
 * @returns true nếu xóa thành công, false nếu thất bại
 */
export async function removeAllPromotionFromProducts(machuongtrinh: string, data: ApplyPromotionRequest): Promise<boolean> {
  try {
    console.log(`Removing products from promotion ${machuongtrinh}:`, data.productIds);
    const response = await axiosClient.delete(`/promotion/removeAllPromotionFromProducts/${machuongtrinh}`, { data });
    
    console.log('Remove products from promotion response:', response);
    
    if (response.status >= 200 && response.status < 300) {
      message.success('Xóa sản phẩm khỏi chương trình khuyến mãi thành công!');
      return true;
    }
    
    return false;
  } catch (err: any) {
    console.error('Error removing products from promotion:', err);
    
    // Hiển thị lỗi chi tiết từ backend nếu có
    const serverErrorMessage = err.response?.data?.message;
    const errorMessage = `Lỗi khi xóa sản phẩm khỏi chương trình khuyến mãi: ${serverErrorMessage || err.message}`;
    message.error(errorMessage);
    
    throw err;
  }
}

/**
 * Lấy tất cả sản phẩm thuộc về một chương trình khuyến mãi cụ thể
 * @param machuongtrinh Mã chương trình khuyến mãi cần lấy danh sách sản phẩm
 * @returns Danh sách các sản phẩm thuộc chương trình khuyến mãi
 */
export async function findAllProductByPromotion(machuongtrinh: string): Promise<Product[]> {
  try {
    console.log(`Fetching all products for promotion: ${machuongtrinh}`);
    const response = await axiosClient.get(`/promotion/findAllProductByPromotion/${machuongtrinh}`);
    
    console.log('Find all products by promotion response:', response);
    
    if (response.data && response.status >= 200 && response.status < 300) {
      const data = response.data?.data;
      return Array.isArray(data) ? data : [];
    }
    
    return [];
  } catch (err: any) {
    console.error('Error fetching products by promotion:', err);
    
    const errorMessage = err.response?.data?.message || 'Lỗi khi lấy danh sách sản phẩm theo chương trình khuyến mãi';
    message.error(errorMessage);
    
    return [];
  }

}

/**
 * Xóa một sản phẩm cụ thể khỏi chương trình khuyến mãi
 * @param machuongtrinh Mã chương trình khuyến mãi
 * @param masanpham Mã sản phẩm hoặc ID sản phẩm cần xóa khỏi chương trình khuyến mãi
 * @returns true nếu xóa thành công, false nếu thất bại
 */
export async function deleteProductFromPromotion(machuongtrinh: string, masanpham: string): Promise<boolean> {
  try {
    console.log(`Deleting product ${masanpham} from promotion ${machuongtrinh}`);
    const response = await axiosClient.delete(`/promotion/deleteProductFromPromotion/${machuongtrinh}/${masanpham}`);
    
    console.log('Delete product from promotion response:', response);
    
    if (response.status >= 200 && response.status < 300) {
      message.success('Xóa sản phẩm khỏi chương trình khuyến mãi thành công!');
      return true;
    }
    
    return false;
  } catch (err: any) {
    console.error('Error deleting product from promotion:', err);
    
    // Hiển thị lỗi chi tiết từ backend nếu có
    const serverErrorMessage = err.response?.data?.message;
    const errorMessage = `Lỗi khi xóa sản phẩm khỏi chương trình khuyến mãi: ${serverErrorMessage ?? err.message}`;
    message.error(errorMessage);
    
    throw err;
  }
}

export async function getProductNoPromotion(): Promise<any[]> {
  try {

    const res = await axiosClient.get('/promotion/getProductWithNoPromotion');

    console.log('Get all product no promotions response:', res);
    
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching promotions:', err);
    message.error('Lỗi khi tải danh sách khuyến mãi');
    return [];
  }
}