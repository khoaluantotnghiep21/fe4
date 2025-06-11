'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Layout, Menu, Button, Typography } from 'antd';
import {
    FileAddOutlined,
    DashboardOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import CreateOrderForm from './CreateOrderForm'; // Tạo component này cho form tạo đơn
import OrderList from './OderList'; // Tạo component này cho danh sách đơn hàng

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function OrderManagement() {
    const { user, isUserLoaded, logout } = useUser();
    const router = useRouter();
    const [selectedKey, setSelectedKey] = useState('create_order');

    useEffect(() => {
        if (isUserLoaded && (!user || !user?.roles || !user.roles?.includes('staff'))) {
            router.replace('/management/login');
        }
    }, [user, isUserLoaded, router]);

    const handleLogout = () => {
        logout();
        router.push('/management/login');
    };

    if (!isUserLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (!user || !user?.roles || !user.roles?.includes('staff')) {
        return null;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="dark">
                <div className="p-4 h-16 flex items-center justify-center border-b border-gray-700">
                    <Title level={4} style={{ color: 'white', margin: 0 }}>
                        Quản lý đơn hàng
                    </Title>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={({ key }) => {
                        if (key === 'logout') {
                            handleLogout();
                        } else {
                            setSelectedKey(key);
                        }
                    }}
                    items={[
                        {
                            key: 'create_order',
                            icon: <FileAddOutlined />,
                            label: 'Tạo đơn hàng',
                        },
                        {
                            key: 'orders',
                            icon: <DashboardOutlined />,
                            label: 'Danh sách đơn hàng',
                        },
                        {
                            key: 'logout',
                            icon: <LogoutOutlined />,
                            label: 'Đăng xuất',
                        },
                    ]}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px' }}>
                    <div className="flex justify-between items-center">
                        <Title level={3} style={{ margin: 0 }}>
                            {selectedKey === 'create_order' && 'Tạo đơn hàng'}
                            {selectedKey === 'orders' && 'Danh sách đơn hàng'}
                        </Title>
                        <div className="flex items-center">
                            <span className="mr-4">Xin chào, {user.hoten}</span>
                            <Button type="primary" danger onClick={handleLogout}>
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', minHeight: 280 }}>
                    {selectedKey === 'create_order' && <CreateOrderForm />}
                    {selectedKey === 'orders' && <OrderList />}
                </Content>
            </Layout>
        </Layout>
    );
}