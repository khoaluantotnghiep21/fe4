import { message } from 'antd';
import axiosClient from "../axiosClient";
import { ChiTietDonVi, DonViTinh } from '@/types/donvitinh.types';



/**
 * Lấy tất cả đơn vị tính từ API
 * @returns Danh sách các đơn vị tính
 */
export async function getAllUnit(): Promise<DonViTinh[]> {
    try {
        const response = await axiosClient.get('/Unit/getAllUnit');
        
        if (response.data?.data) {
            return response.data.data;
        }
        
        return [];
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi lấy danh sách đơn vị tính');
        } else {
            console.error('Error fetching units:', error);
        }
        return [];
    }
}

/**
 * Tạo một đơn vị tính mới
 * @param donViTinh Thông tin đơn vị tính cần tạo
 * @returns Đơn vị tính đã tạo hoặc null nếu có lỗi
 */
export async function createUnit(donViTinh: DonViTinh): Promise<DonViTinh | null> {
    try {
        const response = await axiosClient.post('/Unit/createUnit', donViTinh);
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Tạo đơn vị tính thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi tạo đơn vị tính');
        } else {
            console.error('Error creating unit:', error);
        }
        return null;
    }
}

/**
 * Cập nhật thông tin của một đơn vị tính
 * @param madonvitinh Mã đơn vị tính cần cập nhật
 * @param donViTinh Thông tin đơn vị tính mới
 * @returns Đơn vị tính đã cập nhật hoặc null nếu có lỗi
 */
export async function updateUnit(madonvitinh: string, donViTinh: DonViTinh): Promise<DonViTinh | null> {
    try {
        const response = await axiosClient.put(`/Unit/updateUnit/${madonvitinh}`, donViTinh);
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Cập nhật đơn vị tính thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi cập nhật đơn vị tính');
        } else {
            console.error('Error updating unit:', error);
        }
        return null;
    }
}

/**
 * Thêm mối quan hệ giữa sản phẩm và đơn vị tính
 * @param chiTietDonVi Thông tin chi tiết đơn vị tính của sản phẩm
 * @returns Chi tiết đơn vị tính đã thêm hoặc null nếu có lỗi
 */
export async function addProductWithUnit(chiTietDonVi: ChiTietDonVi): Promise<ChiTietDonVi | null> {
    try {
        const response = await axiosClient.post('/unitDetailsController/addProductWithUnit', chiTietDonVi);
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Thêm đơn vị tính cho sản phẩm thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi thêm đơn vị tính cho sản phẩm');
        } else {
            console.error('Error adding unit to product:', error);
        }
        return null;
    }
}

/**
 * Cập nhật mối quan hệ giữa sản phẩm và đơn vị tính
 * @param masanpham Mã sản phẩm cần cập nhật
 * @param madonvitinh Mã đơn vị tính cần cập nhật
 * @param updateData Dữ liệu cập nhật (giaban và dinhluong)
 * @returns Thông tin chi tiết đơn vị tính đã cập nhật hoặc null nếu có lỗi
 */
export async function updateProductWithUnit(
    masanpham: string,
    madonvitinh: string,
    updateData: { giaban?: number; dinhluong?: number }
): Promise<ChiTietDonVi | null> {
    try {
        const response = await axiosClient.put(
            `/unitDetalsController/updateProductWithUnit/${masanpham}/${madonvitinh}`,
            updateData
        );
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Cập nhật thông tin đơn vị tính cho sản phẩm thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi cập nhật thông tin đơn vị tính cho sản phẩm');
        } else {
            console.error('Error updating product-unit relationship:', error);
        }
        return null;
    }
}

