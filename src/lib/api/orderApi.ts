import { message } from "antd";
import axiosClient from "../axiosClient";

export interface OrderItem {
    id: string;
    masanpham: string;
    tensanpham: string;
    soluong: number;
    dongia: number;
    trangthai: string;
    ngaydat: string;
    madonhang: string;
    tongtien: number;
}

export async function getUserOrders(phoneNumber: string): Promise<OrderItem[]> {
    try {
        const response = await axiosClient.get(`/order/getUserOrders/${phoneNumber}`);
        if (response.data && response.data.data) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        if (typeof window !== "undefined") {
            message.error("Lỗi khi lấy danh sách đơn hàng");
        } else {
            console.error("Error fetching user orders:", error);
        }
        return [];
    }
}

export async function cancelOrder(orderId: string): Promise<boolean> {
    try {
        const response = await axiosClient.put(`/order/cancelOrder/${orderId}`);
        if (response.data && response.data.statusCode === 200) {
            message.success("Hủy đơn hàng thành công");
            return true;
        }
        return false;
    } catch (error) {
        if (typeof window !== "undefined") {
            message.error("Lỗi khi hủy đơn hàng");
        } else {
            console.error("Error canceling order:", error);
        }
        return false;
    }
} 