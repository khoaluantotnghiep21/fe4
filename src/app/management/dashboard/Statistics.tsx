'use client';

import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Table, List, Typography } from 'antd';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getAllOrders } from '@/lib/api/orderApi';
import { getProducts } from '@/lib/api/productApi';
import { getAllKhuyenMai } from '@/lib/api/khuyenMaiApi';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#b37feb'];

export default function Statistics() {
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [promotions, setPromotions] = useState<any[]>([]);

    useEffect(() => {
        getAllOrders().then(setOrders);
        getProducts().then(res => setProducts(res.data));
        getAllKhuyenMai && getAllKhuyenMai().then(setPromotions);
    }, []);

    // Đếm đơn theo ngày (chỉ lấy 14 ngày gần nhất)
    const today = dayjs();
    const days = Array.from({ length: 14 }, (_, i) =>
        today.subtract(13 - i, 'day').format('YYYY-MM-DD')
    );
    const ordersByDay = days.map(date => ({
        date,
        count: orders.filter(order => dayjs(order.ngaydat).format('YYYY-MM-DD') === date).length,
    }));

    // Đếm đơn theo tháng (12 tháng gần nhất)
    const months = Array.from({ length: 12 }, (_, i) =>
        today.subtract(11 - i, 'month').format('YYYY-MM')
    );
    const ordersByMonth = months.map(month => ({
        month,
        count: orders.filter(order => dayjs(order.ngaydat).format('YYYY-MM') === month).length,
    }));

    // Tính doanh thu theo tháng (12 tháng gần nhất)
    const revenueByMonth = months.map(month => {
        const monthOrders = orders.filter(order => dayjs(order.ngaydat).format('YYYY-MM') === month);
        let revenue = 0;
        monthOrders.forEach(order => {
            order.sanpham?.forEach((sp: any) => {
                revenue += ((sp.giaban - sp.gianhap - (sp.giamgiatructiep || 0)) * sp.soluong);
            });
        });
        return { month, revenue };
    });

    // Top 5 sản phẩm bán chạy
    const productSales: Record<string, { name: string, total: number }> = {};
    orders.forEach(order => {
        order.sanpham?.forEach((sp: any) => {
            if (!productSales[sp.tensanpham]) {
                productSales[sp.tensanpham] = { name: sp.tensanpham, total: 0 };
            }
            productSales[sp.tensanpham].total += sp.soluong;
        });
    });
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Thống kê chương trình khuyến mãi
    const promotionStats: Record<string, number> = {};
    orders.forEach(order => {
        if (order.mavoucher) {
            promotionStats[order.mavoucher] = (promotionStats[order.mavoucher] || 0) + 1;
        }
    });

    // Biểu đồ
    const barConfig = {
        data: ordersByDay,
        xField: 'date',
        yField: 'count',
        height: 220,
        autoFit: true,
        color: '#1890ff',
        meta: { date: { alias: 'Ngày' }, count: { alias: 'Số đơn' } },
        xAxis: { label: { rotate: 0 } },
    };

    const revenueBarConfig = {
        data: revenueByMonth,
        xField: 'month',
        yField: 'revenue',
        height: 220,
        autoFit: true,
        color: '#52c41a',
        meta: { month: { alias: 'Tháng' }, revenue: { alias: 'Doanh thu' } },
        xAxis: { label: { rotate: 0 } },
        yAxis: { label: { formatter: (v: any) => (+v).toLocaleString('vi-VN') + 'đ' } },
    };

    const pieConfig = {
        data: topProducts,
        angleField: 'total',
        colorField: 'name',
        radius: 0.8,
        height: 220,
        legend: { position: 'bottom' },
        label: { type: 'outer', content: '{name} ({percentage})' },
    };

    useEffect(() => {
        getAllOrders().then(setOrders);
        getProducts().then(res => setProducts(res.data));
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await getAllKhuyenMai();
            setPromotions(res);
        } catch (error) {
            console.error('Error fetching promotions:', error);
        }
    };

    return (
        <div>
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Tổng số đơn" value={orders.length} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng doanh thu"
                            value={revenueByMonth.reduce((a, b) => a + b.revenue, 0).toLocaleString('vi-VN') + 'đ'}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Số đơn hôm nay" value={ordersByDay[ordersByDay.length - 1]?.count || 0} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Số đơn tháng này" value={ordersByMonth[ordersByMonth.length - 1]?.count || 0} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={12}>
                    <Card title="Số lượng đơn theo ngày" bodyStyle={{ padding: 12 }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={ordersByDay}>
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1890ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Doanh thu theo tháng" bodyStyle={{ padding: 12 }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={revenueByMonth}>
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis tickFormatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                                <Tooltip formatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                                <Bar dataKey="revenue" fill="#52c41a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="Top 5 sản phẩm bán chạy" bodyStyle={{ padding: 12 }}>
                        <List
                            dataSource={topProducts}
                            renderItem={(item, idx) => (
                                <List.Item>
                                    <Typography.Text strong>{idx + 1}.</Typography.Text> {item.name}
                                    <span style={{ float: 'right', fontWeight: 500 }}>{item.total} lượt mua</span>
                                </List.Item>
                            )}
                        />
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={topProducts}
                                    dataKey="total"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    // Không để label hoặc chỉ để label nhỏ
                                    labelLine={false}
                                    label={({ name }) => name}
                                >
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                <Tooltip formatter={(value: number) => `${value} lượt mua`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                {/* <Col span={12}>
                    <Card title="Thống kê chương trình khuyến mãi" bodyStyle={{ padding: 12 }}>
                        <Table
                            dataSource={promotions.map((promo: any) => {
                                // Đếm tổng số sản phẩm đã bán được áp dụng khuyến mãi này
                                const totalProducts = products
                                    .filter((sp: any) => sp.machuongtrinh === promo.machuongtrinh)
                                    .reduce((sum: number, sp: any) => sum + (sp.soluongban || 0), 0);
                                return {
                                    voucher: promo.machuongtrinh,
                                    name: promo.tenchuongtrinh,
                                    count: totalProducts,
                                };
                            })}
                            columns={[
                                { title: 'Mã khuyến mãi', dataIndex: 'voucher', key: 'voucher' },
                                { title: 'Tên chương trình', dataIndex: 'name', key: 'name' },
                                { title: 'Số sản phẩm được áp dụng', dataIndex: 'count', key: 'count' },
                            ]}
                            pagination={false}
                            rowKey="voucher"
                            size="small"
                        />
                    </Card>
                </Col> */}
            </Row>
        </div>
    );
}