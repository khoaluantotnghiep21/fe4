import { message } from 'antd';
import axiosClient from "../axiosClient";
import { Media } from '@/types/media.types';

/**
 * Upload một hoặc nhiều ảnh cho sản phẩm
 * @param idsanpham ID của sản phẩm
 * @param files Danh sách các file ảnh cần upload
 * @param mainImageIndex Chỉ số của ảnh chính trong danh sách (bắt đầu từ 0)
 * @returns Danh sách các media đã upload
 */
export const uploadProductImages = async (
  idsanpham: string,
  files: File[],
  mainImageIndex: number = 0
): Promise<Media[]> => {
  try {
    if (!files.length) {
      return [];
    }

    const formData = new FormData();
    
    // Thêm tất cả các files vào formData
    files.forEach((file, index) => {
      formData.append('files', file);
      // Đánh dấu ảnh chính
      if (index === mainImageIndex) {
        formData.append('ismain', 'true');
      } else {
        formData.append('ismain', 'false');
      }
    });

    const response = await axiosClient.post(`/media/upload/${idsanpham}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    return response.data || [];
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi upload ảnh sản phẩm';
    if (typeof window !== 'undefined') {
      console.error('Upload error:', error);
    }
    throw new Error(errorMessage);
  }
};

/**
 * Xóa ảnh sản phẩm
 * @param mediaId ID của media cần xóa
 * @returns Kết quả xóa
 */
export const deleteProductImage = async (mediaId: string): Promise<boolean> => {
  try {
    const response = await axiosClient.delete(`/media/${mediaId}`);
    return response.data && response.data.success;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi xóa ảnh sản phẩm';
    if (typeof window !== 'undefined') {
      console.error('Delete media error:', error);
    }
    throw new Error(errorMessage);
  }
};

/**
 * Đặt ảnh chính cho sản phẩm
 * @param mediaId ID của media cần đặt làm ảnh chính
 * @returns Kết quả cập nhật
 */
export const setMainProductImage = async (mediaId: string): Promise<boolean> => {
  try {
    const response = await axiosClient.put(`/media/setmain/${mediaId}`);
    return response.data && response.data.success;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi đặt ảnh chính';
    if (typeof window !== 'undefined') {
      console.error('Set main image error:', error);
    }
    throw new Error(errorMessage);
  }
};

/**
 * Cập nhật ảnh sản phẩm
 * @param mediaId ID của media cần cập nhật
 * @param file File ảnh mới
 * @returns Media đã cập nhật
 */
export const updateProductImage = async (mediaId: string, file: File): Promise<Media> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.put(`/media/update/${mediaId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error('Không thể cập nhật ảnh');
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật ảnh sản phẩm';
    if (typeof window !== 'undefined') {
      console.error('Update media error:', error);
    }
    throw new Error(errorMessage);
  }
};