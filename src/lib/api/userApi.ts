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
        console.log('getAllRoles: Calling API...');
        const response = await axiosClient.get("/role/getAllRoles");
        console.log('getAllRoles: API response:', response);

        // Kiểm tra cấu trúc response
        if (!response || !response.data) {
            console.error('getAllRoles: Invalid API response structure');
            return [];
        }

        // Kiểm tra và xử lý dữ liệu
        let roles: { id: string; namerole: string }[] = [];

        if (Array.isArray(response.data)) {
            console.log('getAllRoles: Data is directly an array');
            roles = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
            console.log('getAllRoles: Data is in data.data');
            roles = response.data.data;
        } else {
            console.error('getAllRoles: Unexpected data structure:', response.data);
        }

        console.log('getAllRoles: Processed roles:', roles);
        return roles;
    } catch (error) {
        console.error('getAllRoles: Error:', error);
        message.error("Lỗi khi lấy danh sách vai trò!");
        return [];
    }
};

export const createRole = async (userid: string, roleid: string): Promise<void> => {
    await axiosClient.post("/UserRole/createUserRole", { userid, roleid });
};

/**
 * Gán nhiều vai trò cho một người dùng
 * @param userid ID của người dùng cần gán vai trò
 * @param roleids Danh sách ID các vai trò cần gán cho người dùng
 * @returns 
 */
export const assignRoles = async (userid: string, roleids: string[]): Promise<boolean> => {
    try {
        const response = await axiosClient.post("/UserRole/assignRoles", {
            userid: userid,
            roleids: roleids
        });

        if (response.data && response.data.statusCode === 200) {
            message.success("Gán vai trò thành công!");
            return true;
        } else {
            message.error("Gán vai trò thất bại!");
            return false;
        }
    } catch (error) {
        console.error("Lỗi khi gán vai trò:", error);
        message.error("Lỗi khi gán vai trò cho người dùng!");
        return false;
    }
};

export const updateWithRole = async (
    data: Partial<User> & { roleids: string[] }
): Promise<User> => {
    const response = await axiosClient.put(
        `/UserInfo/updateUserInfo/${data.id}`,
        {
            hoten: data.hoten,
            email: data.email,
            gioitinh: data.gioitinh,
            ngaysinh: data.ngaysinh,
            sodiem: data.sodiem,
            diachi: data.diachi,
            roleids: data.roleids,
        }
    );
    if (response.data && response.data.statusCode === 200) {
        return response.data.data;
    }
    throw new Error("Cập nhật thất bại!");
};

