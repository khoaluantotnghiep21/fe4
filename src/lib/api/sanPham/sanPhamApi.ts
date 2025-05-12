import axiosClient from '@/lib/axiosClient';


interface Product {
  id: string;
  masanpham: string;
  tensanpham: string;
  slug: string;
  dangbaoche: string;
  congdung: string;
  chidinh: string;
  chongchidinh: string;
  thuockedon: boolean;
  motangan: string;
  doituongsudung: string;
  luuy: string;
  ngaysanxuat: string;
  hansudung: number;
  gianhap: number;
}

interface GlobalResponse<T> {
  responseData: T[];
  message: string;
  success: boolean;
  violations: unknown | null;
  timestamp: string;
  path: string;
}

class SanphamService {
  async getAll(params: {
    masanpham?: string;
    tensanpham?: string;
    slug?: string;
    dangbaoche?: string;
    congdung?: string;
    chidinh?: string;
    chongchidinh?: string;
    thuockedon?: boolean;
    motangan?: string;
    doituongsudung?: string;
    luuy?: string;
    ngaysanxuat?: string;
    hansudung?: number;
    gianhap?: number;
    page?: number;
    take?: number;
  } = {}): Promise<GlobalResponse<Product>> {
    const response = await axiosClient.get<GlobalResponse<Product>>('sanpham/search', {
      params: {
        page: 1,
        take: 10,
        ...params
      }
    });
    return response.data;
  }

  // Placeholder for future methods like create, update, delete
}

export { SanphamService };
