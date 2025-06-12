"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { findOne, Pharmacy } from "@/lib/api/pharmacyService";
import { message } from "antd";
import { getOderByMaDonHang, OrderItem } from "@/lib/api/orderApi";
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

  useEffect(() => {
    const orderId = searchParams.get("orderId") || "";
    const orderCode = searchParams.get("orderCode") || "";
    const total = parseInt(searchParams.get("thanhTien") || "0", 10);
    const status = decodeURIComponent(searchParams.get("status") || "");
    const paymentMethod = decodeURIComponent(
      searchParams.get("paymentMethod") || ""
    );
    const shippingMethod = decodeURIComponent(
      searchParams.get("hinhThucNhanHang") || ""
    );
    const maChiNhanh = decodeURIComponent(searchParams.get("maChiNhanh") || "");
    const date = searchParams.get("date") || "";
    const discount = parseInt(searchParams.get("giamGiaTrucTiep") || "0", 10);
    const ngayGiaoHang = decodeURIComponent(
      searchParams.get("ngayGiaoHang") || ""
    );
    const gioGiaoHang = decodeURIComponent(
      searchParams.get("gioGiaoHang") || ""
    );
    const tenNguoiNhan = decodeURIComponent(
      searchParams.get("tenNguoiNhan") || ""
    );
    const soDienThoai = decodeURIComponent(
      searchParams.get("soDienThoai") || ""
    );

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
      tenNguoiNhan,
      maChiNhanh,
      soDienThoai,
    });
  }, [searchParams]);

  useEffect(() => {
    const maChiNhanh = decodeURIComponent(searchParams.get("maChiNhanh") || "");
    if (!maChiNhanh) return;

    const fetchPharmacy = async () => {
      try {
        const pharmacy = await findOne(maChiNhanh);
        console.log("Pharmacy:", pharmacy);
        setPharmacy(pharmacy);
      } catch (error) {
        console.error("Error fetching pharmacy:", error);
      }
    };

    fetchPharmacy();
  }, [searchParams]);
  const madonhang = decodeURIComponent(searchParams.get("madonhang") || "");
  useEffect(() => {
    const madonhang = searchParams.get("madonhang");
    if (!madonhang) return;

    const fetchOrderDetails = async () => {
      try {
        const data = await getOderByMaDonHang(madonhang);
        if(data && data[0].machinhanh){
          const pharmacy = await findOne(data[0]?.machinhanh);
          console.log("Pharmacy:", pharmacy);
          setPharmacy(pharmacy);
        }
        setOrderItems(data);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      }
    };

    fetchOrderDetails();
  }, [searchParams]);
  const statusClass =
    orderItems[0]?.trangthai == "Đã xác nhận"
      ? "bg-green-100 text-green-700"
      : orderItems[0]?.trangthai == "Đang chờ xác nhận"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  // Hàm sao chép mã đơn hàng
  const copyOrderCode = () => {
    const orderCode = orderItems[0]?.madonhang;
    if (orderCode) {
      navigator.clipboard
        .writeText(orderCode)
        .then(() => {
          message.success("Đã sao chép thành công mã đơn hàng vào bộ nhớ tạm");
        })
        .catch((error) => {
          console.error("Không thể sao chép mã đơn hàng:", error);
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="text-lg font-semibold mb-4">
        Đơn hàng{" "}
        {orderItems[0]?.ngaymuahang
          ? new Date(orderItems[0]?.ngaymuahang).toLocaleDateString("vi-VN")
          : "Lỗi"}{" "}
        · 
        <span
          className="text-blue-600 ml-1 cursor-pointer"
          onClick={() => copyOrderCode()}
        >
          #{orderItems[0]?.madonhang} · Sao chép
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Section */}
        <div className="col-span-2 bg-white p-4 rounded-md shadow border">
          <div className="mb-4">
            <p className="font-medium text-gray-700">Dự kiến nhận hàng</p>
            <p className="text-lg font-semibold text-black">
              
              {dayjs(orderItems[0]?.thoigiannhan).format("HH:MM")} ngày {dayjs(orderItems[0]?.thoigiannhan).format("DD/MM/YYYY")}
            </p>
            <p className="text-gray-600">
              Đơn hàng đang được xử lý tại nhà thuốc: {pharmacy?.diachicuthe}{" "}
              {pharmacy?.tenduong} {pharmacy?.quan}{" "}
              {pharmacy?.thanhpho || "Nhà thuốc Long Châu"}.
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="font-medium">Thông tin người nhận</p>
            <p className="text-black">
              {orderItems ? orderItems[0]?.nguoinhan : "Khách hàng ẩn danh"}
            </p>
            <p className="text-gray-600">
              {orderItems
                ? orderItems[0]?.sodienthoainguoinhan
                : "Số điện thoại không có"}
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
  <p className="font-medium">Nhận hàng tại</p>
  {orderItems[0]?.machinhanh != "CN000000" ? (
    <p className="text-black">
      {pharmacy?.diachicuthe} {pharmacy?.tenduong} {pharmacy?.quan}{" "}
      {pharmacy?.thanhpho || "..."}
    </p>
  ) : (
    <p className="text-gray-500">{orderItems[0]?.diachinguoinhan ? (
      <p className="text-black">
        {orderItems[0]?.diachinguoinhan}
      </p>
    ) : "Lỗi"}</p>
  )}
  </div>
</div>

        {/* Right Section */}
        <div className="bg-white p-4 rounded-md shadow border">
          <p className="text-lg font-semibold mb-4">Thông tin thanh toán</p>
          <div className="flex justify-between mb-2">
            <span>Tổng tiền</span>
            <span>
              {orderItems[0]?.tongtien
                ? orderItems[0]?.tongtien.toLocaleString("vi-VN")
                : 0}
              đ
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Giảm giá trực tiếp</span>
            <span className="text-orange-500">
              -
              {orderItems[0]?.giamgiatructiep
                ? orderItems[0]?.giamgiatructiep.toLocaleString("vi-VN")
                : 0}
              đ
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
          <div style={{borderBottom: "solid 1px "}} className="flex justify-between text-lg font-semibold">
            <span>Thành tiền</span>
            <span className="text-blue-600">
              {orderItems[0]?.thanhtien
                ? orderItems[0]?.thanhtien.toLocaleString("vi-VN")
                : 0}
              đ
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <span className="font-semibold text-lg  ">Phương thức thanh toán</span>
              <div className="font-medium text-black pt-1">
                {orderItems[0]?.phuongthucthanhtoan ||
                  "Không có phương thức thanh toán nào"}
              </div>

            <div className="mt-2 border-t pt-4">
              <p className="font-semibold text-lg ">Trạng thái đơn hàng</p>
              <div
                className={`inline-block mt-1 px-3 py-1 rounded-full justify-center text-sm font-medium ${statusClass}`}
              >
                {`${orderItems[0]?.trangthai} đơn hàng`  || "Không rõ trạng thái" }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
