import { useEffect, useState } from "react";
import { Card, Table, Select, Tag, Button, Popconfirm, message } from "antd";
import { getAllOrders, updateOrderStatus } from "@/lib/api/orderApi";

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
        ]}
        pagination={false}
      />
    </Card>
  );
}