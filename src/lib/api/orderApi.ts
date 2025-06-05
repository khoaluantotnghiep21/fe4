import { message } from "antd";
import axiosClient from "../axiosClient";

export interface PurchaseOrderDetail {
    masanpham: string;
    soluong: number;
    giaban: number;
    donvitinh: string;
}

export interface CreatePurchaseOrderRequest {
    phuongthucthanhtoan: string;
    hinhthucnhanhang: string;
    mavoucher: string; // Bắt buộc phải có, sử dụng VC00000 làm mặc định
    tongtien: number;
    giamgiatructiep: number;
    thanhtien: number;
    phivanchuyen: number;
    machinhhanh: string;
    details: PurchaseOrderDetail[];
}

export interface CreatePurchaseOrderResponse {
    statusCode: number;
    message: string;
    data: {
        id: string;
        madonhang: string;
        ngaymuahang: string;
        userid: string;
        trangthai: string;
        phuongthucthanhtoan: string;
        hinhthucnhanhang: string;
        mavoucher: string;
        tongtien: number;
        giamgiatructiep: number;
        thanhtien: number;
        phivanchuyen: number;
        machinhanh: string | null;
    };
}

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


export async function getAllOrders(status?: string) {
    const res = await axiosClient.get('/purchase-order/getAllOrders', {
        params: status && status !== 'all' ? { trangthai: status } : {},
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function updateOrderStatus(madonhang: string, trangthai: string) {
    return axiosClient.patch(`/purchase-order/updateStatus/${madonhang}`, { trangthai });
}

export async function createPurchaseOrder(orderData: CreatePurchaseOrderRequest): Promise<CreatePurchaseOrderResponse | null> {
    try {
        const response = await axiosClient.post('/purchase-order/createNewPurchaseOrder', orderData);

        if (response.data && response.data.statusCode == 201) {
            message.success("Đặt hàng thành công!");
            return response.data;
        } else {
            message.error("Đặt hàng thất bại!");
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error creating purchase order:", error);

        if (error.response?.data?.message) {
            message.error(`Lỗi: ${error.response.data.message}`);
        } else {
            message.error("Có lỗi xảy ra khi đặt hàng!");
        }
        return null;
    }
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

export async function getOderByUserId(id: string): Promise<OrderItem[]> {
    try {
        const response = await axiosClient.get(`/purchase-order/getOderByUserId/${id}`);
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