export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  hoten: string;
  sodienthoai: string;
  matkhau: string;
  email: string;
  gioitinh?: string;
  ngaysinh?: string;
  sodiem?: number;
  diachi?: string;
  roles: string[];
}

export interface LoginCredentials {
  sodienthoai: string;
  matkhau: string;
}

export interface RegisterData {
  hoten: string;
  sodienthoai: string;
  matkhau: string;
  email: string;
  gioitinh?: string;
  ngaysinh?: string;
  diachi?: string;
}
