// src/lib/api/userService.ts

import axiosClient from "../axiosClient";
import { message } from "antd";

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

export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await axiosClient.get("/identityuser/all");
        const usersArray = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data.data)
                ? response.data.data
                : [];
        return usersArray;
    } catch (error) {
        message.error("Lỗi khi lấy danh sách người dùng!");
        return [];
    }
};

export const getUserRole = async (id: string): Promise<{ roles: string[] } | null> => {
    try {
        const response = await axiosClient.get(`/UserRole/getUserRoles/${id}`);
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            const roles = response.data.data.map((role: { namerole: string }) => role.namerole);
            return { roles };
        }
        return null;
    } catch (error) {
        message.error("Lỗi khi lấy thông tin vai trò!");
        return null;
    }
};

export const register = async (data: Partial<User>): Promise<User> => {
    const response = await axiosClient.post("identityuser/createAccount", data);
    if (response.data.token) {
        localStorage.setItem("access_token", response.data.token);
    }
    return response.data.user;
};

export const update = async (data: Partial<User>): Promise<User> => {
    const response = await axiosClient.put(`/identityuser/updateUser/${data.sodienthoai}`, data);
    if (response.data.statusCode === 200) {
        return response.data.data;
    }
    throw new Error("Cập nhật thất bại!");
};

export const deleteUser = async (id: string): Promise<void> => {
    await axiosClient.delete(`/identityuser/${id}`);
};

export const changePassword = async (phone: string, oldPassword: string, newPassword: string): Promise<void> => {
    await axiosClient.put(`/identityuser/change-password/${phone}`, { oldPassword, newPassword });
};

export const getAllRoles = async (): Promise<{ id: string; namerole: string }[]> => {
    try {
        const response = await axiosClient.get("/UserRole/all");
        return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
        message.error("Lỗi khi lấy danh sách vai trò!");
        return [];
    }
};

export const assignRole = async (userid: string, roleid: string): Promise<void> => {
    await axiosClient.post("/UserRole/createUserRole", { userid, roleid });
};