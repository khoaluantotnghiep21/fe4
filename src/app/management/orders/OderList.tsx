import { useEffect, useState } from "react";
import { Card, Table, Select, Tag, Button, Popconfirm, message, Modal, Descriptions } from "antd";
import { getAllOrders, updateOrderStatus, getOderByMaDonHang } from "@/lib/api/orderApi";

const orderStatusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "Đang chờ xác nhận", label: "Đang chờ xác nhận" },
  { value: "Đang giao", label: "Đang giao" },
  { value: "Hoàn thành", label: "Hoàn thành" },
  { value: "Đã hủy", label: "Đã hủy" },
];

const editableStatus = ["Đang chờ xác nhận", "Đang giao"];

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const showOrderDetail = async (madonhang: string) => {
    setLoading(true);
    try {
      const data = await getOderByMaDonHang(madonhang);
      setDetailData(data[0]);
      setDetailVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = () => {
    setLoading(true);
    getAllOrders(status)
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [status]);

  const handleStatusChange = async (madonhang: string, newStatus: string) => {
    setUpdatingId(madonhang);
    try {
      await updateOrderStatus(madonhang, newStatus);
      message.success("Cập nhật trạng thái thành công!");
      fetchOrders();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card title="Danh sách đơn hàng">
      <div className="mb-4 flex gap-4 items-center">
        <span>Trạng thái:</span>
        <Select
          value={status}
          style={{ width: 200 }}
          onChange={setStatus}
          options={orderStatusOptions}
        />
      </div>
      <Table
        dataSource={orders}
        loading={loading}
        rowKey="madonhang"
        columns={[
          { title: "Mã đơn", dataIndex: "madonhang", key: "madonhang" },
          { title: "Khách hàng", dataIndex: "hoten", key: "hoten" },
          {
            title: "Tổng tiền",
            dataIndex: "thanhtien",
            key: "thanhtien",
            render: (t: number) => `${t.toLocaleString("vi-VN")}đ`,
          },
          {
            title: "Trạng thái",
            dataIndex: "trangthai",
            key: "trangthai",
            render: (trangthai: string, record: any) =>
              editableStatus.includes(trangthai) ? (
                <Select
                  value={trangthai}
                  style={{ width: 150 }}
                  onChange={newStatus =>
                    handleStatusChange(record.madonhang, newStatus)
                  }
                  loading={updatingId === record.madonhang}
                  disabled={updatingId === record.madonhang}
                  options={orderStatusOptions
                    .filter(opt => opt.value !== "all")
                    .map(opt => ({
                      value: opt.value,
                      label: opt.label,
                      disabled:
                        trangthai === "Hoàn thành" ||
                        trangthai === "Đã hủy" ||
                        (opt.value === "Hoàn thành" && trangthai === "Đã hủy") ||
                        (opt.value === "Đã hủy" && trangthai === "Hoàn thành"),
                    }))}
                />
              ) : (
                <Tag color={
                  trangthai === "Đang chờ xác nhận" ? "gold" :
                    trangthai === "Đang giao" ? "blue" :
                      trangthai === "Hoàn thành" ? "green" :
                        trangthai === "Đã hủy" ? "red" : "default"
                }>
                  {trangthai}
                </Tag>
              ),
          },
          {
            title: "Sản phẩm",
            dataIndex: "sanpham",
            key: "sanpham",
            render: (sp: any[]) => (
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {sp.map((item, idx) => (
                  <li key={idx}>
                    <span>{item.tensanpham}</span> ({item.donvitinh}) x{item.soluong} - {item.giaban.toLocaleString("vi-VN")}đ
                  </li>
                ))}
              </ul>
            ),
          },
          {
            title: "Xem chi tiết",
            key: "action",
            render: (_: any, record: any) => (
              <Button onClick={() => showOrderDetail(record.madonhang)}>
                Xem chi tiết
              </Button>
            ),
          },
        ]}
        pagination={false}
      />
      <Modal
        open={detailVisible}
        title="Chi tiết đơn hàng"
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {detailData ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Mã đơn">{detailData.madonhang}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{detailData.hoten}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{detailData.sodienthoai}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{detailData.diachi}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{detailData.trangthai}</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">{detailData.thanhtien?.toLocaleString("vi-VN")}đ</Descriptions.Item>
            <Descriptions.Item label="Sản phẩm">
              <ul>
                {detailData.sanpham?.map((sp: any, idx: number) => (
                  <li key={idx}>
                    {sp.tensanpham} ({sp.donvitinh}) x{sp.soluong} - {sp.giaban.toLocaleString("vi-VN")}đ
                  </li>
                ))}
              </ul>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </Card>
  );
}