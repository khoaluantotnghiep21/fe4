import axiosClient from '../axiosClient';

export async function getRevenueStats(type: 'day' | 'week' | 'month') {
  const res = await axiosClient.get(`/purchase-order/stats/revenue/${type}`);
  return res.data; 
}

export async function getImportStats(type: 'day' | 'week' | 'month') {
  const res = await axiosClient.get(`/pharmacy-product/stats/import/${type}`);
  return res.data; 
}