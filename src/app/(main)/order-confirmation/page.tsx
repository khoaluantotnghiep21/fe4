'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { findOne, Pharmacy } from '@/lib/api/pharmacyService';
import { message } from 'antd';

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    orderCode: '',
    total: 0,
    status: '',
    paymentMethod: '',
    shippingMethod: '',
    date: '',
    discount: 0,
    ngayGiaoHang: '',
    gioGiaoHang: '',
    maChiNhanh: '',
    tenNguoiNhan: '',
    soDienThoai: '',
  });

  useEffect(() => {
    const orderId = searchParams.get('orderId') || '';
    const orderCode = searchParams.get('orderCode') || '';
    const total = parseInt(searchParams.get('thanhTien') || '0', 10);
    const status = decodeURIComponent(searchParams.get('status') || '');
    const paymentMethod = decodeURIComponent(searchParams.get('paymentMethod') || '');
    const shippingMethod = decodeURIComponent(searchParams.get('hinhThucNhanHang') || '');
    const maChiNhanh = decodeURIComponent(searchParams.get('maChiNhanh') || '');
    const date = searchParams.get('date') || '';
    const discount = parseInt(searchParams.get('giamGiaTrucTiep') || '0', 10);
    const ngayGiaoHang = decodeURIComponent(searchParams.get('ngayGiaoHang') || '');
    const gioGiaoHang = decodeURIComponent(searchParams.get('gioGiaoHang') || '');
    const tenNguoiNhan = decodeURIComponent(searchParams.get('tenNguoiNhan') || '');
    const soDienThoai = decodeURIComponent(searchParams.get('soDienThoai') || '');

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
    const maChiNhanh = decodeURIComponent(searchParams.get('maChiNhanh') || '');
    if (!maChiNhanh) return;

    const fetchPharmacy = async () => {
      try {
        const pharmacy = await findOne(maChiNhanh);
        console.log('Pharmacy:', pharmacy);
        setPharmacy(pharmacy);
      } catch (error) {
        console.error('Error fetching pharmacy:', error);
      }
    };

    fetchPharmacy();
  }, [searchParams]);

  const finalTotal = orderDetails.total - orderDetails.discount;

  // Hàm sao chép mã đơn hàng
  const copyOrderCode = () => {
    const orderCode = orderDetails.orderCode;
    if (orderCode) {
      navigator.clipboard.writeText(orderCode)
        .then(() => {
          message.success("Đã sao chép thành công mã đơn hàng vào bộ nhớ tạm")
        })
        .catch((error) => {
          console.error('Không thể sao chép mã đơn hàng:', error);
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="text-lg font-semibold mb-4">
        Đơn hàng {new Date(orderDetails.date).toLocaleDateString('vi-VN')} · {orderDetails.shippingMethod} · 
        <span className="text-blue-600 ml-1 cursor-pointer" onClick={() => copyOrderCode()}>
          #{orderDetails.orderCode} · Sao chép
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left Section */}
        <div className="col-span-2 bg-white p-4 rounded-md shadow border">
          <div className="mb-4">
            <p className="font-medium text-gray-700">Dự kiến nhận hàng</p>
            <p className="text-lg font-semibold text-black">
              {orderDetails.gioGiaoHang} ngày {orderDetails.ngayGiaoHang}
            </p>
            <p className="text-gray-600">
            Đơn hàng đang được xử lý tại nhà thuốc: {pharmacy?.diachicuthe} {pharmacy?.tenduong} {pharmacy?.quan} {pharmacy?.thanhpho || '...'}.
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="font-medium">Thông tin người nhận</p>
            <p className="text-black">{orderDetails.tenNguoiNhan != undefined ? orderDetails.tenNguoiNhan : "Khách hàng ẩn danh"}</p>
            <p className="text-gray-600">{orderDetails.soDienThoai != undefined ? orderDetails.soDienThoai : "Số điện thoại không có"}</p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="font-medium">Nhận hàng tại</p>
            <p className="text-black"> {pharmacy?.diachicuthe} {pharmacy?.tenduong} {pharmacy?.quan} {pharmacy?.thanhpho || '...'}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white p-4 rounded-md shadow border">
          <p className="text-lg font-semibold mb-4">Thông tin thanh toán</p>
          <div className="flex justify-between mb-2">
            <span>Tổng tiền</span>
            <span>{orderDetails.total.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Giảm giá trực tiếp</span>
            <span className="text-orange-500">-{orderDetails.discount.toLocaleString('vi-VN')}đ</span>
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
          <div className="flex justify-between text-lg font-semibold">
            <span>Thành tiền</span>
            <span className="text-blue-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="mt-4">
            <p className="font-medium">Phương thức thanh toán</p>
            <div className="flex items-center mt-1">
              <span>{orderDetails.paymentMethod}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
