'use client';

import { useState, useEffect } from 'react';
import {
    Tabs, Table, Input, Button, Space, Modal, Descriptions, Tag, Typography, Row, Col, message,
    Form,
    Select
} from 'antd';
import {
    SearchOutlined, EyeOutlined, EditOutlined, CloseCircleOutlined, DeleteOutlined, PlusOutlined, LockOutlined
} from '@ant-design/icons';
import {
    getUsers, getUserRole, register, update, deleteUser, changePassword, getAllRoles, assignRole
} from "@/lib/api/userApi";
import type { ColumnsType } from 'antd/es/table';

export interface User {
    id: string;
    hoten: string;
    sodienthoai: string;
    matkhau: string;
    email: string;
    gioitinh?: string;
    ngaysinh?: string;
    sodiem?: number;
    diachi?: string;
    roles: string[];
}

const { TabPane } = Tabs;
const { Title } = Typography;

export default function UserManagement() {
    const [form] = Form.useForm();
    const [rolesList, setRolesList] = useState<{ id: string; namerole: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    useEffect(() => {
        if (editMode && selectedUser) {
            form.setFieldsValue({
                ...selectedUser,
                matkhau: '',
                roleid: selectedUser.roles.map(role => rolesList.find(r => r.namerole === role)?.id || ''),
            });
        } else if (addModalVisible) {
            form.resetFields();
        } else if (changePasswordVisible && selectedUser) {
            form.setFieldsValue({
                sodienthoai: selectedUser.sodienthoai,
                oldPassword: '',
                newPassword: '',
            });
        }
    }, [editMode, selectedUser, addModalVisible, changePasswordVisible, form, rolesList]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers();
            const usersWithRoles = await Promise.all(
                usersData.map(async (user: User) => {
                    if (!user.roles || user.roles.length === 0) {
                        const userWithRole = await getUserRole(user.id || user.sodienthoai);
                        return userWithRole ? { ...user, roles: userWithRole.roles } : { ...user, roles: [] };
                    }
                    return user;
                })
            );
            setUsers(usersWithRoles);
        } catch (error) {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        const roles = await getAllRoles();
        setRolesList(roles);
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            if (editMode && selectedUser) {
                const updatedUser = await update({
                    ...selectedUser,
                    ...values,
                    roles: values.roleid.map((roleId: string) => rolesList.find(r => r.id === roleId)?.namerole || '')
                });
                setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                message.success("Cập nhật người dùng thành công!");
            } else if (changePasswordVisible && selectedUser) {
                await changePassword(selectedUser.sodienthoai, values.oldPassword, values.newPassword);
                message.success("Đổi mật khẩu thành công!");
            } else {
                const newUser = await register(values);
                if (newUser && values.roleid) {
                    await Promise.all(values.roleid.map((roleid: string) =>
                        assignRole(newUser.id, roleid)
                    ));
                }
                setUsers([...users, newUser]);
                message.success("Thêm người dùng thành công!");
            }
            setAddModalVisible(false);
            setEditMode(false);
            setChangePasswordVisible(false);
            setSelectedUser(null);
            form.resetFields();
        } catch (err) {
            message.error("Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            await deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            message.success("Xóa người dùng thành công!");
        } catch (err) {
            message.error("Có lỗi xảy ra khi xóa!");
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<User> = [
        { title: 'Họ tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
        { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
        { title: 'Số điện thoại', dataIndex: 'sodienthoai', key: 'sodienthoai', width: 140 },
        { title: 'Giới tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 90, render: (gt: string | undefined) => gt || '-' },
        { title: 'Ngày sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 120, render: (ngaysinh: string | undefined) => ngaysinh ? new Date(ngaysinh).toLocaleDateString('vi-VN') : '-' },
        { title: 'Vai trò', dataIndex: 'roles', key: 'roles', width: 120, render: (roles: string[] | undefined) => Array.isArray(roles) && roles.length > 0 ? roles.map(role => <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>{role}</Tag>) : <Tag color="default">-</Tag> },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            align: 'center',
            render: (_: unknown, record: User) => (
                <Space size="small" wrap>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="middle"
                        shape="circle"
                        title="Chi tiết"
                        onClick={() => { setSelectedUser(record); setDetailModalVisible(true); }}
                        style={{ borderRadius: 6 }}
                    />
                    <Button
                        icon={<EditOutlined />}
                        size="middle"
                        shape="circle"
                        title="Sửa"
                        onClick={() => { setSelectedUser(record); setEditMode(true); }}
                        style={{ borderRadius: 6, background: '#f5f5f5', color: '#1890ff', border: 'none' }}
                    />
                    <Button
                        icon={<LockOutlined />}
                        size="middle"
                        shape="circle"
                        title="Đổi mật khẩu"
                        onClick={() => { setSelectedUser(record); setChangePasswordVisible(true); }}
                        style={{ borderRadius: 6, background: '#f0f0f0', color: '#d48806', border: 'none' }}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="middle"
                        shape="circle"
                        title="Xóa"
                        onClick={() => handleDelete(record.id)}
                        style={{ borderRadius: 6 }}
                    />
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(u =>
        (u.hoten?.toLowerCase() ?? '').includes(searchText.toLowerCase()) ||
        (u.email?.toLowerCase() ?? '').includes(searchText.toLowerCase()) ||
        (u.sodienthoai ?? '').includes(searchText)
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <Tabs defaultActiveKey="1" type="card">
                <TabPane tab="Danh sách người dùng" key="1">
                    <div className="mb-6 flex justify-between items-center relative">
                        <Input.Search
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                            style={{ width: 350 }}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={() => { }}
                            enterButton={<Button type="primary" icon={<SearchOutlined />}>Tìm kiếm</Button>}
                            size="middle"
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="middle"
                            onClick={() => setAddModalVisible(true)}
                        >
                            Thêm người dùng
                        </Button>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        rowKey="id"
                        loading={loading}
                        bordered
                        size="middle"
                        rowClassName={() => "user-row"}
                        pagination={{
                            total: filteredUsers.length,
                            pageSize: 10,
                            showTotal: (total) => `Tổng số: ${total} người dùng`,
                            showQuickJumper: true,
                            position: ['bottomRight']
                        }}
                        className="user-table"
                        scroll={{ x: 900 }}
                        locale={{
                            emptyText: loading ? 'Đang tải...' : 'Không có dữ liệu'
                        }}
                    />
                </TabPane>
            </Tabs>

            <Modal
                title={
                    <div className="flex items-center">
                        <Title level={4} style={{ margin: 0 }}>{selectedUser?.hoten}</Title>
                        {selectedUser?.roles?.map(role =>
                            <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ marginLeft: 12 }} key={role}>
                                {role}
                            </Tag>
                        )}
                    </div>
                }
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={600}
                style={{ top: 20 }}
                closeIcon={<CloseCircleOutlined />}
            >
                {selectedUser && (
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        labelStyle={{ fontWeight: 'bold', width: '120px' }}
                        contentStyle={{ padding: '8px 12px' }}
                    >
                        <Descriptions.Item label="Họ tên">{selectedUser.hoten}</Descriptions.Item>
                        <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{selectedUser.sodienthoai}</Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{selectedUser.gioitinh || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">{selectedUser.ngaysinh ? new Date(selectedUser.ngaysinh).toLocaleDateString('vi-VN') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{selectedUser.diachi || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Số điểm">{selectedUser.sodiem ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            {selectedUser.roles.map(role => <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>{role}</Tag>)}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            <Modal
                title="Đổi mật khẩu"
                open={changePasswordVisible}
                onCancel={() => {
                    setChangePasswordVisible(false);
                    setSelectedUser(null);
                    form.resetFields();
                }}
                footer={null}
                width={400}
                style={{ top: 40 }}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={async (values) => {
                        try {
                            setLoading(true);
                            await changePassword(selectedUser?.sodienthoai || '', values.oldPassword, values.newPassword);
                            message.success("Đổi mật khẩu thành công!");
                            setChangePasswordVisible(false);
                            setSelectedUser(null);
                            form.resetFields();
                        } catch (err) {
                            message.error("Mật khẩu cũ không đúng hoặc có lỗi xảy ra!");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    initialValues={{ sodienthoai: selectedUser?.sodienthoai }}
                >
                    <Form.Item
                        label="Số điện thoại"
                        name="sodienthoai"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu cũ"
                        name="oldPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editMode ? "Sửa người dùng" : "Thêm người dùng"}
                open={addModalVisible || editMode}
                onCancel={() => {
                    setAddModalVisible(false);
                    setEditMode(false);
                    setSelectedUser(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
                style={{ top: 20 }}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={editMode && selectedUser ? selectedUser : {}}
                >
                    <Form.Item
                        label="Họ tên"
                        name="hoten"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Số điện thoại"
                        name="sodienthoai"
                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Mật khẩu"
                        name="matkhau"
                        rules={!editMode ? [{ required: true, message: 'Vui lòng nhập mật khẩu!' }] : []}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        label="Giới tính"
                        name="gioitinh"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Ngày sinh"
                        name="ngaysinh"
                    >
                        <Input type="date" />
                    </Form.Item>
                    <Form.Item
                        label="Địa chỉ"
                        name="diachi"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Vai trò"
                        name="roleid"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn vai trò"
                            maxTagCount="responsive"
                        >
                            {rolesList.map(role => (
                                <Select.Option value={role.id} key={role.id}>{role.namerole}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            {editMode ? "Lưu thay đổi" : "Thêm mới"}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <style jsx global>{`
                @media (max-width: 900px) {
                    .user-table .ant-table { font-size: 13px; }
                    .user-table .ant-table-thead > tr > th,
                    .user-table .ant-table-tbody > tr > td { padding: 8px 6px; }
                    .user-table .ant-table-cell { min-width: 100px; }
                    .user-table .ant-table-cell:nth-child(3) {
                        min-width: 160px !important;
                        max-width: 220px !important;
                        white-space: normal;
                    }
                    .ant-tabs-nav-list { flex-wrap: wrap; }
                }
                @media (max-width: 600px) {
                    .user-table .ant-table-cell { font-size: 12px; min-width: 80px; }
                    .user-table .ant-table-cell:nth-child(3) {
                        min-width: 120px !important;
                        max-width: 180px !important;
                    }
                    .ant-btn { min-width: 32px !important; padding: 0 !important; }
                    .ant-tabs-nav-list { flex-wrap: wrap; }
                }
            `}</style>
        </div>
    );
}