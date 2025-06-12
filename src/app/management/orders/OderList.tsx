import { useEffect, useState } from "react";
import { Card, Table, Select, Tag, Button, Popconfirm, message, Modal, Descriptions } from "antd";
import { getAllOrders, updateOrderStatus, getOderByMaDonHang } from "@/lib/api/orderApi";
import { Input } from "antd";

const orderStatusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "Đang chờ xác nhận", label: "Đang chờ xác nhận" },
  { value: "Đã xác nhận", label: "Đã xác nhận" },
  { value: "Đang giao hàng", label: "Đang giao hàng" },
  { value: "Đã giao hàng", label: "Đã giao hàng" },
  { value: "Đã hủy", label: "Đã hủy" },
];

const statusMap: Record<string, string> = {
  "Đang chờ xác nhận": "Pending",
  "Đã xác nhận": "Confirmed",
  "Đang giao hàng": "Delivering",
  "Đã giao hàng": "Delivered",
  "Đã hủy": "Cancelled",
};

const apiStatus = statusMap[status] || status;
getAllOrders(apiStatus);

const editableStatus = ["Delivering", "Pending", "Delivering", "Confirmed", "Delivering", "Cancelled", "Đang chờ xác nhận", "Đã xác nhận", "Đang giao hàng", "Đã giao hàng", "Đã hủy"];

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailStatus, setDetailStatus] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);



  const [searchMaDon, setSearchMaDon] = useState("");

  const showOrderDetail = async (madonhang: string) => {
    setLoading(true);
    try {
      const data = await getOderByMaDonHang(madonhang);
      setDetailData(data[0]);
      setDetailStatus(data[0]?.trangthai || "");
      setDetailVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = () => {
    setLoading(true);
    getAllOrders().then((allOrders) => {
      if (status === "all") {
        setOrders(allOrders);
      } else {
        setOrders(allOrders.filter((order: any) => order.trangthai === status));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [status]);


  const filteredOrders = searchMaDon
    ? orders.filter((order) =>
      order.madonhang.toLowerCase().includes(searchMaDon.trim().toLowerCase())
    )
    : orders;

  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);


  const handleStatusChange = async (madonhang: string, newStatus: string) => {
    setUpdatingId(madonhang);
    try {
      const apiStatus = statusMap[newStatus] || newStatus;
      await updateOrderStatus(madonhang, apiStatus);
      fetchOrders();
      const data = await getOderByMaDonHang(madonhang);
      setDetailData(data[0]);
      setDetailStatus(data[0]?.trangthai || "");
      message.success("Đã cập nhật trạng thái đơn hàng!");
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
        <Input.Search
          placeholder="Tìm mã đơn hàng"
          allowClear
          style={{ width: 220 }}
          value={searchMaDon}
          onChange={e => setSearchMaDon(e.target.value)}
          onSearch={v => setSearchMaDon(v)}
        />
      </div>
      <Table
        dataSource={pagedOrders}
        loading={loading}
        rowKey="madonhang"
        pagination={{
          current: page,
          pageSize,
          total: filteredOrders.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total) => `Tổng số: ${total} đơn hàng`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
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
            render: (trangthai: string) => (
              <Tag color={
                trangthai === "Đang chờ xác nhận" ? "gold" :
                  trangthai === "Đã xác nhận" ? "cyan" :
                    trangthai === "Đang giao hàng" ? "blue" :
                      trangthai === "Đã giao hàng" ? "green" :
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
            <Descriptions.Item label="Trạng thái">
              {editableStatus.includes(detailStatus) ? (
                <Popconfirm
                  title="Bạn có chắc muốn thay đổi trạng thái đơn hàng?"
                  onConfirm={async () => {
                    await handleStatusChange(detailData.madonhang, detailStatus);
                    message.success("Đã cập nhật trạng thái đơn hàng!");
                  }}
                  okText="Đồng ý"
                  cancelText="Hủy"
                  disabled={detailStatus === detailData.trangthai}
                >
                  <Select
                    value={detailStatus}
                    style={{ width: 180 }}
                    onChange={setDetailStatus}
                    options={orderStatusOptions.filter(opt => opt.value !== "all")}
                    disabled={updatingId === detailData.madonhang}
                  />
                  <Button
                    type="primary"
                    style={{ marginLeft: 8 }}
                    disabled={detailStatus === detailData.trangthai}
                  >
                    Lưu trạng thái
                  </Button>
                </Popconfirm>
              ) : (
                <Tag color={
                  detailStatus === "Đang chờ xác nhận" ? "gold" :
                    detailStatus === "Đã xác nhận" ? "cyan" :
                      detailStatus === "Đang giao hàng" ? "blue" :
                        detailStatus === "Đã giao hàng" ? "green" :
                          detailStatus === "Đã hủy" ? "red" : "default"
                }>
                  {detailStatus}
                </Tag>
              )}
            </Descriptions.Item>
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