'use client';

import { useState, useEffect, FC } from 'react';
import {
    Tabs, Table, Input, Button, Space, Modal, Descriptions, Tag, Typography, Row, Col, message,
    Form, Select,
} from 'antd';
import {
    SearchOutlined, EyeOutlined, EditOutlined, CloseCircleOutlined, LockOutlined,
} from '@ant-design/icons';
import {
    getUsers, getUserRole, register, updateWithRole, changePassword, getAllRoles, assignRoles,
} from '@/lib/api/userApi';
import axiosClient from '@/lib/axiosClient';
import type { ColumnsType } from 'antd/es/table';

interface User {
    id: string;
    hoten: string;
    sodienthoai: string;
    matkhau?: string;
    email: string;
    gioitinh?: string;
    ngaysinh?: string;
    sodiem?: number;
    diachi?: string;
    roles: string[];
}

interface Role {
    id: string;
    namerole: string;
}

const { TabPane } = Tabs;
const { Title } = Typography;

const UserManagement: FC = () => {
    const [form] = Form.useForm();
    const [roleForm] = Form.useForm();
    const [rolesList, setRolesList] = useState<Role[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<User[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState<boolean>(false);
    const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    useEffect(() => {
        if (editMode && selectedUser) {
            const userRoleIds = selectedUser.roles
                .map((roleName) => rolesList.find((r) => r.namerole === roleName)?.id)
                .filter((id): id is string => !!id);

            form.setFieldsValue({
                ...selectedUser,
                roles: userRoleIds,
                matkhau: '',
            });
        } else if (addModalVisible) {
            form.resetFields();
        } else if (changePasswordVisible && selectedUser) {
            form.setFieldsValue({
                sodienthoai: selectedUser.sodienthoai,
                oldPassword: '',
                newPassword: '',
            });
        } else if (roleModalVisible && selectedUser) {
            const userRoleIds = selectedUser.roles
                .map((roleName) => rolesList.find((r) => r.namerole === roleName)?.id)
                .filter((id): id is string => !!id);

            roleForm.setFieldsValue({
                roleid: userRoleIds,
            });
        }
    }, [editMode, selectedUser, addModalVisible, changePasswordVisible, roleModalVisible, form, roleForm, rolesList]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers();
            const usersWithRoles = await Promise.all(
                usersData.map(async (user: User) => {
                    const roleRes = await axiosClient.get(`/UserRole/getUserRoles/${user.id}`);
                    const roles = Array.isArray(roleRes.data?.data)
                        ? roleRes.data.data.map((r: Role) => r.namerole)
                        : [];
                    return { ...user, roles };
                }),
            );
            setUsers(usersWithRoles);

        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            message.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const roles = await getAllRoles();
            if (Array.isArray(roles) && roles.length > 0) {
                setRolesList(roles);
                return;
            }

            // Fallback to direct axios call if getAllRoles fails
            const response = await axiosClient.get('/UserRole/all');
            const fallbackRoles = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
            setRolesList(fallbackRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            message.error('Lỗi khi tải danh sách vai trò');
            setRolesList([]);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            let userId = selectedUser?.id;
            if (editMode && selectedUser) {
                await updateWithRole({
                    ...selectedUser,
                    ...values,
                    roleids: values.roles,
                });
                message.success('Cập nhật thành công!');
            } else {
                const newUser = await register(values);
                userId = newUser.id;
                await updateWithRole({
                    ...values,
                    id: userId,
                    roleids: values.roles,
                });
                message.success('Thêm người dùng thành công!');
            }
            setAddModalVisible(false);
            setEditMode(false);
            setSelectedUser(null);
            form.resetFields();
            await fetchUsers();
        } catch (error) {
            console.error('Error submitting user:', error);
            message.error('Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSubmit = async (values: { roleid: string[] }) => {
        try {
            setLoading(true);
            if (selectedUser && values.roleid) {
                const success = await assignRoles(selectedUser.id, values.roleid);
                if (success) {
                    const roleNames = values.roleid
                        .map((roleId) => rolesList.find((r) => r.id === roleId)?.namerole)
                        .filter((name): name is string => !!name);

                    const updatedUser = {
                        ...selectedUser,
                        roles: roleNames,
                    };

                    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
                    setRoleModalVisible(false);
                    roleForm.resetFields();
                    setSelectedUser(null);
                    message.success('Cập nhật vai trò thành công!');
                } else {
                    message.error('Không thể cập nhật vai trò!');
                }
            }
        } catch (error) {
            console.error('Error updating roles:', error);
            message.error('Có lỗi khi cập nhật vai trò!');
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<User> = [
        { title: 'Họ tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
        { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
        { title: 'Số điện thoại', dataIndex: 'sodienthoai', key: 'sodienthoai', width: 140 },
        {
            title: 'Giới tính',
            dataIndex: 'gioitinh',
            key: 'gioitinh',
            width: 90,
            render: (gt: string | undefined) => gt || '-',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'ngaysinh',
            key: 'ngaysinh',
            width: 120,
            render: (ngaysinh: string | undefined) =>
                ngaysinh ? new Date(ngaysinh).toLocaleDateString('vi-VN') : '-',
        },
        {
            title: 'Vai trò',
            dataIndex: 'roles',
            key: 'roles',
            width: 120,
            render: (roles: string[] | undefined) =>
                Array.isArray(roles) && roles.length > 0
                    ? roles.map((role) => (
                        <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>
                            {role}
                        </Tag>
                    ))
                    : <Tag color="default">-</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 200,
            align: 'center',
            render: (_: unknown, record: User) => (
                <Space size="small" wrap>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="middle"
                        shape="circle"
                        title="Chi tiết"
                        onClick={() => {
                            setSelectedUser(record);
                            setDetailModalVisible(true);
                        }}
                        style={{ borderRadius: 6 }}
                    />
                    <Button
                        icon={<EditOutlined />}
                        size="middle"
                        shape="circle"
                        title="Sửa"
                        onClick={() => {
                            setSelectedUser(record);
                            setEditMode(true);
                            setAddModalVisible(true);
                        }}
                        style={{ borderRadius: 6, background: '#f5f5f5', color: '#1890ff', border: 'none' }}
                    />
                    <Button
                        icon={<LockOutlined />}
                        size="middle"
                        shape="circle"
                        title="Đổi mật khẩu"
                        onClick={() => {
                            setSelectedUser(record);
                            setChangePasswordVisible(true);
                        }}
                        style={{ borderRadius: 6, background: '#f0f0f0', color: '#d48806', border: 'none' }}
                    />
                    <Button
                        icon={<SearchOutlined />}
                        size="middle"
                        shape="circle"
                        title="Quản lý vai trò"
                        onClick={() => {
                            setSelectedUser(record);
                            setRoleModalVisible(true);
                        }}
                        style={{ borderRadius: 6, background: '#e6f7ff', color: '#1890ff', border: 'none' }}
                    />
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(
        (u) =>
            u.hoten?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.sodienthoai?.includes(searchText),
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <Tabs defaultActiveKey="1" type="card">
                <TabPane tab="Danh sách người dùng" key="1">
                    <div className="mb-6 flex justify-between items-center">
                        <Input.Search
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                            style={{ width: 350 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            enterButton={<Button type="primary" icon={<SearchOutlined />}>Tìm kiếm</Button>}
                            size="middle"
                        />
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
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
                        pagination={{
                            total: filteredUsers.length,
                            pageSize: 10,
                            showTotal: (total) => `Tổng số: ${total} người dùng`,
                            showQuickJumper: true,
                            position: ['bottomRight'],
                        }}
                        scroll={{ x: 900 }}
                        locale={{
                            emptyText: loading ? 'Đang tải...' : 'Không có dữ liệu',
                        }}
                    />
                </TabPane>
            </Tabs>

            <Modal
                title={
                    <div className="flex items-center">
                        <Title level={4} style={{ margin: 0 }}>
                            {selectedUser?.hoten}
                        </Title>
                        {selectedUser?.roles?.map((role) => (
                            <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ marginLeft: 12 }} key={role}>
                                {role}
                            </Tag>
                        ))}
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
                        <Descriptions.Item label="Ngày sinh">
                            {selectedUser.ngaysinh ? new Date(selectedUser.ngaysinh).toLocaleDateString('vi-VN') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{selectedUser.diachi || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Số điểm">{selectedUser.sodiem ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            {selectedUser.roles.map((role) => (
                                <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>
                                    {role}
                                </Tag>
                            ))}
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
                    onFinish={async (values: { oldPassword: string; newPassword: string }) => {
                        try {
                            setLoading(true);
                            await changePassword(selectedUser?.sodienthoai || '', values.oldPassword, values.newPassword);
                            message.success('Đổi mật khẩu thành công!');
                            setChangePasswordVisible(false);
                            setSelectedUser(null);
                            form.resetFields();
                        } catch (error) {
                            console.error('Error changing password:', error);
                            message.error('Mật khẩu cũ không đúng hoặc có lỗi xảy ra!');
                        } finally {
                            setLoading(false);
                        }
                    }}
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
                title={editMode ? 'Sửa người dùng' : 'Thêm người dùng'}
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
                            { type: 'email', message: 'Email không hợp lệ!' },
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
                    {!editMode && (
                        <Form.Item
                            label="Mật khẩu"
                            name="matkhau"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item label="Giới tính" name="gioitinh">
                        <Input />
                    </Form.Item>
                    <Form.Item label="Ngày sinh" name="ngaysinh">
                        <Input type="date" />
                    </Form.Item>
                    <Form.Item label="Địa chỉ" name="diachi">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Vai trò"
                        name="roles"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn vai trò"
                            options={rolesList.map((role) => ({
                                label: role.namerole,
                                value: role.id,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            {editMode ? 'Lưu thay đổi' : 'Thêm mới'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center">
                        <Title level={4} style={{ margin: 0 }}>
                            Quản lý vai trò: {selectedUser?.hoten}
                        </Title>
                    </div>
                }
                open={roleModalVisible}
                onCancel={() => {
                    setRoleModalVisible(false);
                    setSelectedUser(null);
                    roleForm.resetFields();
                }}
                footer={null}
                width={500}
                style={{ top: 20 }}
                destroyOnClose
            >
                <Form
                    form={roleForm}
                    layout="vertical"
                    onFinish={handleRoleSubmit}
                >
                    {selectedUser && (
                        <Descriptions
                            bordered
                            size="small"
                            column={1}
                            labelStyle={{ fontWeight: 'bold', width: '120px' }}
                            contentStyle={{ padding: '8px 12px' }}
                            style={{ marginBottom: 24 }}
                        >
                            <Descriptions.Item label="Người dùng">{selectedUser.hoten}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                            <Descriptions.Item label="Vai trò hiện tại">
                                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                                    selectedUser.roles.map((role) => (
                                        <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>
                                            {role}
                                        </Tag>
                                    ))
                                ) : (
                                    <Tag color="default">Chưa có vai trò</Tag>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    )}

                    <Form.Item
                        label="Chọn vai trò"
                        name="roleid"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn vai trò"
                            options={rolesList.map((role) => ({
                                label: role.namerole,
                                value: role.id,
                            }))}
                            loading={rolesList.length === 0}
                            onClick={() => {
                                if (rolesList.length === 0) {
                                    message.info('Đang tải lại danh sách vai trò...');
                                    fetchRoles();
                                }
                            }}
                        />
                    </Form.Item>
                    <div className="flex justify-between mt-4">
                        <Button
                            onClick={() => {
                                setRoleModalVisible(false);
                                setSelectedUser(null);
                                roleForm.resetFields();
                            }}
                        >
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Lưu và cập nhật vai trò
                        </Button>
                    </div>
                </Form>
            </Modal>

            <style jsx global>{`
        @media (max-width: 900px) {
          .ant-table {
            font-size: 13px;
          }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 8px 6px;
          }
          .ant-table-cell {
            min-width: 100px;
          }
          .ant-table-cell:nth-child(3) {
            min-width: 160px !important;
            max-width: 220px !important;
            white-space: normal;
          }
          .ant-tabs-nav-list {
            flex-wrap: wrap;
          }
        }
        @media (max-width: 600px) {
          .ant-table-cell {
            font-size: 12px;
            min-width: 80px;
          }
          .ant-table-cell:nth-child(3) {
            min-width: 120px !important;
            max-width: 180px !important;
          }
          .ant-btn {
            min-width: 32px !important;
            padding: 0 !important;
          }
          .ant-tabs-nav-list {
            flex-wrap: wrap;
          }
        }
      `}</style>
        </div>
    );
};

export default UserManagement;