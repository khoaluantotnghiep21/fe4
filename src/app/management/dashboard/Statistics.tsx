import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRevenueStats } from '@/lib/api/statisticsApi';
import { getAllOrders } from '@/lib/api/orderApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#b37feb'];

export default function RevenueStatistics() {
  const [type, setType] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const [summary, setSummary] = useState({ total: 0, count: 0, avgOrder: 0, avgCount: 0 });

  useEffect(() => {
    fetchStats(type);
    fetchTopProducts();
  }, [type]);

  const fetchStats = async (type: 'day' | 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await getRevenueStats(type);
      const arr = res.data || [];
      setData(arr);
      const total = arr.reduce((sum: number, d: any) => sum + Number(d.total_revenue), 0);
      const count = arr.reduce((sum: number, d: any) => sum + Number(d.total_orders), 0);
      setSummary({
        total,
        count,
        avgOrder: count > 0 ? Math.round(total / count) : 0,
        avgCount: arr.length > 0 ? Math.round(count / arr.length) : 0,
      });
    } catch {
      setData([]);
      setSummary({ total: 0, count: 0, avgOrder: 0, avgCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const orders = await getAllOrders();
      const productMap: Record<string, { tensanpham: string; soluong: number; url?: string }> = {};
      orders.forEach((order: any) => {
        (order.sanpham || []).forEach((sp: any) => {
          if (!productMap[sp.tensanpham]) {
            productMap[sp.tensanpham] = { tensanpham: sp.tensanpham, soluong: 0, url: sp.url };
          }
          productMap[sp.tensanpham].soluong += Number(sp.soluong);
        });
      });
      const top = Object.values(productMap)
        .sort((a, b) => b.soluong - a.soluong)
        .slice(0, 5);
      setTopProducts(top);
    } catch {
      setTopProducts([]);
    }
  };

  const pieData = data.map((d: any) => ({
    name: type === 'month' ? `Tháng ${d.period}` : type === 'week' ? `Tuần ${d.period}` : d.period,
    value: Number(d.total_revenue),
  }));

  const formatXAxis = (value: string) => {
    if (type === 'month') { return `Tháng ${value}`; }
    if (type === 'week') { return `Tuần ${value}`; }
    return value;
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col>
          <Select
            value={type}
            onChange={setType}
            options={[
              { value: 'day', label: 'Theo ngày' },
              { value: 'week', label: 'Theo tuần' },
              { value: 'month', label: 'Theo tháng' },
            ]}
            style={{ width: 150 }}
          />
        </Col>
      </Row>
      <Spin spinning={loading} tip="Đang tải thống kê...">
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Tổng doanh thu" value={summary.total.toLocaleString('vi-VN') + 'đ'} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Tổng số đơn" value={summary.count} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Trung bình giá trị đơn" value={summary.avgOrder.toLocaleString('vi-VN') + 'đ'} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title={`Trung bình số đơn/${type === 'day' ? 'ngày' : type === 'week' ? 'tuần' : 'tháng'}`} value={summary.avgCount} />
            </Card>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            <Card title={`Biểu đồ doanh thu (${type === 'day' ? 'Ngày' : type === 'week' ? 'Tuần' : 'Tháng'})`}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={data}>
                  <XAxis dataKey="period" tickFormatter={formatXAxis} />
                  <YAxis tickFormatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                  <Tooltip formatter={v => (+v).toLocaleString('vi-VN') + 'đ'} labelFormatter={formatXAxis} />
                  <Bar dataKey="total_revenue" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Tỉ trọng doanh thu">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Spin>
      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card title="Top 5 sản phẩm bán chạy nhất">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 400 }}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th>Số lượng bán</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((item, idx) => (
                    <tr key={item.tensanpham}>
                      <td>{idx + 1}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.url && <img src={item.url} alt={item.tensanpham} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                        {item.tensanpham}
                      </td>
                      <td>{item.soluong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}