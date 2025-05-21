import { DanhMuc } from "@/types/danhmuc.types";
import { message } from 'antd';
import axiosClient from "../axiosClient";

export async function getLoais(): Promise<DanhMuc[]> {
  const res = await axiosClient.get("/category/getAllCategories");
  return res.data.data;
}

export async function getDanhMucByLoai(maloai: string): Promise<DanhMuc[]> {
  try {
    const response = await axiosClient.get(`/category/getDanhMucByLoai/${maloai}`);
    return response.data.data;
  } catch (error) {
    if (typeof window !== 'undefined') {
      message.error('Lỗi khi lấy danh mục theo loại');
    } else {
      console.error('Error fetching danh muc by loai:', error);
    }
    return [];
  }
}

