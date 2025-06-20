import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, Select, Button } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRevenueStats, getImportStats } from '@/lib/api/statisticsApi';
import { getAllOrders } from '@/lib/api/orderApi';
import { getUsers } from '@/lib/api/userApi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#b37feb'];

export default function RevenueStatistics() {
  const [type, setType] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [importStats, setImportStats] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);

  const [summary, setSummary] = useState({ total: 0, count: 0, avgOrder: 0, avgCount: 0 });

  // Tính tổng nhập và tổng bán ra
  const totalImported = importStats.reduce((sum, item) => sum + Math.round(item.total_imported), 0);
  const totalSold = topProducts.reduce((sum, item) => sum + Number(item.soluong), 0);

  useEffect(() => {
    fetchStats(type);
    fetchTopProducts();
    fetchImportStats(type);
    fetchUserCount();
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

  const fetchImportStats = async (type: 'day' | 'week' | 'month') => {
    try {
      const res = await getImportStats(type);
      setImportStats(res.data || []);
    } catch {
      setImportStats([]);
    }
  };

  const fetchUserCount = async () => {
    try {
      const users = await getUsers();
      setUserCount(users.length);
    } catch {
      setUserCount(0);
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

  // Xuất excel cho thống kê nhập/xuất
  const handleExportExcel = () => {
    // Chuẩn bị dữ liệu
    const importRows = importStats.map((item: any) => ({
      'Mã sản phẩm': item.masanpham,
      'Tên sản phẩm': item.tensanpham,
      'Số lượng nhập': Math.round(item.total_imported),
    }));
    const soldMap: Record<string, number> = {};
    topProducts.forEach((item: any) => {
      soldMap[item.tensanpham] = Number(item.soluong);
    });
    const soldRows = importStats.map((item: any) => ({
      'Mã sản phẩm': item.masanpham,
      'Tên sản phẩm': item.tensanpham,
      'Số lượng bán': soldMap[item.tensanpham] || 0,
    }));
    // Sheet nhập
    const wsImport = XLSX.utils.json_to_sheet(importRows);
    // Sheet bán
    const wsSold = XLSX.utils.json_to_sheet(soldRows);
    // Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsImport, 'NhapHang');
    XLSX.utils.book_append_sheet(wb, wsSold, 'BanHang');
    // Xuất file
    const fileName = `ThongKe_NhapBan_${type}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
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
        <Col>
          <Button
            type="default"
            style={{ marginLeft: 8, background: '#fff', borderColor: '#52c41a', color: '#52c41a' }}
            onClick={handleExportExcel}
          >
            Xuất Excel
          </Button>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 32, marginBottom: 24 }}>
        <Col span={24}>
          <Card style={{ background: 'linear-gradient(90deg, #e0e7ff 0%, #f0fdfa 100%)', border: 'none', boxShadow: '0 2px 8px #e0e7ff' }}>
            <Statistic
              title={<span style={{ fontWeight: 600, fontSize: 18, color: '#2d3748' }}>Tổng số khách hàng</span>}
              value={userCount}
              valueStyle={{ fontSize: 36, color: '#1890ff', fontWeight: 700 }}
              prefix={<span role="img" aria-label="user" style={{ marginRight: 8 }}>👤</span>}
            />
          </Card>
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
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Statistic
                title={<span style={{ fontWeight: 600, color: '#389e0d' }}>Tổng số lượng nhập vào</span>}
                value={totalImported}
                valueStyle={{ fontSize: 28, color: '#389e0d', fontWeight: 700 }}
                suffix="sản phẩm"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <Statistic
                title={<span style={{ fontWeight: 600, color: '#d48806' }}>Tổng số lượng bán ra</span>}
                value={totalSold}
                valueStyle={{ fontSize: 28, color: '#d48806', fontWeight: 700 }}
                suffix="sản phẩm"
              />
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
      <Row gutter={16} style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card title={`Top 3 sản phẩm nhập nhiều nhất (${type === 'day' ? 'Ngày' : type === 'week' ? 'Tuần' : 'Tháng'})`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 400 }}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã sản phẩm</th>
                    <th>Tên sản phẩm</th>
                    <th>Số lượng nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {importStats
                    .sort((a, b) => Number(b.total_imported) - Number(a.total_imported))
                    .slice(0, 3)
                    .map((item, idx) => (
                      <tr key={item.masanpham + item.tensanpham}>
                        <td>{idx + 1}</td>
                        <td>{item.masanpham}</td>
                        <td>{item.tensanpham}</td>
                        <td>{Math.round(item.total_imported)}</td>
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