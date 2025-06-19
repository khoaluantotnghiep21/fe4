import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Button, Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#b37feb'];

export default function RevenueStatistics() {
  const [type, setType] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Tổng doanh thu, tổng đơn, trung bình đơn
  const [summary, setSummary] = useState({ total: 0, count: 0, avg: 0 });

  useEffect(() => {
    fetchStats(type);
  }, [type]);

  const fetchStats = async (type: 'day' | 'week' | 'month') => {
    setLoading(true);
    try {
      const res = await axios.get(`/purchase-order/stats/revenue/${type}`);
      // Giả sử res.data = [{ date: '2025-06-17', total: 1000000, count: 10 }, ...]
      setData(res.data);
      const total = res.data.reduce((sum: number, d: any) => sum + d.total, 0);
      const count = res.data.reduce((sum: number, d: any) => sum + d.count, 0);
      setSummary({
        total,
        count,
        avg: count > 0 ? Math.round(total / count) : 0,
      });
    } catch {
      setData([]);
      setSummary({ total: 0, count: 0, avg: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Pie data: 1 phần là trung bình hóa đơn/ngày, 1 phần là phần còn lại
  const pieData = [
    { name: 'Trung bình hóa đơn/ngày', value: summary.avg },
    { name: 'Phần còn lại', value: summary.total - summary.avg },
  ];

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

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng doanh thu" value={summary.total.toLocaleString('vi-VN') + 'đ'} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Tổng số đơn" value={summary.count} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Trung bình hóa đơn/ngày" value={summary.avg.toLocaleString('vi-VN') + 'đ'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title={`Biểu đồ doanh thu (${type === 'day' ? 'Ngày' : type === 'week' ? 'Tuần' : 'Tháng'})`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <XAxis dataKey={type === 'month' ? 'month' : 'date'} />
                <YAxis tickFormatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                <Tooltip formatter={v => (+v).toLocaleString('vi-VN') + 'đ'} />
                <Bar dataKey="total" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Tỉ lệ trung bình hóa đơn/ngày">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
    </div>
  );
}