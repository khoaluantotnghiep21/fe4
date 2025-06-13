export interface Product {
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
  mathuonghieu: string;
  madanhmuc: string;
  machuongtrinh: string;
  danhmuc: {
    tendanhmuc: string;
    slug: string;
  };
  thuonghieu: {
    tenthuonghieu: string;
  };
  khuyenmai: {
    tenchuongtrinh: string;
    giatrikhuyenmai?: number;
  };
  anhsanpham: {
    url: string;
    ismain: boolean;
  }[];  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    giabanSauKhuyenMai?: number;
    donvitinh: {
      donvitinh: string;
    };
  }[];  chitietthanhphan: {
    hamluong: string;
    thanhphan: {
      tenthanhphan: string;
    };  }[];
  // Pharmacy-specific properties
  soluong?: number;
  manhaphang?: string;
  ngaynhap?: string;
}

export interface UpdateProductRequest {
  tensanpham?: string;
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
  mathuonghieu?: string;
  madanhmuc?: string;
  machuongtrinh?: string;
}

