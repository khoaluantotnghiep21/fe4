import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { OrderItem, getUserOrders, cancelOrder } from '@/lib/api/orderApi';

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

    const handleCancelOrder = (orderId: string) => {
        Modal.confirm({
            title: 'Xác nhận hủy đơn hàng',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
            okText: 'Xác nhận',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                const success = await cancelOrder(orderId);
                if (success) {
                    fetchOrders(); // Refresh the order list
                }
            },
        });
    };

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
                if (status === 'Chờ xác nhận') color = 'gold';
                if (status === 'Đã hủy') color = 'red';
                if (status === 'Đang giao') color = 'blue';
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
                    {record.trangthai === 'Chờ xác nhận' && (
                        <Button 
                            type="link" 
                            danger 
                            size="small"
                            onClick={() => handleCancelOrder(record.id)}
                        >
                            Hủy đơn
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Đơn hàng của tôi</h2>
            <Table 
                columns={columns} 
                dataSource={orders} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />
        </div>
    );
};

export default OrderLayout; 