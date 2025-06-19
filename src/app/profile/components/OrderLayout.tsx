import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, message, Input, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { OrderItem, getUserOrders, cancelOrder } from '@/lib/api/orderApi';
import dayjs from 'dayjs';

export enum StatusPurchase {
    Pending = 'Đang chờ xác nhận',
    Confirmed = 'Đã xác nhận',
    Delivering = 'Đang giao hàng',
    Delivered = 'Đã giao hàng',
    Cancelled = 'Đã hủy'
}

const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    ...Object.values(StatusPurchase).map(status => ({ value: status, label: status }))
];

const OrderLayout: React.FC = () => {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const userInfo = localStorage.getItem("user_information");
            if (!userInfo) {
                message.error("Không tìm thấy thông tin người dùng");
                return;
            }
            const { sodienthoai } = JSON.parse(userInfo);
            const orderData = await getUserOrders(sodienthoai);
            setOrders(orderData);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const [searchMaDon, setSearchMaDon] = useState("");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('all');


    const filteredOrders = orders.filter(order => {
        const matchMaDon = searchMaDon
            ? order.madonhang.toLowerCase().includes(searchMaDon.trim().toLowerCase())
            : true;
        const matchDate = selectedDate
            ? dayjs(order.ngaymuahang).format("YYYY-MM-DD") === selectedDate
            : true;
        const matchStatus = status === 'all' ? true : order.trangthai === status;
        return matchMaDon && matchDate && matchStatus;
    });

    const columns: ColumnsType<OrderItem> = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'madonhang',
            key: 'madonhang',
        },
        {
            title: 'Mã sản phẩm',
            dataIndex: 'masanpham',
            key: 'masanpham',
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'tensanpham',
            key: 'tensanpham',
        },
        {
            title: 'Số lượng',
            dataIndex: 'soluong',
            key: 'soluong',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'dongia',
            key: 'dongia',
            render: (price: number) => `${price.toLocaleString('vi-VN')}đ`,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'tongtien',
            key: 'tongtien',
            render: (price: number) => `${price.toLocaleString('vi-VN')}đ`,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangthai',
            key: 'trangthai',
            render: (status: string) => {
                let color = 'green';
                if (status === StatusPurchase.Pending) color = 'orange';
                if (status === StatusPurchase.Confirmed) color = 'geekblue';
                if (status === StatusPurchase.Cancelled) color = 'volcano';
                if (status === StatusPurchase.Delivering) color = 'cyan';
                if (status === StatusPurchase.Delivered) color = 'green';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'ngaydat',
            key: 'ngaydat',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" size="small">
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Đơn hàng của tôi</h2>
            <div className="flex gap-4 mb-4 items-center">
                <Input.Search
                    placeholder="Tìm mã đơn hàng"
                    allowClear
                    style={{ width: 220 }}
                    value={searchMaDon}
                    onChange={e => setSearchMaDon(e.target.value)}
                    onSearch={v => setSearchMaDon(v)}
                />
                <DatePicker
                    allowClear
                    placeholder="Lọc theo ngày"
                    style={{ width: 160 }}
                    value={selectedDate ? dayjs(selectedDate) : null}
                    onChange={date => setSelectedDate(date ? date.format("YYYY-MM-DD") : null)}
                />
                <Select
                    value={status}
                    style={{ width: 180 }}
                    onChange={setStatus}
                    options={statusOptions}
                />
            </div>
            <Table
                columns={columns}
                dataSource={filteredOrders}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />
        </div>
    );
};

export default OrderLayout; 