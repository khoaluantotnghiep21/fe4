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

/**
 * Interface cho dữ liệu tạo hoặc cập nhật danh mục
 */
export interface CategoryRequest {
  tendanhmuc: string;
  maloai: string;
}

/**
 * Tạo mới một danh mục
 * @param data Thông tin danh mục cần tạo mới
 * @returns Danh mục đã được tạo
 */
export async function createCategory(
  data: CategoryRequest
): Promise<DanhMuc | null> {
  try {
    console.log("Creating new category with data:", data);
    const response = await axiosClient.post("/category/createCategory", data);

    console.log("Create category response:", response);

    if (response.data && response.status >= 200 && response.status < 300) {
      message.success("Tạo danh mục thành công!");
      return response.data.data ?? response.data;
    }

    return null;
  } catch (err: any) {
    console.error("Error creating category:", err);

    const errorMessage = err.response?.data?.message ?? "Lỗi khi tạo danh mục";
    message.error(errorMessage);

    throw err;
  }
}

/**
 * Cập nhật thông tin danh mục
 * @param madanhmuc Mã danh mục cần cập nhật
 * @param data Thông tin cập nhật cho danh mục
 * @returns Danh mục sau khi cập nhật
 */
export async function updateCategory(
  madanhmuc: string,
  data: CategoryRequest
): Promise<DanhMuc | null> {
  try {
    console.log(`Updating category ${madanhmuc} with data:`, data);
    const response = await axiosClient.put(
      `/category/updateCategory/${madanhmuc}`,
      data
    );

    console.log("Update category response:", response);

    if (response.data && response.status >= 200 && response.status < 300) {
      message.success("Cập nhật danh mục thành công!");
      return response.data.data ?? response.data;
    }

    return null;
  } catch (err: any) {
    console.error("Error updating category:", err);

    const errorMessage = err.response?.data?.message ?? "Lỗi khi cập nhật danh mục";
    message.error(errorMessage);

    throw err;
  }
}

/**
 * Xóa danh mục
 * @param madanhmuc Mã danh mục cần xóa
 * @returns true nếu xóa thành công, false nếu thất bại
 */
// export async function deleteCategory(madanhmuc: string): Promise<boolean> {
//   try {
//     console.log(`Attempting to delete category with code: ${madanhmuc}`);
//     // Log the exact URL and method being called
//     const url = `/category/deleteCategory/${madanhmuc}`;
//     console.log(`DELETE request to: ${url}`);
    
//     // First try with fetch API directly
//     try {
//       const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
//       const fetchUrl = `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
//       console.log(`Trying direct fetch to: ${fetchUrl}`);
      
//       const token = typeof localStorage !== 'undefined' ? localStorage.getItem("access_token") || '' : '';
      
//       const response = await fetch(fetchUrl, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': token ? `Bearer ${token}` : ''
//         }
//       });
      
//       console.log("Direct fetch response status:", response.status);
      
//       if (response.ok) {
//         message.success("Xóa danh mục thành công!");
//         return true;
//       } else {
//         const errorData = await response.json().catch(() => ({}));
//         console.error("Fetch API error:", errorData);
//         message.error(`Lỗi: ${errorData?.message || response.statusText}`);
//         return false;
//       }
//     } catch (fetchError) {
//       console.error("Error with fetch approach:", fetchError);
      
//       // If fetch fails, try with axios as fallback
//       console.log("Falling back to axios...");
//       const response = await axiosClient.delete(url);
      
//       console.log("Axios delete category response:", response);
      
//       if (response.status >= 200 && response.status < 300) {
//         message.success("Xóa danh mục thành công!");
//         return true;
//       } else {
//         console.log("Delete failed but did not throw an error. Status:", response.status);
//         message.error(`Lỗi khi xóa danh mục: Mã trạng thái ${response.status}`);
//         return false;
//       }
//     }
//   } catch (err: any) {
//     console.error("Error deleting category:", err);
//     console.error("Error details:", {
//       message: err.message,
//       url: err.config?.url,
//       method: err.config?.method,
//       response: err.response,
//       data: err.response?.data
//     });
    
//     const errorMessage = err.response?.data?.message ?? "Lỗi khi xóa danh mục";
//     message.error(errorMessage);
    
//     // Return false instead of throwing the error
//     return false;
//   }
// }
export async function deleteCategory(madanhmuc: string): Promise<boolean> {
  try {
    console.log(`Calling API to delete category with masanpham: ${madanhmuc}`);
    const response = await axiosClient.delete(`/category/deleteCategory/${madanhmuc}`);

    console.log('Delete API response:', response);

    // Kiểm tra kết quả trả về từ API
    if (response.data && response.data.success) {
      console.log('API indicated success');
      return true;
    }

    // Nếu không có response.data.success, kiểm tra mã trạng thái
    const success = response.status === 200 || response.status === 204;
    console.log(`API status code ${response.status}, success: ${success}`);
    return success;  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Lỗi khi xóa danh mục';
    
    console.error('Delete API error details:', {
      message: errorMessage,
      status: err.response?.status,
      data: err.response?.data,
      error: err.message
    });

    if (typeof window !== "undefined") {
      message.error(errorMessage);
    }
    
    // Luôn throw lỗi để component xử lý
    throw err;

    throw err; // Ném lỗi để hàm gọi có thể bắt và xử lý
  }
}