"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { findOne, Pharmacy } from "@/lib/api/pharmacyService";
import { getOderByMaDonHang, OrderItem } from "@/lib/api/orderApi";
import { message } from "antd";
import dayjs from "dayjs";

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [orderDetails, setOrderDetails] = useState({
    orderId: "",
    orderCode: "",
    total: 0,
    status: "",
    paymentMethod: "",
    shippingMethod: "",
    date: "",
    discount: 0,
    ngayGiaoHang: "",
    gioGiaoHang: "",
    maChiNhanh: "",
    tenNguoiNhan: "",
    soDienThoai: "",
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy các tham số từ URL và cập nhật orderDetails
  useEffect(() => {
    const orderId = searchParams.get("orderId") || "";
    const orderCode = searchParams.get("orderCode") || "";
    const total = parseInt(searchParams.get("thanhTien") || "0", 10);
    const status = decodeURIComponent(searchParams.get("status") || "");
    const paymentMethod = decodeURIComponent(searchParams.get("paymentMethod") || "");
    const shippingMethod = decodeURIComponent(searchParams.get("hinhThucNhanHang") || "");
    const maChiNhanh = decodeURIComponent(searchParams.get("maChiNhanh") || "");
    const date = searchParams.get("date") || "";
    const discount = parseInt(searchParams.get("giamGiaTrucTiep") || "0", 10);
    const ngayGiaoHang = decodeURIComponent(searchParams.get("ngayGiaoHang") || "");
    const gioGiaoHang = decodeURIComponent(searchParams.get("gioGiaoHang") || "");
    const tenNguoiNhan = decodeURIComponent(searchParams.get("tenNguoiNhan") || "");
    const soDienThoai = decodeURIComponent(searchParams.get("soDienThoai") || "");

    setOrderDetails({
      orderId,
      orderCode,
      total,
      status,
      paymentMethod,
      shippingMethod,
      date,
      discount,
      ngayGiaoHang,
      gioGiaoHang,
      maChiNhanh,
      tenNguoiNhan,
      soDienThoai,
    });
  }, [searchParams]);

  // Lấy chi tiết đơn hàng và thông tin nhà thuốc
  useEffect(() => {
    // Kiểm tra searchParams có sẵn không
    if (!searchParams) {
      setError("Không thể đọc tham số URL. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    // Sửa thành maDonHang để khớp với URL
    const madonhang = searchParams.get("maDonHang");
    if (!madonhang) {
      setError("Không tìm thấy mã đơn hàng trong URL.");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getOderByMaDonHang(madonhang);
        if (!data || data.length === 0) {
          throw new Error("Không tìm thấy chi tiết đơn hàng.");
        }

        setOrderItems(data);

        if (data[0]?.machinhanh) {
          const pharmacyData = await findOne(data[0].machinhanh);
          setPharmacy(pharmacyData);
        }
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams]);

  // Hàm reload trang
  const handleReload = () => {
    window.location.reload();
  };

  // Hàm sao chép mã đơn hàng
  const copyOrderCode = () => {
    const orderCode = orderItems[0]?.madonhang;
    if (orderCode) {
      navigator.clipboard
        .writeText(orderCode)
        .then(() => {
          message.success("Đã sao chép mã đơn hàng vào bộ nhớ tạm");
        })
        .catch((error) => {
          console.error("Không thể sao chép mã đơn hàng:", error);
          message.error("Không thể sao chép mã đơn hàng");
        });
    }
  };

  // Xử lý trạng thái tải và lỗi
  if (loading) {
    return <div className="max-w-5xl mx-auto py-6 px-4">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 text-red-600">
        {error}
        <button
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleReload}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const statusClass =
    orderItems[0]?.trangthai === "Đã xác nhận"
      ? "bg-green-100 text-green-700"
      : orderItems[0]?.trangthai === "Đang chờ xác nhận"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="text-lg font-semibold mb-4 flex justify-between items-center">
        <div>
          Đơn hàng{" "}
          {orderItems[0]?.ngaymuahang
            ? new Date(orderItems[0]?.ngaymuahang).toLocaleDateString("vi-VN")
            : "Lỗi"}{" "}
          ·
          <span
            className="text-blue-600 ml-1 cursor-pointer"
            onClick={copyOrderCode}
          >
            #{orderItems[0]?.madonhang} · Sao chép
          </span>
        </div>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          onClick={handleReload}
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Section */}
        <div className="col-span-2 bg-white p-4 rounded-md shadow border">
          <div className="mb-4">
            <p className="font-medium text-gray-700">Dự kiến nhận hàng</p>
            <p className="text-lg font-semibold text-black">
              Ngày {dayjs(orderItems[0]?.thoigiandukien).format("DD/MM/YYYY")}
            </p>
            <p className="text-gray-600">
              Đơn hàng đang được xử lý tại nhà thuốc: {pharmacy?.diachicuthe}{" "}
              {pharmacy?.tenduong} {pharmacy?.quan}{" "}
              {pharmacy?.thanhpho || "Nhà thuốc Long Châu"}.
            </p>
          </div>

          <div className="border-t pt-4 space-y-2 pb-1">
            <p className="font-medium">Thông tin người nhận</p>
            <p className="text-black">
              {orderItems[0]?.nguoinhan || "Khách hàng ẩn danh"}
            </p>
            <p className="text-gray-600">
              {orderItems[0]?.sodienthoainguoinhan || "Số điện thoại không có"}
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="font-medium">Nhận hàng tại</p>
            {orderItems[0]?.machinhanh !== "CN000000" ? (
              <p className="text-black">
                {pharmacy?.diachicuthe} {pharmacy?.tenduong} {pharmacy?.quan}{" "}
                {pharmacy?.thanhpho || "..."}
              </p>
            ) : (
              <p className="text-gray-500">
                {orderItems[0]?.diachinguoinhan || "Lỗi"}
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white p-4 rounded-md shadow border">
          <p className="text-lg font-semibold mb-4">Thông tin thanh toán</p>
          <div className="flex justify-between mb-2">
            <span>Tổng tiền</span>
            <span>
              {orderItems[0]?.tongtien?.toLocaleString("vi-VN") || 0}đ
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Giảm giá trực tiếp</span>
            <span className="text-orange-500">
              -{orderItems[0]?.giamgiatructiep?.toLocaleString("vi-VN") || 0}đ
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Giảm giá voucher</span>
            <span>0đ</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Phí vận chuyển</span>
            <span className="text-blue-600">Miễn phí</span>
          </div>
          <hr className="my-2" />
          <div
            style={{ borderBottom: "solid 1px" }}
            className="flex justify-between text-lg font-semibold"
          >
            <span>Thành tiền</span>
            <span className="text-blue-600">
              {orderItems[0]?.thanhtien?.toLocaleString("vi-VN") || 0}đ
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <span className="font-semibold text-lg">Phương thức thanh toán</span>
            <div className="font-medium text-black pt-1">
              {orderItems[0]?.phuongthucthanhtoan ||
                "Không có phương thức thanh toán nào"}
            </div>

            <div className="border-t pt-1">
              <p className="font-semibold text-lg">Trạng thái đơn hàng</p>
              <div
                className={`inline-block mt-1 px-3 py-1 rounded-full justify-center text-sm font-medium ${statusClass}`}
              >
                {orderItems[0]?.trangthai || "Không rõ trạng thái"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}