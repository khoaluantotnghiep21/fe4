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
  };
  anhsanpham: {
    url: string;
    isMain: boolean;
  }[];
  chitietdonvi: {
    dinhluong: number;
    giaban: number;
    donvitinh: {
      donvitinh: string;
    };
  }[];
  chitietthanhphan: {
    hamluong: string;
    thanhphan: {
      tenthanhphan: string;
    };
  }[];
}
