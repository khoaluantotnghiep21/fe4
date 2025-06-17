import { message } from "antd";
import axiosClient from "../axiosClient";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface PurchaseOrderDetail {
    masanpham: string;
    soluong: number;
    giaban: number;
    donvitinh: string;
}

export interface CreatePurchaseOrderRequest {
    phuongthucthanhtoan: string;
    hinhthucnhanhang: string;
    mavoucher: string | null; 
    tongtien: number;
    giamgiatructiep: number;
    thanhtien: number;
    phivanchuyen: number;
    machinhanh: string;
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
export interface GiaoHangDTO{
    nguoinhan: string;
    sodienthoainguoinhan: string;
    diachinguoinhan: string | null;
    madonhang: string;
    thoigiannhan: string;
}
export interface GiaoHangInterface{
    statusCode: number;
    message: string;
    data: GiaoHangDTO
}

export interface OrderProductItem {
  tensanpham: string;
  donvitinh: string;
  soluong: number;
  giaban: number;
  url: string;
}

export interface OrderItem {
  madonhang: string;
  nguoiban: string;
  machinhanh: string;
  thoigiannhan: string | null;
  thanhtien: number;
  ngaymuahang: string;
  tongtien: number;
  giamgiatructiep: number;
  phivanchuyen: number;
  phuongthucthanhtoan: string;
  mavoucher: string | null;
  hinhthucnhanhang: string;
  sodienthoainguoinhan: string;
  nguoinhan: string;
  ghichu: string;
  trangthai: string;
  sanpham: OrderProductItem[];
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
        console.log('Sending order data to API:', JSON.stringify(orderData, null, 2));
        const response = await axiosClient.post('/purchase-order/createNewPurchaseOrder', orderData);
        console.log('API response received:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.statusCode == 201) {
            message.success("Đặt hàng thành công!");
            return response.data;
        } else {
            console.error("API returned error:", response.data);
            message.error(response.data?.message ?? "Đặt hàng thất bại!");
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error creating purchase order:", error);
        console.error("Error details:", error.response?.data ?? error.message);

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
        if (response.data?.data) {
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
        if (response.data?.data) {
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

export async function createVnpayOrder(madonhang: string): Promise<string> {
    try {
        const response = await axiosClient.get(`/purchase-order/create-payment-url/web/${madonhang}`);
        if (response.data?.data) {
            return response.data.data.data.url;
        }
        return "";
    } catch (error) {
        if (typeof window !== "undefined") {
            message.error("Lỗi khi lấy danh sách đơn hàng");
        } else {
            console.error("Error fetching user orders:", error);
        }
        return  "";
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

export async function getOderByMaDonHang(madonhang: string): Promise<OrderItem[]> {
    try {
        const response = await axiosClient.get(`/purchase-order/getOrderByMadonhang/${madonhang}`);
        if (response.data?.data) {
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

export async function createGiaoHang(orderData: GiaoHangDTO): Promise<GiaoHangInterface | null> {
    try {
        const response = await axiosClient.post('/delivery/create', orderData);

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

export async function getOderByMaChiNhanh(machinhanh: string): Promise<OrderItem[]> {
    try {
        const response = await axiosClient.get(`/purchase-order/getOrderByMaChiNhanh/${machinhanh}`);
        if (response.data?.data) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        if (typeof window !== "undefined") {
            message.error("Lỗi khi lấy danh sách đơn hàng của chi nhánh");
        } else {
            console.error("Error fetching user orders:", error);
        }
        return [];
    }
}

/**
 * Generates and downloads an invoice PDF for a specific order
 * @param madonhang Order ID to generate invoice for
 * @returns Promise resolving to boolean indicating success/failure
 */
export async function generateInvoice(madonhang: string): Promise<boolean> {
    try {
        console.log("Generating invoice for order:", madonhang);
        
    
        
        // Construct URL - use axios base URL to ensure consistency
        const baseURL = axiosClient.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL;
        const invoiceURL = `${baseURL}/purchase-order/generate-invoice/${madonhang}`;
        
        console.log("Requesting invoice from:", invoiceURL);
        
        // Using axios instead of fetch for better error handling
        const response = await axiosClient.get(`/purchase-order/generate-invoice/${madonhang}`, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/pdf,*/*'
            }
        });
        
        // Check response
        if (response.status !== 200) {
            throw new Error(`Error ${response.status}: Invalid response`);
        }
        
        const contentType = response.headers['content-type'] || 'application/pdf';
        console.log("Response received, content type:", contentType);
        
        // Get the blob from the response
        const blob = new Blob([response.data], { type: contentType });
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        
        // Set the filename based on the order ID
        link.download = `hoa-don-${madonhang}.pdf`;
        
        console.log("Initiating download...");
        
        // Append to the document, click it, and clean up
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        message.success("Tải xuống hoá đơn thành công");
        return true;
    } catch (error: any) {
        // Enhanced error handling
        console.error("Lỗi khi tạo hoặc tải xuống hoá đơn:", error);
        
        // Check if the error has response data as blob
        if (error.response && error.response.data instanceof Blob) {
            // Try to read the blob as text to get error message
            try {
                const text = await error.response.data.text();
                console.error("Error response content:", text);
                
                // Try to parse as JSON if possible
                try {
                    const json = JSON.parse(text);
                    message.error(json.message || "Không thể tải xuống hoá đơn");
                } catch (jsonError) {
                    message.error("Không thể tạo hoá đơn: " + text.substring(0, 100));
                }
            } catch (blobError) {
                message.error("Không thể tạo hoá đơn: Lỗi không xác định");
            }
        } else {
            message.error("Không thể tạo hoá đơn: " + (error.message || "Lỗi không xác định"));
        }
        
        return false;
    }
}