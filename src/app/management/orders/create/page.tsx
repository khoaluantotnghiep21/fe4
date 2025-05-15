'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Layout, Menu, Button, Form, Input, Select, Table, InputNumber, Typography, Card, message } from 'antd';
import {
    DashboardOutlined,
    ShoppingCartOutlined,
    FileAddOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

// Mock products data
const mockProducts = [
    { id: '1', name: 'Vitamin C 1000mg', price: 120000, stock: 100 },
    { id: '2', name: 'Paracetamol 500mg', price: 15000, stock: 200 },
    { id: '3', name: 'Sữa Ensure Gold', price: 780000, stock: 50 },
    { id: '4', name: 'Omega 3 Fish Oil', price: 350000, stock: 75 },
    { id: '5', name: 'Băng dính y tế', price: 25000, stock: 150 },
];

export default function CreateOrder() {
    const { user, isUserLoaded, logout } = useUser();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        if (isUserLoaded && (!user || !user?.roles || !user.roles?.includes('staff'))) {
            router.replace('/management/staff/login');
        }
    }, [user, isUserLoaded, router]);

    const handleLogout = () => {
        logout();
        router.push('/management/login');
    };

    const handleAddToCart = () => {
        form.validateFields().then(values => {
            const product = mockProducts.find(p => p.id === values.productId);
            if (product) {
                // Check if the product is already in the cart
                const existingItemIndex = cartItems.findIndex(item => item.id === product.id);

                if (existingItemIndex !== -1) {
                    // Update existing item
                    const newCartItems = [...cartItems];
                    newCartItems[existingItemIndex].quantity += values.quantity;
                    newCartItems[existingItemIndex].total = newCartItems[existingItemIndex].quantity * newCartItems[existingItemIndex].price;
                    setCartItems(newCartItems);
                } else {
                    // Add new item
                    setCartItems([
                        ...cartItems,
                        {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: values.quantity,
                            total: product.price * values.quantity
                        }
                    ]);
                }

                form.resetFields(['quantity']);
                message.success(`Đã thêm ${product.name} vào giỏ hàng`);
            }
        });
    };

    const handleRemoveItem = (id: string) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const handleCreateOrder = () => {
        if (cartItems.length === 0) {
            message.error('Vui lòng thêm sản phẩm vào giỏ hàng');
            return;
        }

        message.success('Đã tạo đơn hàng thành công');
        setCartItems([]);
        form.resetFields();
    };

    const columns = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => `${price.toLocaleString('vi-VN')}đ`,
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Thành tiền',
            dataIndex: 'total',
            key: 'total',
            render: (total: number) => `${total.toLocaleString('vi-VN')}đ`,
        },
        {
            title: 'Hành động',
            key: 'action',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => (
                <Button type="link" danger onClick={() => handleRemoveItem(record.id)}>
                    Xóa
                </Button>
            ),
        },
    ];

    if (!isUserLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (!user || !user?.roles || !user.roles?.includes('staff')) {
        return null;
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="dark">
                <div className="p-4 h-16 flex items-center justify-center border-b border-gray-700">
                    <Title level={4} style={{ color: 'white', margin: 0 }}>
                        Nhân viên bán hàng
                    </Title>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['create_order']}
                    items={[
                        {
                            key: 'orders',
                            icon: <ShoppingCartOutlined />,
                            label: 'Đơn hàng',
                            children: [
                                {
                                    key: 'create_order',
                                    icon: <FileAddOutlined />,
                                    label: 'Tạo đơn hàng',
                                },
                                {
                                    key: 'order_list',
                                    icon: <DashboardOutlined />,
                                    label: 'Danh sách đơn hàng',
                                },
                            ],
                        },
                        {
                            key: 'profile',
                            icon: <UserOutlined />,
                            label: 'Tài khoản',
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
                    <div className="flex justify-between items-center">
                        <Title level={3} style={{ margin: 0 }}>
                            Tạo đơn hàng mới
                        </Title>
                        <div className="flex items-center">
                            <span className="mr-4">Xin chào, {user.hoten}</span>
                            <Button type="primary" danger onClick={handleLogout}>
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24 }}>
                    <Card title="Thông tin đơn hàng" className="mb-4">
                        <Form layout="vertical" form={form}>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Form.Item
                                        name="customerPhone"
                                        label="Số điện thoại khách hàng"
                                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                                    >
                                        <Input placeholder="Nhập số điện thoại" />
                                    </Form.Item>
                                </div>
                                <div className="flex-1">
                                    <Form.Item
                                        name="customerName"
                                        label="Tên khách hàng"
                                    >
                                        <Input placeholder="Tên khách hàng sẽ tự động điền nếu đã có tài khoản" />
                                    </Form.Item>
                                </div>
                            </div>
                        </Form>
                    </Card>

                    <Card title="Thêm sản phẩm" className="mb-4">
                        <Form layout="inline" form={form}>
                            <Form.Item
                                name="productId"
                                rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
                                style={{ width: '300px' }}
                            >
                                <Select placeholder="Chọn sản phẩm">
                                    {mockProducts.map(product => (
                                        <Option key={product.id} value={product.id}>
                                            {product.name} - {product.price.toLocaleString('vi-VN')}đ
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="quantity"
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                                initialValue={1}
                            >
                                <InputNumber min={1} placeholder="Số lượng" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" onClick={handleAddToCart}>
                                    Thêm vào giỏ hàng
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card title="Giỏ hàng">
                        <Table
                            columns={columns}
                            dataSource={cartItems}
                            rowKey="id"
                            pagination={false}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={3}>
                                        <strong>Tổng tiền</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1}>
                                        <strong>{totalAmount.toLocaleString('vi-VN')}đ</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} />
                                </Table.Summary.Row>
                            )}
                        />

                        <div className="mt-4 flex justify-end">
                            <Button type="primary" size="large" onClick={handleCreateOrder}>
                                Tạo đơn hàng
                            </Button>
                        </div>
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
} 