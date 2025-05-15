// src/lib/api/authApi.ts

import { User, LoginCredentials, RegisterData } from "@/types/user.types";
import axiosClient from "../axiosClient";

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
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
}


export async function getUserByPhone(dienthoai: string): Promise<User | null> {
  try {
    const response = await axiosClient.get(
      `/identityuser/getUserByPhone/${dienthoai}`
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by phone:", error);
    return null;
  }
}

export async function login(
  credentials: LoginCredentials
): Promise<User | null> {
  try {
    const response = await axiosClient.post("identityuser/signIn", credentials);

    if (response.data && response.data.data && response.data.data.accessToken) {
      // Store the access token
      localStorage.setItem("access_token", response.data.data.accessToken);

      // Fetch user details with the phone number
      const userData = await getUserByPhone(credentials.sodienthoai);

      if (userData) {
        localStorage.setItem("user_information", JSON.stringify(userData));
        return userData;
      }
    }
    return null;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function register(data: RegisterData): Promise<User> {
  const response = await axiosClient.post("/auth/register", data);
  if (response.data.token) {
    localStorage.setItem("access_token", response.data.token);
  }
  return response.data.user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  return Promise.resolve();
}
