import axiosClient from '../axiosClient';

export async function getAllKhuyenMai() {
  try {
    const res = await axiosClient.get('/promition/getAllPromotion');

    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}