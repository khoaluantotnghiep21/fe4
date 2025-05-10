export interface Role {
    id: string;
    name: string;
  }
  
  export interface User {
    id: string;
    hoten: string;
    dienthoai: string;
    matkhau: string;
    email: string;
    gioitinh?: string;
    ngaysinh?: string;
    sodiem?: number;
    diachi?: string;
    roles: Role[];
  }
  
  export interface LoginCredentials {
    dienthoai: string; 
    matkhau: string;
  }
  
  export interface RegisterData {
    hoten: string;
    dienthoai: string;
    matkhau: string;
    email: string;
    gioitinh?: string;
    ngaysinh?: string;
    diachi?: string;
  }