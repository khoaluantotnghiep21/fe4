import React from 'react';
import { Table, Tag, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface CartItem {
    id: string;
    masanpham: string;
    tensanpham: string;
    soluong: number;
    dongia: number;
    trangthai: string;
    ngaydat: string;
}

const CartLayout: React.FC = () => {
    const columns: ColumnsType<CartItem> = [
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
            key: 'thanhtien',
            render: (_, record) => `${(record.soluong * record.dongia).toLocaleString('vi-VN')}đ`,
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
                        <Button type="link" danger size="small">
                            Hủy đơn
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    // Dummy data for testing
    const data: CartItem[] = [
        {
            id: '1',
            masanpham: 'SP001',
            tensanpham: 'Vaccine COVID-19',
            soluong: 2,
            dongia: 1500000,
            trangthai: 'Chờ xác nhận',
            ngaydat: '2024-03-15',
        },
        {
            id: '2',
            masanpham: 'SP002',
            tensanpham: 'Vaccine Cúm',
            soluong: 1,
            dongia: 800000,
            trangthai: 'Đang giao',
            ngaydat: '2024-03-14',
        },
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Đơn hàng của tôi</h2>
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="id"
                pagination={{ pageSize: 5 }}
            />
        </div>
    );
};

export default CartLayout; 