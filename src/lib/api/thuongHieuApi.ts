import axiosClient from '../axiosClient';

export async function getAllThuongHieu() {
    try {
        const res = await axiosClient.get('/brand/getAllBrands');
        const data = res.data?.data;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        return [];
    }
}