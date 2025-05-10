// src/lib/api/authApi.ts

import { User, Role, LoginCredentials, RegisterData } from '@/types/user.types';

// Mock roles
const mockRoles: Role[] = [
  { id: '1', name: 'Admin' },
  { id: '2', name: 'Customer' },
  { id: '3', name: 'Employee' },
];

// Mock users
const mockUsers: User[] = [
  {
    id: '1',
    hoten: 'Nguyen Van A',
    dienthoai: '0909123456',
    matkhau: 'password123',
    email: 'nguyenvana@example.com',
    gioitinh: 'Nam',
    ngaysinh: '1990-01-01',
    sodiem: 150,
    diachi: '123 Duong ABC, Quan 1, TP.HCM',
    roles: [mockRoles[0]], 
  },
  {
    id: '2',
    hoten: 'Tran Thi B',
    dienthoai: '0918123456',
    matkhau: 'password456',
    email: 'tranthib@example.com',
    gioitinh: 'Nu',
    ngaysinh: '1995-05-15',
    sodiem: 80,
    diachi: '456 Duong DEF, Quan 3, TP.HCM',
    roles: [mockRoles[1]], // Customer
  },
];

// Simulate fetching all users
export async function getUsers(): Promise<User[]> {
  return mockUsers;
}

// Simulate fetching a user by ID
export async function getUserById(id: string): Promise<User | null> {
  return mockUsers.find((user) => user.id === id) || null;
}

// Simulate fetching a user by phone number (for login)
export async function getUserByPhone(dienthoai: string): Promise<User | null> {
  return mockUsers.find((user) => user.dienthoai === dienthoai) || null;
}

// Simulate login using phone number
export async function login(credentials: LoginCredentials): Promise<User | null> {
  const user = await getUserByPhone(credentials.dienthoai);
  if (user && user.matkhau === credentials.matkhau) {
    return user;
  }
  return null;
}

export async function register(data: RegisterData): Promise<User> {
  const newUser: User = {
    id: String(mockUsers.length + 1),
    hoten: data.hoten,
    dienthoai: data.dienthoai,
    matkhau: data.matkhau,
    email: data.email,
    gioitinh: data.gioitinh,
    ngaysinh: data.ngaysinh,
    sodiem: 0,
    diachi: data.diachi,
    roles: [mockRoles[1]], 
  };
  mockUsers.push(newUser);
  return newUser;
}