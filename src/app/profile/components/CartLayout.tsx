import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Modal, Descriptions, message, Input, DatePicker, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getOderByUserId, getOderByMaDonHang } from '@/lib/api/orderApi';
import dayjs from 'dayjs';

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

export enum StatusPurchase {
    Pending = 'Đang chờ xác nhận',
    Confirmed = 'Đã xác nhận',
    Delivering = 'Đang giao hàng',
    Delivered = 'Đã giao hàng',
    Cancelled = 'Đã hủy',
}

const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    ...Object.values(StatusPurchase).map(status => ({ value: status, label: status })),
];

const CartLayout: React.FC = () => {
    const [orders, setOrders] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);
    const [searchMaDon, setSearchMaDon] = useState('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('all');

    const handleShowDetail = async (madonhang: string) => {
        setLoading(true);
        try {
            const res = await getOderByMaDonHang(madonhang);
            setDetailData(res[0]);
            setDetailVisible(true);
        } catch {
            message.error('Không lấy được chi tiết đơn hàng!');
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<CartItem> = [
        {
            title: 'Mã sản phẩm',
            dataIndex: 'masanpham',
            key: 'masanpham',
            render: (masanpham: string) => masanpham || 'N/A',
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
            render: (_, record) =>
                record.soluong && record.dongia
                    ? `${(record.soluong * record.dongia).toLocaleString('vi-VN')}đ`
                    : 'N/A',
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
            render: (date: string) =>
                date && dayjs(date).isValid()
                    ? dayjs(date).format('DD/MM/YYYY HH:mm')
                    : 'N/A',
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

    const fetchOrders = async () => {
        try {
            const userInfoString = localStorage.getItem('user_information');
            if (!userInfoString) {
                message.error('Không tìm thấy thông tin người dùng!');
                setLoading(false);
                return;
            }

            const userInfo = JSON.parse(userInfoString);
            const userId = userInfo.id;

            if (!userId) {
                message.error('Không tìm thấy ID người dùng!');
                setLoading(false);
                return;
            }

            const response = await getOderByUserId(userId);
            const mappedOrders = response.flatMap((order: any) =>
                order.sanpham.map((item: any, index: number) => ({
                    id: `${order.madonhang}-${index}`,
                    masanpham: item.masanpham || `${order.madonhang}`,
                    tensanpham: item.tensanpham,
                    soluong: item.soluong,
                    dongia: item.giaban,
                    trangthai: order.trangthai,
                    ngaydat: order.ngaymuahang,
                    madonhang: order.madonhang,
                    tongtien: order.thanhtien,
                }))
            );
            mappedOrders.sort(
                (a, b) => new Date(b.ngaydat).getTime() - new Date(a.ngaydat).getTime()
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

    const filteredOrders = orders.filter(order => {
        const matchMaDon = searchMaDon
            ? order.madonhang.toLowerCase().includes(searchMaDon.trim().toLowerCase())
            : true;
        const matchDate = selectedDate
            ? dayjs(order.ngaydat).format('YYYY-MM-DD') === selectedDate
            : true;
        const matchStatus = status === 'all' ? true : order.trangthai === status;
        return matchMaDon && matchDate && matchStatus;
    });

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
                    onChange={date => setSelectedDate(date ? date.format('YYYY-MM-DD') : null)}
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
                        <Descriptions.Item label="Tổng tiền">
                            {detailData.thanhtien?.toLocaleString('vi-VN')}đ
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày đặt">
                            {detailData.ngaymuahang && dayjs(detailData.ngaymuahang).isValid()
                                ? dayjs(detailData.ngaymuahang).format('DD/MM/YYYY HH:mm')
                                : ''}
                        </Descriptions.Item>
                        <Descriptions.Item label="Sản phẩm">
                            <ul>
                                {detailData.sanpham?.map((sp: any, idx: number) => (
                                    <li key={idx}>
                                        {sp.tensanpham} ({sp.donvitinh}) x{sp.soluong} - {sp.giaban.toLocaleString('vi-VN')}đ
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