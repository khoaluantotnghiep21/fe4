import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { message } from 'antd';
import { getOderByUserId, cancelOrder } from '@/lib/api/orderApi';

interface CartItem {
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

const CartLayout: React.FC = () => {
    const [orders, setOrders] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Define table columns
    const columns: ColumnsType<CartItem> = [
        {
            title: 'Mã sản phẩm',
            dataIndex: 'masanpham',
            key: 'masanpham',
            render: (masanpham: string) => masanpham || 'N/A', // Handle missing masanpham
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
            render: (price: number) => (price ? `${price.toLocaleString('vi-VN')}đ` : 'N/A'),
        },
        {
            title: 'Thành tiền',
            key: 'thanhtien',
            render: (_, record) => {
                const total = record.soluong && record.dongia 
                    ? (record.soluong * record.dongia).toLocaleString('vi-VN') 
                    : 'N/A';
                return `${total}đ`;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trangthai',
            key: 'trangthai',
            render: (status: string) => {
                let color = 'green';
                if (status === 'Đang chờ xác nhận') color = 'gold';
                if (status === 'Đã hủy') color = 'red';
                if (status === 'Đang giao') color = 'blue';
                if (status === 'Đã xác nhận') color = 'cyan';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'ngaydat',
            key: 'ngaydat',
            render: (date: string) => (date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" size="small">
                        Chi tiết
                    </Button>
                    {record.trangthai === 'Đang chờ xác nhận' && (
                        <Button
                            type="link"
                            danger
                            size="small"
                            onClick={() => handleCancelOrder(record.madonhang)}
                        >
                            Hủy đơn
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    // Handle order cancellation
    const handleCancelOrder = async (orderId: string) => {
        setLoading(true);
        const success = await cancelOrder(orderId);
        if (success) {
            // Refresh orders after cancellation
            fetchOrders();
        } else {
            setLoading(false);
        }
    };

    // Fetch orders when component mounts
    const fetchOrders = async () => {
        try {
            // Retrieve user information from localStorage
            const userInfoString = localStorage.getItem('user_information');
            if (!userInfoString) {
                message.error('Không tìm thấy thông tin người dùng!');
                setLoading(false);
                return;
            }

            const userInfo = JSON.parse(userInfoString);
            const userId = userInfo.id;
            console.log('User ID:', userId);

            if (!userId) {
                message.error('Không tìm thấy ID người dùng!');
                setLoading(false);
                return;
            }

            // Fetch orders using the getOderByUserId API
            const response = await getOderByUserId(userId);
            console.log('API Response:', response);

            // Map API response to CartItem interface
            const mappedOrders = response.flatMap((order: any) =>
                order.sanpham.map((item: any, index: number) => ({
                    id: `${order.madonhang}-${index}`, // Generate unique ID
                    masanpham: item.masanpham || `SP-${order.madonhang}`, // Fallback if masanpham is missing
                    tensanpham: item.tensanpham,
                    soluong: item.soluong,
                    dongia: item.giaban, // Map giaban to dongia
                    trangthai: order.trangthai,
                    ngaydat: order.ngaydat || new Date().toISOString(), // Fallback to current date if missing
                    madonhang: order.madonhang,
                    tongtien: order.thanhtien,
                }))
            );

            setOrders(mappedOrders);
            if (!mappedOrders || mappedOrders.length === 0) {
                message.info('Không có đơn hàng nào.');
            }
        } catch (error: any) {
            console.error('Error fetching orders:', error.response?.data || error.message);
            message.error('Lỗi khi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Đơn hàng của tôi</h2>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                loading={loading}
            />
        </div>
    );
};

export default CartLayout;