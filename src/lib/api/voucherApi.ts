import axiosClient from '../axiosClient';
import { message } from 'antd';
import { Voucher } from '@/types/voucher.types';
import { Product } from '@/types/product.types';

export interface CreateVoucherRequest {
  mavoucher: string;
  loaivoucher: boolean;
  soluong: number;
  mota: string;
  hansudung: string;
  giatri: number;
}

export async function getAllVouchers(): Promise<Voucher[]> {
  try {
    const res = await axiosClient.get('voucher/getAllVoucher');
    console.log('Get all vouchers response:', res);
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching vouchers:', err);
    message.error('Lỗi khi tải danh sách voucher');
    return [];
  }
}

export async function createNewVoucher(data: CreateVoucherRequest): Promise<Voucher | null> {
  try {    console.log('Creating new voucher with data:', data);
    const response = await axiosClient.post('/voucher/createNewVoucher', data);

    console.log('Create voucher response:', response);

    // Kiểm tra kết quả trả về từ API
    if (response.data && response.status >= 200 && response.status < 300) {
      // Hiển thị thông báo thành công
      message.success('Tạo voucher thành công!');

      // Trả về dữ liệu đã được xử lý từ API
      const responseData = response.data.data || response.data;
      return responseData as Voucher;
    }
    
    return null;
  } catch (err: any) {
    console.error('Error creating voucher:', err);

    // Hiển thị thông báo lỗi
    const errorMessage = err.response?.data?.message || 'Lỗi khi tạo voucher';
    message.error(errorMessage);
    
    throw err;
  }
}

export async function updateVoucher(mavoucher: string, data: Partial<CreateVoucherRequest>): Promise<Voucher | null> {
  try {    console.log(`Updating voucher ${mavoucher} with data:`, data);
    const response = await axiosClient.put(`/voucher/updateVoucher/${mavoucher}`, data);

    console.log('Update voucher response:', response);

    if (response.data && response.status >= 200 && response.status < 300) {
      message.success('Cập nhật voucher thành công!');

      const responseData = response.data.data || response.data;
      return responseData as Voucher;
    }
    
    return null;
  } catch (err: any) {
    console.error('Error updating voucher:', err);

    const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật voucher';
    message.error(errorMessage);
    
    throw err;
  }
}

export async function deleteVoucher(mavoucher: string): Promise<boolean> {
  try {
    console.log(`Deleting voucher with code: ${mavoucher}`);
    const response = await axiosClient.delete(`/voucher/deleteVoucher/${mavoucher}`);

    console.log('Delete voucher response:', response);

    if (response.status >= 200 && response.status < 300) {
      message.success('Xóa voucher thành công!');
      return true;
    }
    
    return false;
  } catch (err: any) {
    console.error('Error deleting voucher:', err);

    const errorMessage = err.response?.data?.message || 'Lỗi khi xóa voucher';
    message.error(errorMessage);
    
    throw err;
  }
}