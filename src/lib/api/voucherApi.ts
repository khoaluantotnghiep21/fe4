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