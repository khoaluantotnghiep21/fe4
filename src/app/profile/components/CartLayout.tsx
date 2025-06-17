import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Descriptions, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getOderByUserId, cancelOrder, getOderByMaDonHang } from '@/lib/api/orderApi';

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

    // Modal state
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

    const handleShowDetail = async (madonhang: string) => {
        setLoading(true);
        try {
            const res = await getOderByMaDonHang(madonhang);
            setDetailData(res[0]);
            setDetailVisible(true);
        } catch {
            message.error("Không lấy được chi tiết đơn hàng!");
        } finally {
            setLoading(false);
        }
    };

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
                    <Button type="link" size="small" onClick={() => handleShowDetail(record.madonhang)}>
                        Chi tiết
                    </Button>
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
            <Modal
                open={detailVisible}
                title="Chi tiết đơn hàng"
                onCancel={() => setDetailVisible(false)}
                footer={null}
            >
                {detailData ? (
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label="Mã đơn">{detailData.madonhang}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{detailData.trangthai}</Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền">{detailData.thanhtien?.toLocaleString("vi-VN")}đ</Descriptions.Item>
                        <Descriptions.Item label="Ngày đặt">{detailData.ngaydat ? new Date(detailData.ngaydat).toLocaleDateString('vi-VN') : ''}</Descriptions.Item>
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
        </div>
    );
};

export default CartLayout;