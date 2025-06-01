import { DanhMuc } from "@/types/danhmuc.types";
import { message } from "antd";
import axiosClient from "../axiosClient";

export async function getLoais(): Promise<DanhMuc[]> {
  const res = await axiosClient.get("/category/getAllCategories");
  return res.data.data;
}

export async function getDanhMucByLoai(maloai: string): Promise<DanhMuc[]> {
  try {
    const response = await axiosClient.get(
      `/category/getDanhMucByLoai/${maloai}`
    );
    return response.data.data;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy danh mục theo loại");
    } else {
      console.error("Error fetching danh muc by loai:", error);
    }
    return [];
  }
}

export async function getAllDanhMuc(): Promise<DanhMuc[]> {
  try {
    const response = await axiosClient.get("/category/getAllCategories");
    return response.data.data;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy tất cả danh mục");
    } else {
      console.error("Error fetching all categories:", error);
    }
    return [];
  }
}

export async function getDanhMucBySlug(slug: string): Promise<DanhMuc | null> {
  try {
    // First get all categories
    const allDanhMuc = await getAllDanhMuc();

    // Find the category with matching slug
    const danhMuc = allDanhMuc.find((dm) => dm.slug === slug);

    if (!danhMuc) {
      return null;
    }

    return danhMuc;
  } catch (error) {
    if (typeof window !== "undefined") {
      message.error("Lỗi khi lấy danh mục theo slug");
    } else {
      console.error("Error fetching category by slug:", error);
    }
    return null;
  }
}
