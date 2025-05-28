"use client";

import { Menu, Button, Row, Col, Input, DatePicker, message, Form, Modal, Radio } from "antd";
import {
    UserOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    LogoutOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import React from "react";
import { getUserByPhone, update } from "@/lib/api/authApi";
import { User, UpdateData } from "@/types/user.types";
import dayjs from "dayjs";
import CartLayout from "./components/CartLayout";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

type LayoutType = 'profile' | 'cart' | 'medical-record' | 'vaccination-schedule' | 'vaccination-order';

export default function Profile() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [profileData, setProfileData] = React.useState<User | null>(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [currentLayout, setCurrentLayout] = React.useState<LayoutType>('profile');
    const [form] = Form.useForm();
    const { logout, setUser } = useUser();

    React.useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError(null);
                const infor = localStorage.getItem("user_information");
                const numberPhone = JSON.parse(infor || "{}").sodienthoai;
                if (!numberPhone) {
                    throw new Error("Không tìm thấy số điện thoại");
                }
                const profile = await getUserByPhone(numberPhone);
                setProfileData(profile);
                // Set initial form values
                if (profile) {
                    form.setFieldsValue({
                        ...profile,
                        ngaysinh: profile.ngaysinh ? dayjs(profile.ngaysinh) : null
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải thông tin");
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [form]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form to original values
        if (profileData) {
            form.setFieldsValue({
                ...profileData,
                ngaysinh: profileData.ngaysinh ? dayjs(profileData.ngaysinh) : null
            });
        }
    };

    const handleUpdate = async (values: UpdateData) => {
        try {
            setLoading(true);
            if (!profileData?.sodienthoai) {
                throw new Error("Không tìm thấy số điện thoại");
            }

            const updateData: UpdateData = {
                ...values,
                sodienthoai: profileData.sodienthoai, // Keep original phone number
                ngaysinh: values.ngaysinh ? dayjs(values.ngaysinh).format('YYYY-MM-DD') : undefined
            };

            const updatedProfile = await update(updateData);
            setProfileData(updatedProfile);
            setIsEditing(false);
            
            // Update both localStorage and context
            localStorage.setItem("user_information", JSON.stringify(updatedProfile));
            setUser(updatedProfile);
            
            // Hiển thị thông báo dispatch
            message.success({
                content: 'Cập nhật thông tin thành công',
                duration: 2,
                style: {
                    marginTop: '20vh',
                },
            });
        } catch (err) {
            message.error({
                content: "Có lỗi xảy ra khi cập nhật thông tin",
                duration: 2,
                style: {
                    marginTop: '20vh',
                },
            });
            console.error("Error updating profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (key: string) => {
        switch (key) {
            case '1':
                setCurrentLayout('profile');
                break;
            case '2':
                setCurrentLayout('cart');
                break;
            case '3':
                setCurrentLayout('medical-record');
                break;
            case '4':
                setCurrentLayout('vaccination-schedule');
                break;
            case '5':
                setCurrentLayout('vaccination-order');
                break;
            case '6':
                showLogoutConfirm();
                break;
        }
    };

    const showLogoutConfirm = () => {
        Modal.confirm({
            title: 'Xác nhận đăng xuất',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn đăng xuất không?',
            okText: 'Đăng xuất',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: handleLogout,
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
            message.success({
                content: 'Đăng xuất thành công',
                duration: 2,
                style: {
                    marginTop: '20vh',
                },
            });
            router.push('/');
        } catch (error) {
            message.error({
                content: 'Có lỗi xảy ra khi đăng xuất',
                duration: 2,
                style: {
                    marginTop: '20vh',
                },
            });
            console.error('Error during logout:', error);
        }
    };


    const renderContent = () => {
        switch (currentLayout) {
            case 'cart':
                return <CartLayout />;
            case 'profile':
            default:
                return (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>
                        {profileData ? (
                            <>
                                {!isEditing ? (
                                    <Form
                                        layout="vertical"
                                        initialValues={{
                                            ...profileData,
                                            ngaysinh: profileData.ngaysinh ? dayjs(profileData.ngaysinh) : null
                                        }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Họ và tên:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="hoten" noStyle>
                                                    <Input 
                                                        readOnly 
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Số điện thoại:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="sodienthoai" noStyle>
                                                    <Input 
                                                        readOnly 
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Email:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="email" noStyle>
                                                    <Input 
                                                        readOnly 
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Giới tính:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="gioitinh" noStyle>
                                                    <Radio.Group 
                                                        className="w-full flex justify-between pointer-events-none opacity-100"
                                                        value={profileData?.gioitinh}
                                                    >
                                                        <Radio value="Nam">Nam</Radio>
                                                        <Radio value="Nữ">Nữ</Radio>
                                                        <Radio value="Khác">Khác</Radio>
                                                    </Radio.Group>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Ngày sinh:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="ngaysinh" noStyle>
                                                    <DatePicker 
                                                        readOnly
                                                        format="DD-MM-YYYY"
                                                        style={{ width: '100%' }}
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Địa chỉ:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="diachi" noStyle>
                                                    <Input.TextArea 
                                                        readOnly 
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div className="mt-6">
                                            <Button type="primary" onClick={handleEdit}>
                                                Chỉnh sửa thông tin
                                            </Button>
                                        </div>
                                    </Form>
                                ) : (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleUpdate}
                                        initialValues={{
                                            ...profileData,
                                            ngaysinh: profileData.ngaysinh ? dayjs(profileData.ngaysinh) : null
                                        }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Họ và tên:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item 
                                                    name="hoten" 
                                                    noStyle
                                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                                >
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Số điện thoại:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="sodienthoai" noStyle>
                                                    <Input 
                                                        readOnly 
                                                        className="bg-white hover:bg-white cursor-default"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Email:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item 
                                                    name="email" 
                                                    noStyle
                                                    rules={[
                                                        { required: true, message: 'Vui lòng nhập email' },
                                                        { type: 'email', message: 'Email không hợp lệ' }
                                                    ]}
                                                >
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Giới tính:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="gioitinh" noStyle>
                                                    <Radio.Group className="w-full flex justify-between">
                                                        <Radio value="Nam">Nam</Radio>
                                                        <Radio value="Nữ">Nữ</Radio>
                                                        <Radio value="Khác">Khác</Radio>
                                                    </Radio.Group>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Ngày sinh:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="ngaysinh" noStyle>
                                                    <DatePicker 
                                                        format="DD-MM-YYYY"
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16} className="mt-4">
                                            <Col span={6}>
                                                <div className="font-medium text-right pr-4 pt-2 mb-[-8px]">Địa chỉ:</div>
                                            </Col>
                                            <Col span={18}>
                                                <Form.Item name="diachi" noStyle>
                                                    <Input.TextArea />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div className="flex gap-2 justify-end mt-6">
                                            <Button onClick={handleCancel}>
                                                Hủy
                                            </Button>
                                            <Button type="primary" htmlType="submit" loading={loading}>
                                                Cập nhật
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </>
                        ) : (
                            <p>Không có thông tin</p>
                        )}
                    </div>
                );
            case 'medical-record':
                return <div>Quản lý sổ đĩa chi (Đang phát triển)</div>;
            case 'vaccination-schedule':
                return <div>Lịch hẹn tiêm chủng (Đang phát triển)</div>;
            case 'vaccination-order':
                return <div>Đơn hàng tiêm chủng (Đang phát triển)</div>;
        }
    };

    if (loading) {
        return <div>Đang tải...</div>;
    }

    if (error) {
        return <div>Lỗi: {error}</div>;
    }

    return (
        <>
            <div className="container mx-auto py-8 text-center">
                <Row style={{ height: "100%" }}>
                    <Col span={6}>
                        <Menu
                            mode="inline"
                            defaultSelectedKeys={["1"]}
                            style={{ height: "100%", borderRight: 0 }}
                            onClick={({ key }) => handleMenuClick(key)}
                        >
                            <Menu.Item key="1" icon={<UserOutlined />}>
                                Thông tin cá nhân
                            </Menu.Item>
                            <Menu.Item key="2" icon={<ShoppingCartOutlined />}>
                                Đơn hàng của tôi
                            </Menu.Item>
                            <Menu.Item key="3" icon={<FileTextOutlined />}>
                                Quản lý sổ đĩa chi
                            </Menu.Item>
                            <Menu.Item key="4" icon={<MedicineBoxOutlined />}>
                                Lịch hẹn tiêm chủng
                            </Menu.Item>
                            <Menu.Item key="5" icon={<FileTextOutlined />}>
                                Đơn hàng tiêm chủng
                            </Menu.Item>
                            <Menu.Item key="6" icon={<LogoutOutlined />}>
                                Đăng xuất
                            </Menu.Item>
                        </Menu>
                    </Col>
                    <Col span={18}>
                        <div style={{ margin: "24px 16px 0", padding: 24, background: "#f0f2f5" }}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    {renderContent()}
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}