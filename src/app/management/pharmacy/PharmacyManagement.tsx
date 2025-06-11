'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  message,
  Popconfirm,
  Card,
  Tabs,
  Row,
  Col,
  Select,
  Spin,
} from 'antd';

const { Column } = Table;
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { 
  Pharmacy,
  getAllPharmacies,
  createNewPharmacy,
  updatePharmacy,
  deletePharmacy,
  findPharmacyByProvinces,
  findOne,
  PharmacyEmployee,
  getListEmployeesInPharmacy,
  addEmployee,
  removeEmployee,
  getAllEmployee
} from '../../../lib/api/pharmacyService';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;
const { Option } = Select;

export default function PharmacyManagement() {
  const [form] = Form.useForm();
  const [employeeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentPage, setCurrentPage] = useState(1);

  // State for search
  const [searchForm] = Form.useForm();
  const [searchProvince, setSearchProvince] = useState<string>('');
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  
  // State for detail view
  const [activeTab, setActiveTab] = useState('1');
  const [detailView, setDetailView] = useState(false);
  const [detailTabKey, setDetailTabKey] = useState('1');

  // State for employee management
  const [employees, setEmployees] = useState<PharmacyEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [allEmployees, setAllEmployees] = useState<PharmacyEmployee[]>([]);
  const [loadingAllEmployees, setLoadingAllEmployees] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const data = await getAllPharmacies();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      message.error('Không thể tải danh sách nhà thuốc');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (pharmacyId: string) => {
    setLoadingEmployees(true);
    try {
      const data = await getListEmployeesInPharmacy(pharmacyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingAllEmployees(true);
    try {
      const data = await getAllEmployee();
      setAllEmployees(data || []);
    } catch (error) {
      console.error('Error fetching all employees:', error);
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoadingAllEmployees(false);
    }
  };

  const showCreateModal = () => {
    setModalMode('create');
    setSelectedPharmacy(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (pharmacy: Pharmacy) => {
    setModalMode('edit');
    setSelectedPharmacy(pharmacy);
    form.setFieldsValue({
      thanhpho: pharmacy.thanhpho,
      quan: pharmacy.quan,
      phuong: pharmacy.phuong,
      tenduong: pharmacy.tenduong,
      diachicuthe: pharmacy.diachicuthe,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      setLoading(true);
      
      if (modalMode === 'create') {
        const result = await createNewPharmacy(values);
        if (result) {
          message.success('Thêm nhà thuốc mới thành công!');
        } else {
          message.error('Thêm nhà thuốc thất bại');
        }
      } else if (modalMode === 'edit' && selectedPharmacy) {
        const result = await updatePharmacy(selectedPharmacy.machinhanh, values);
        if (result) {
          message.success('Cập nhật nhà thuốc thành công!');
        } else {
          message.error('Cập nhật nhà thuốc thất bại');
        }
      }
      
      setIsModalVisible(false);
      fetchPharmacies();
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (machinhanh: string) => {
    if (!machinhanh) {
      message.error('Không thể xóa: Mã chi nhánh không hợp lệ');
      return;
    }

    try {
      // Đặt loading state
      message.loading({ content: 'Đang xóa...', key: 'deleteLoading' });
      
      // Debug: log mã chi nhánh
      console.log('Đang xóa nhà thuốc với mã:', machinhanh);
      
      // Gọi API xóa
      const success = await deletePharmacy(machinhanh);
      
      if (success) {
        message.success({ content: 'Xóa nhà thuốc thành công!', key: 'deleteLoading', duration: 2 });
        // Nếu đang ở tab chi tiết và xóa thành công, quay lại tab danh sách
        if (activeTab === '2') {
          setActiveTab('1');
          setDetailView(false);
        }
        await fetchPharmacies();
      } else {
        message.error({ 
          content: 'Xóa nhà thuốc thất bại. Nhà thuốc này có thể đang được sử dụng hoặc không tồn tại.', 
          key: 'deleteLoading', 
          duration: 3 
        });
      }
    } catch (error) {
      console.error('Error deleting pharmacy:', error);
      message.error({ 
        content: 'Xóa nhà thuốc thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'), 
        key: 'deleteLoading', 
        duration: 3 
      });
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchLoading(true);
    
    try {
      if (!values.searchText) {
        // Nếu không có giá trị tìm kiếm, hiển thị tất cả
        await fetchPharmacies();
        return;
      }
      
      // Lấy tất cả nhà thuốc
      const allPharmacies = await getAllPharmacies();
      
      // Biến đổi searchText thành chữ thường để so sánh không phân biệt hoa thường
      const searchTextLower = values.searchText.toLowerCase();
      
      // Tìm kiếm client-side: Lọc dựa trên tất cả các trường
      const filteredData = allPharmacies.filter(pharmacy => {
        // Tìm kiếm trong tất cả các trường thông tin và xử lý trường hợp giá trị null hoặc undefined
        return (
          (pharmacy.thanhpho || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.quan || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.phuong || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.tenduong || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.diachicuthe || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.machinhanh || '').toLowerCase().includes(searchTextLower) ||
          (pharmacy.diachi || '').toLowerCase().includes(searchTextLower)
        );
      });
      
      setPharmacies(filteredData);
      
      if (filteredData.length === 0) {
        message.info('Không tìm thấy kết quả phù hợp');
      }
    } catch (error) {
      console.error('Error searching pharmacies:', error);
      message.error('Lỗi khi tìm kiếm nhà thuốc');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = async (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setDetailView(true);
    setActiveTab('2');
    await fetchEmployees(pharmacy.id);
  };
  
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === '1') {
      setDetailView(false);
    } else if (key === '2' && selectedPharmacy) {
      // Khi chuyển sang tab chi tiết, tải danh sách nhân viên
      fetchEmployees(selectedPharmacy.id);
    }
  };

  const resetSearch = () => {
    searchForm.resetFields();
    fetchPharmacies();
  };

  const handleEmployeeSelectChange = (value: string[]) => {
    setSelectedEmployees(value);
  };

  const handleAddEmployees = async () => {
    if (!selectedPharmacy) return;

    try {
      // Gọi API thêm nhân viên vào nhà thuốc
  
      const results = await Promise.all(
        selectedEmployees.map(employeeId => addEmployee({ idnhathuoc: selectedPharmacy.id, idnhanvien: employeeId }))
      );
      
      // Kiểm tra kết quả từng nhân viên
      const successCount = results.filter(result => result).length;
      if (successCount > 0) {
        message.success(`Đã thêm ${successCount} nhân viên vào nhà thuốc`);
        // Cập nhật lại danh sách nhân viên
        await fetchEmployees(selectedPharmacy.id);
        // Clear selection
        setSelectedEmployees([]);
      } else {
        message.error('Không thể thêm nhân viên vào nhà thuốc');
      }
    } catch (error) {
      console.error('Error adding employees:', error);
      message.error('Lỗi khi thêm nhân viên vào nhà thuốc');
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!selectedPharmacy) return;

    try {
      // Confirm before deleting
      if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này khỏi nhà thuốc?')) {
        return;
      }
      
      // Gọi API xóa nhân viên khỏi nhà thuốc
      const data = {idnhathuoc: selectedPharmacy.id, idnhanvien: employeeId}
      const success = await removeEmployee(data);
      
      if (success) {
        message.success('Đã xóa nhân viên khỏi nhà thuốc');
        // Cập nhật lại danh sách nhân viên
        await fetchEmployees(selectedPharmacy.id);
      } else {
        message.error('Không thể xóa nhân viên khỏi nhà thuốc');
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      message.error('Lỗi khi xóa nhân viên khỏi nhà thuốc');
    }
  };

  const columns: ColumnsType<Pharmacy> = [
    {
      title: 'Mã chi nhánh',
      dataIndex: 'machinhanh',
      key: 'machinhanh',
      width: 150,
    },
    {
      title: 'Thành phố',
      dataIndex: 'thanhpho',
      key: 'thanhpho',
      sorter: (a, b) => a.thanhpho.localeCompare(b.thanhpho),
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'quan',
      key: 'quan',
      width: 150,
    },
    {
      title: 'Phường/Xã',
      dataIndex: 'phuong',
      key: 'phuong',
      width: 150,
    },
    {
      title: 'Tên đường',
      dataIndex: 'tenduong',
      key: 'tenduong',
      width: 200,
    },
    {
      title: 'Địa chỉ cụ thể',
      dataIndex: 'diachicuthe',
      key: 'diachicuthe',
      width: 250,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          >
            Sửa
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => {
              if (record && record.machinhanh) {
                if (window.confirm('Bạn có chắc chắn muốn xóa nhà thuốc này?')) {
                  handleDelete(record.machinhanh);
                }
              }
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
        {
          key: "1",
          label: "Danh sách nhà thuốc",
          children: (
            <>
              <div className="mb-4 flex justify-between items-center">
                <Title level={4}>Quản lý nhà thuốc</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showCreateModal}
                >
                  Thêm nhà thuốc mới
                </Button>
              </div>

              <Card className="mb-4">
                <Form form={searchForm} layout="inline" onFinish={handleSearch} className="flex flex-wrap gap-2">
                  <Form.Item name="searchText" label="Tìm kiếm" className="flex-grow min-w-[250px] sm:w-auto md:flex-grow-0 md:w-[300px]">
                    <Input 
                      placeholder="Tìm kiếm theo thành phố, quận, địa chỉ..." 
                      prefix={<SearchOutlined />}
                      allowClear
                    />
                  </Form.Item>
                  <Form.Item className="mb-0">
                    <Button type="primary" htmlType="submit" loading={searchLoading}>
                      Tìm kiếm
                    </Button>
                  </Form.Item>
                  <Form.Item className="mb-0">
                    <Button onClick={resetSearch}>
                      Đặt lại
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Table
                columns={columns}
                dataSource={pharmacies}
                rowKey="machinhanh"
                loading={loading}
                pagination={{
                  current: currentPage,
                  onChange: (page) => setCurrentPage(page),
                  pageSize: 10,
                  showSizeChanger: false,
                }}
              />
            </>
          )
        },
        {
          key: "2",
          label: "Chi tiết nhà thuốc",
          disabled: !detailView,
          children: (
                      <div className="mb-4">
                        {selectedPharmacy && (
                          <React.Fragment>
                            <Tabs defaultActiveKey="1" className="mb-4">
                              <TabPane tab="Thông tin chung" key="1">
                                <Card className="mb-4">
                                  <Title level={4}>Thông tin nhà thuốc</Title>
                                  <Row gutter={16}>
                                    <Col span={12}>
                                      <p><strong>Mã chi nhánh:</strong> {selectedPharmacy.machinhanh}</p>
                                      <p><strong>Thành phố:</strong> {selectedPharmacy.thanhpho}</p>
                                      <p><strong>Quận/Huyện:</strong> {selectedPharmacy.quan}</p>
                                    </Col>
                                    <Col span={12}>
                                      <p><strong>Phường/Xã:</strong> {selectedPharmacy.phuong}</p>
                                      <p><strong>Tên đường:</strong> {selectedPharmacy.tenduong}</p>
                                      <p><strong>Địa chỉ cụ thể:</strong> {selectedPharmacy.diachicuthe}</p>
                                    </Col>
                                  </Row>
                                  <Row className="mt-4">
                                    <Col span={24}>
                                      <p><strong>Địa chỉ đầy đủ:</strong> {selectedPharmacy.diachi || 
                                        `${selectedPharmacy.diachicuthe}, ${selectedPharmacy.tenduong}, ${selectedPharmacy.phuong}, ${selectedPharmacy.quan}, ${selectedPharmacy.thanhpho}`}</p>
                                    </Col>
                                  </Row>
                                </Card>
                              </TabPane>
                              <TabPane tab="Quản lý nhân viên" key="2">
                                <Card>
                                  <div className="flex justify-between items-center mb-4">
                                    <Title level={4}>Danh sách nhân viên</Title>
                                    <Button 
                                      type="primary"
                                      icon={<PlusOutlined />}
                                      onClick={() => {
                                        setIsAddEmployeeModalVisible(true);
                                        fetchAllEmployees();
                                      }}
                                    >
                                      Thêm nhân viên
                                    </Button>
                                  </div>
                                  
                                  <Table
                                    dataSource={employees}
                                    rowKey="id"
                                    loading={loadingEmployees}
                                    pagination={false}
                                  >
                                    <Column title="Họ tên" dataIndex="hoten" key="hoten" />
                                    <Column title="Email" dataIndex="email" key="email" />
                                    <Column title="Số điện thoại" dataIndex="sodienthoai" key="sodienthoai" />
                                    <Column title="Ngày sinh" dataIndex="ngaysinh" key="ngaysinh" 
                                      render={(text) => text ? new Date(text).toLocaleDateString('vi-VN') : ''}
                                    />
                                    <Column title="Giới tính" dataIndex="gioitinh" key="gioitinh" />
                                    <Column title="Thao tác" key="action" render={(_, record) => (
                                      <Space size="small">
                                        <Button 
                                          danger 
                                          icon={<DeleteOutlined />}
                                          onClick={() => handleRemoveEmployee(record.id)}
                                        >
                                          Xóa
                                        </Button>
                                      </Space>
                                    )} />
                                  </Table>
                                </Card>
                              </TabPane>
                            </Tabs>
          
                            <div className="flex justify-end gap-2">
                              <Button 
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => showEditModal(selectedPharmacy)}
                              >
                                Chỉnh sửa
                              </Button>
                              <Button 
                                danger 
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  if (selectedPharmacy && selectedPharmacy.machinhanh) {
                                    if (window.confirm('Bạn có chắc chắn muốn xóa nhà thuốc này?')) {
                                      handleDelete(selectedPharmacy.machinhanh);
                                    }
                                  }
                                }}
                              >
                                Xóa
                              </Button>
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    )
        }
      ]} />
      
      <Modal
        title={modalMode === 'create' ? 'Thêm nhà thuốc mới' : 'Chỉnh sửa thông tin nhà thuốc'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          name="pharmacy_form"
        >
          <Form.Item
            name="thanhpho"
            label="Thành phố"
            rules={[{ required: true, message: 'Vui lòng nhập tên thành phố' }]}
          >
            <Input placeholder="Nhập tên thành phố" />
          </Form.Item>
          
          <Form.Item
            name="quan"
            label="Quận/Huyện"
            rules={[{ required: true, message: 'Vui lòng nhập tên quận/huyện' }]}
          >
            <Input placeholder="Nhập tên quận/huyện" />
          </Form.Item>
          
          <Form.Item
            name="phuong"
            label="Phường/Xã"
            rules={[{ required: true, message: 'Vui lòng nhập tên phường/xã' }]}
          >
            <Input placeholder="Nhập tên phường/xã" />
          </Form.Item>
          
          <Form.Item
            name="tenduong"
            label="Tên đường"
            rules={[{ required: true, message: 'Vui lòng nhập tên đường' }]}
          >
            <Input placeholder="Nhập tên đường" />
          </Form.Item>
          
          <Form.Item
            name="diachicuthe"
            label="Địa chỉ cụ thể"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}
          >
            <Input placeholder="Nhập địa chỉ cụ thể (số nhà, tòa nhà...)" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal for adding employees */}
      <Modal
        title="Thêm nhân viên vào nhà thuốc"
        open={isAddEmployeeModalVisible}
        onCancel={() => setIsAddEmployeeModalVisible(false)}
        footer={null}
      >
        <Form 
          layout="vertical" 
          onFinish={() => {
            handleAddEmployees();
            setIsAddEmployeeModalVisible(false);
          }}
        >
          <Form.Item label="Chọn nhân viên" name="employees" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhân viên' }]}>
            <Select
              mode="multiple"
              placeholder="Chọn nhân viên"
              onChange={handleEmployeeSelectChange}
              loading={loadingAllEmployees}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              options={allEmployees.map(employee => ({
                value: employee.id,
                label: `${employee.hoten || 'Nhân viên'}${employee.email ? ` - ${employee.email}` : ''}${employee.sodienthoai ? ` - ${employee.sodienthoai}` : ''}`
              }))}
            ></Select>
          </Form.Item>
          
          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsAddEmployeeModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={loadingAllEmployees}>
                Thêm
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
