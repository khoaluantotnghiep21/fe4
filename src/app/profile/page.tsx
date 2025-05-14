"use client";

import { Menu, Button, Row, Col } from "antd";
import {
    UserOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    LogoutOutlined,
} from "@ant-design/icons";

export default function Profile() {
    return (
        <>
            <div className="container mx-auto py-8 text-center">
                <Row style={{ height: "100%" }}>
                    <Col span={6}>
                        <Menu
                            mode="inline"
                            defaultSelectedKeys={["1"]}
                            style={{ height: "100%", borderRight: 0 }}
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
                                <Col span={12}>
                                    <div className="bg-white p-4 rounded-lg shadow">
                                        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
                                        <p>Họ và tên: Kim Phượng</p>
                                        <p>Số điện thoại: 0582489694</p>
                                        <p>Giới tính: Nữ</p>
                                        <p>Ngày sinh: Thêm thông tin</p>
                                        <Button type="primary" className="mt-2">
                                            Chỉnh sửa thông tin
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
}