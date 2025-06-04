'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Layout, Menu, Button, Card, Statistic, Row, Col, Typography } from 'antd';
import ProductManagement from '../product/ProductManagement';
import {
    DashboardOutlined,
    UserOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    SettingOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminDashboard() {
    const { user, isUserLoaded, logout } = useUser();
    const router = useRouter();
    const [selectedKey, setSelectedKey] = useState('dashboard');

    useEffect(() => {
        if (isUserLoaded && (!user || !user?.roles || !user.roles?.includes('admin'))) {
            router.replace('/management/admin/login');
        }
    }, [user, isUserLoaded, router]);

    const handleLogout = () => {
        logout();
        router.push('/management/login');
    };

    if (!isUserLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (!user || !user?.roles || !user.roles?.includes('admin')) {
        return null;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="dark">
                <div className="p-4 h-16 flex items-center justify-center border-b border-gray-700">
                    <Title level={4} style={{ color: 'white', margin: 0 }}>
                        Quản trị hệ thống
                    </Title>
                </div>                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={({key}) => setSelectedKey(key)}
                    items={[
                        {
                            key: 'dashboard',
                            icon: <DashboardOutlined />,
                            label: 'Tổng quan',
                        },
                        {
                            key: 'users',
                            icon: <UserOutlined />,
                            label: 'Quản lý người dùng',
                        },
                        {
                            key: 'products',
                            icon: <AppstoreOutlined />,
                            label: 'Quản lý sản phẩm',
                        },
                        {
                            key: 'orders',
                            icon: <ShoppingCartOutlined />,
                            label: 'Quản lý đơn hàng',
                        },
                        {
                            key: 'settings',
                            icon: <SettingOutlined />,
                            label: 'Cài đặt hệ thống',
                        },
                        {
                            key: 'logout',
                            icon: <LogoutOutlined />,
                            label: 'Đăng xuất',
                            onClick: handleLogout,
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px' }}>
                    <div className="flex justify-between items-center">                        <Title level={3} style={{ margin: 0 }}>
                            {selectedKey === 'dashboard' && 'Tổng quan'}
                            {selectedKey === 'products' && 'Quản lý sản phẩm'}
                            {selectedKey === 'users' && 'Quản lý người dùng'}
                            {selectedKey === 'orders' && 'Quản lý đơn hàng'}
                            {selectedKey === 'settings' && 'Cài đặt hệ thống'}
                        </Title>
                        <div className="flex items-center">
                            <span className="mr-4">Xin chào, {user.hoten}</span>
                            <Button type="primary" danger onClick={handleLogout}>
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </Header>                <Content style={{ margin: '24px 16px', minHeight: 280 }}>
                    {selectedKey === 'dashboard' && (
                        <>
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Tổng người dùng"
                                            value={1280}
                                            valueStyle={{ color: '#3f8600' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Sản phẩm"
                                            value={356}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Đơn hàng hôm nay"
                                            value={28}
                                            valueStyle={{ color: '#722ed1' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={6}>
                                    <Card>
                                        <Statistic
                                            title="Doanh thu hôm nay"
                                            value={12560000}
                                            valueStyle={{ color: '#cf1322' }}
                                            suffix="đ"
                                        />
                                    </Card>
                                </Col>
                            </Row>
                            <div className="mt-8">
                                <Title level={4}>Hoạt động gần đây</Title>
                                <Card>
                                    <p>Không có hoạt động nào gần đây</p>
                                </Card>
                            </div>
                        </>
                    )}
                    {selectedKey === 'products' && <ProductManagement />}
                </Content>
            </Layout>
        </Layout>
    );
} 