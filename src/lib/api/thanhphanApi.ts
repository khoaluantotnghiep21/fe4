import { message } from 'antd';
import axiosClient from "../axiosClient";
import { ThanhPhan, ChiTietThanhPhan } from '@/types/thanhphan.types';

/**
 * Lấy tất cả thành phần từ API
 * @returns Danh sách các thành phần
 */
export async function getAllIngredient(): Promise<ThanhPhan[]> {
    try {
        const response = await axiosClient.get('/Ingredient/getAllIngredient');
        
        if (response.data?.data) {
            return response.data.data;
        }
        
        return [];
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi lấy danh sách thành phần');
        } else {
            console.error('Error fetching ingredients:', error);
        }
        return [];
    }
}

/**
 * Tạo một thành phần mới
 * @param tenthanhphan Tên của thành phần cần tạo
 * @returns Thông tin thành phần đã tạo hoặc null nếu có lỗi
 */
export async function createIngredient(tenthanhphan: string): Promise<ThanhPhan | null> {
    try {
        const response = await axiosClient.post('/Ingredient/createIngredient', { tenthanhphan });
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Tạo thành phần mới thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error) {
        if (typeof window !== 'undefined') {
            message.error('Lỗi khi tạo thành phần mới');
        } else {
            console.error('Error creating ingredient:', error);
        }
        return null;
    }
}

/**
 * Thêm chi tiết thành phần cho sản phẩm
 * @param masanpham Mã sản phẩm
 * @param mathanhphan Mã thành phần
 * @param hamluong Hàm lượng của thành phần
 * @returns Chi tiết thành phần đã thêm hoặc null nếu có lỗi
 */
export async function addIngredientDetailsForProduct(
    masanpham: string,
    mathanhphan: string,
    hamluong: string
): Promise<ChiTietThanhPhan | null> {
    try {
        // masanpham and mathanhphan as URL params, hamluong as request body DTO
        const response = await axiosClient.post(
            `/IngredientDetails/addIngredientDetailsForProduct/${masanpham}/${mathanhphan}`,
            { hamluong }
        );
        
        if (response.data?.data) {
            if (typeof window !== 'undefined') {
                message.success('Thêm chi tiết thành phần cho sản phẩm thành công');
            }
            return response.data.data;
        }
        
        return null;
    } catch (error: any) {
        console.error('Error adding ingredient details for product:', error);
        
        // Get more detailed error information
        const errorMsg = error.response?.data?.message || 
                        (error.message ? `Lỗi: ${error.message}` : 
                        'Lỗi khi thêm chi tiết thành phần cho sản phẩm');
        
        if (typeof window !== 'undefined') {
            message.error(errorMsg);
        }
        
        return null;
    }
}