import { Loai } from "@/types/loai.types";
import { message } from 'antd';
import axiosClient from "../axiosClient";

export async function getLoais(): Promise<Loai[]> {
  try {
    const response = await axiosClient.get("/loai/getLoai");
    return response.data.data;
  } catch (error) {
    if (typeof window !== 'undefined') {
      message.error('Lỗi khi lấy danh sách loại');
    } else {
      console.error('Error fetching loai:', error);
    }
    return [];
  }
}
