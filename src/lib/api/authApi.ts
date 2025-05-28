// src/lib/api/authApi.ts

import {
  User,
  LoginCredentials,
  RegisterData,
  UpdateData,
} from "@/types/user.types";
import { message } from "antd";
import axiosClient from "../axiosClient";

// Error state strings for UI components to display with Alert
export const AuthErrors = {
  USER_ROLE_ERROR: "Lỗi khi lấy thông tin quyền người dùng",
  USER_PHONE_ERROR: "Lỗi khi lấy thông tin người dùng theo số điện thoại",
  LOGIN_ERROR: "Lỗi khi đăng nhập",
  LOGOUT_ERROR: "Lỗi khi đăng xuất",
};

export async function getUsers(): Promise<User[]> {
  const response = await axiosClient.get("/users");
  return response.data;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const response = await axiosClient.get(`/users/${id}`);
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}

export async function getUserRole(id: string): Promise<User | null> {
  try {
    const response = await axiosClient.get(`/UserRole/getUserRoles/${id}`);
    console.log("getUserRole response:", response.data);

    // The response has a data array containing role objects
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      // Extract role names from the array of role objects
      const roles = response.data.data.map(
        (role: { namerole: string; hoten: string }) => role.namerole
      );

      // Create a user-like object with the extracted roles
      return {
        id: id,
        roles: roles,
        hoten: response.data.data[0]?.hoten || "",
        sodienthoai: "",
        matkhau: "",
        email: "",
      };
    }

    return null;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy thông tin quyền người dùng");
    } else {
      console.error("Error fetching user role:", error);
    }
    return null;
  }
}

export async function getUserByPhone(dienthoai: string): Promise<User | null> {
  try {
    const response = await axiosClient.get(
      `/identityuser/getUserByPhone/${dienthoai}`
    );
    console.log("getUserByPhone response:", response.data);

    if (response.data && response.data.data) {
      localStorage.setItem(
        "user_information",
        JSON.stringify(response.data.data)
      );
      return response.data.data;
    } else if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy thông tin người dùng theo số điện thoại");
    } else {
      console.error("Error fetching user by phone:", error);
    }
    return null;
  }
}

export async function login(
  credentials: LoginCredentials
): Promise<User | null> {
  try {
    const response = await axiosClient.post("identityuser/signIn", credentials);
    console.log("Login API response:", response.data);

    if (response.data && response.data.data && response.data.data.accessToken) {
      // Store the access token
      localStorage.setItem("access_token", response.data.data.accessToken);

      // Fetch user details with the phone number
      const userData = await getUserByPhone(credentials.sodienthoai);

      if (userData) {
        // If we don't have roles from userData, try fetching them directly
        if (!userData.roles || userData.roles.length === 0) {
          const userRoles = await getUserRole(userData.id);
          if (userRoles && userRoles.roles) {
            userData.roles = userRoles.roles;
          }
        }

        localStorage.setItem("user_information", JSON.stringify(userData));
        return userData;
      }
    } else if (response.data && response.data.accessToken) {
      // Alternative response format
      localStorage.setItem("access_token", response.data.accessToken);

      const userData = await getUserByPhone(credentials.sodienthoai);
      if (userData) {
        localStorage.setItem("user_information", JSON.stringify(userData));
        return userData;
      }
    }
    return null;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi đăng nhập");
    } else {
      console.error("Login error:", error);
    }
    return null;
  }
}

export async function register(data: RegisterData): Promise<User> {
  const response = await axiosClient.post("identityuser/createAccount", data);
  if (response.data.token) {
    localStorage.setItem("access_token", response.data.token);
  }
  return response.data.user;
}

export async function update(data: UpdateData): Promise<User> {
  let user: User = {
    id: "",
    hoten: "",
    sodienthoai: "",
    matkhau: "",
    email: "",
    roles: []
  };
  const response = await axiosClient.put(
    `/identityuser/updateUser/${data.sodienthoai}`,
    data
  );
  if (response.data.statusCode === 200) {
    user = response.data.data;
  }
  localStorage.setItem("user_information", JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  return Promise.resolve();
}
