'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getAllDanhMuc, createCategory, updateCategory, deleteCategory, CategoryRequest } from '@/lib/api/danhMucApi';
import { getLoais, getLoaiMucByMaLoai } from '@/lib/api/loaiApi';
import { DanhMuc } from '@/types/danhmuc.types';
import { Loai } from '@/types/loai.types';

const { Title } = Typography;
const { confirm } = Modal;

const CategoryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [loais, setLoais] = useState<Loai[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<DanhMuc | null>(null);
  const [loaiNames, setLoaiNames] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<DanhMuc[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0); // Thêm state để force refresh component

  useEffect(() => {
    fetchCategories();
    fetchLoais();
  }, [refreshKey]); // Thêm refreshKey vào dependencies

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Lấy tất cả loại trước để có mapping đầy đủ
      const allLoais = await getLoais();
      console.log('All loais fetched:', allLoais);
      
      // Tạo mapping từ mã loại sang tên loại
      const loaiMapping: Record<string, string> = {};
      allLoais.forEach(loai => {
        loaiMapping[loai.maloai] = loai.tenloai;
      });
      console.log('Created loai mapping from all loais:', loaiMapping);
      
      // Lấy danh sách danh mục
      const data = await getAllDanhMuc();
      setCategories(data);
      
      // Kiểm tra nếu có mã loại nào trong danh mục mà không có trong mapping
      const uniqueMaLoais = Array.from(new Set(data.map(cat => cat.maloai)));
      console.log('Unique maloai values in categories:', uniqueMaLoais);
      
      // Tìm những mã loại không có trong mapping
      const missingMaLoais = uniqueMaLoais.filter(maloai => !loaiMapping[maloai]);
      
      if (missingMaLoais.length > 0) {
        console.log('Missing maloai values not in initial mapping:', missingMaLoais);
        
        // Tải thông tin loại cho những mã loại còn thiếu
        const missingLoaiPromises = missingMaLoais.map(async (maloai) => {
          try {
            const loaiData = await getLoaiMucByMaLoai(maloai);
            if (loaiData && loaiData.length > 0) {
              return { maloai, tenloai: loaiData[0].tenloai };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching loai for ${maloai}:`, err);
            return null;
          }
        });
        
        const missingLoaiResults = await Promise.all(missingLoaiPromises);
        
        // Thêm vào mapping
        missingLoaiResults.forEach(result => {
          if (result) {
            loaiMapping[result.maloai] = result.tenloai;
          }
        });
      }
      
      console.log('Final loaiNames mapping:', loaiMapping);
      setLoaiNames(loaiMapping);
      
      // Cập nhật danh sách đã lọc
      if (searchText) {
        handleSearch(searchText, data, loaiMapping);
      } else {
        setFilteredCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm tìm kiếm danh mục
  const handleSearch = (value: string, categoryList = categories, loaiMap = loaiNames) => {
    setSearchText(value);
    if (!value) {
      setFilteredCategories(categoryList);
      return;
    }
    
    const filtered = categoryList.filter(category => {
      const loaiName = loaiMap[category.maloai] || '';
      return (
        category.tendanhmuc.toLowerCase().includes(value.toLowerCase()) ||
        category.madanhmuc.toLowerCase().includes(value.toLowerCase()) ||
        loaiName.toLowerCase().includes(value.toLowerCase())
      );
    });
    
    setFilteredCategories(filtered);
  };

  const fetchLoais = async () => {
    try {
      const data = await getLoais();
      console.log('Fetched loais for dropdown:', data);
      setLoais(data);
    } catch (error) {
      console.error('Error fetching loais:', error);
      message.error('Không thể tải danh sách loại');
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    setModalMode('create');
    setSelectedCategory(null);
    setIsModalVisible(true);
  };

  const showEditModal = (category: DanhMuc) => {
    setModalMode('edit');
    setSelectedCategory(category);
    form.setFieldsValue({
      tendanhmuc: category.tendanhmuc,
      maloai: category.maloai,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (madanhmuc: string) => {
    console.log('Deleting category:', madanhmuc);
    setLoading(true);
    try {
      // Sử dụng API từ danhMucApi để xóa danh mục
      const success = await deleteCategory(madanhmuc);
      
      if (success) {
        // Hiển thị thông báo thành công
        message.success({
          content: 'Xóa danh mục thành công!',
          duration: 2,
          style: {
            marginTop: '50px'
          }
        });
        
        // Reset lại trang
        setSearchText('');
        setFilteredCategories([]);
        setRefreshKey(prevKey => prevKey + 1); // Force refresh component
      } else {
        message.error('Không thể xóa danh mục. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Đã có lỗi xảy ra khi xóa danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const categoryData: CategoryRequest = {
        tendanhmuc: values.tendanhmuc,
        maloai: values.maloai,
      };

      setLoading(true);
      
      if (modalMode === 'create') {
        const result = await createCategory(categoryData);
        if (result) {
          message.success({
            content: 'Thêm danh mục thành công!',
            duration: 2,
            style: {
              marginTop: '50px'
            }
          });
        }
      } else if (modalMode === 'edit' && selectedCategory) {
        const result = await updateCategory(selectedCategory.madanhmuc, categoryData);
        if (result) {
          message.success({
            content: 'Cập nhật danh mục thành công!',
            duration: 2,
            style: {
              marginTop: '50px'
            }
          });
        }
      }
      
      setIsModalVisible(false);
      // Reset lại trang
      setSearchText('');
      setFilteredCategories([]);
      setRefreshKey(prevKey => prevKey + 1); // Force refresh component
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      setLoading(false);
    }
  };

interface CategoryColumn {
    title: string;
    dataIndex?: string;
    key: string;
    width?: number;
    sorter?: (a: DanhMuc, b: DanhMuc) => number;
    render?: (value: any, record: DanhMuc) => React.ReactNode;
}

const columns: CategoryColumn[] = [
    {
        title: 'Mã danh mục',
        dataIndex: 'madanhmuc',
        key: 'madanhmuc',
        width: 150,
        sorter: (a: DanhMuc, b: DanhMuc) => a.madanhmuc.localeCompare(b.madanhmuc),
    },
    {
        title: 'Tên danh mục',
        dataIndex: 'tendanhmuc',
        key: 'tendanhmuc',
        sorter: (a: DanhMuc, b: DanhMuc) => a.tendanhmuc.localeCompare(b.tendanhmuc),
        render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
        title: 'Tên loại',
        key: 'tenloai',
        render: (_: any, record: DanhMuc) => {
            const loaiName = loaiNames[record.maloai];
            return loaiName || `Loại ${record.maloai}`;
        },
        sorter: (a: DanhMuc, b: DanhMuc) => {
            const loaiNameA = loaiNames[a.maloai] || `Loại ${a.maloai}`;
            const loaiNameB = loaiNames[b.maloai] || `Loại ${b.maloai}`;
            return loaiNameA.localeCompare(loaiNameB);
        },
    },
    {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        width: 200,
    },
    {
        title: 'Thao tác',
        key: 'action',
        width: 150,
        render: (_: any, record: DanhMuc) => (
            <Space size="small">
                <Button
                    icon={<EditOutlined />}
                    onClick={() => showEditModal(record)}
                >
                    Sửa
                </Button>
                <Popconfirm
                    title="Xác nhận xóa danh mục"
                    description="Bạn có chắc chắn muốn xóa danh mục này không?"
                    onConfirm={() => handleDelete(record.madanhmuc)}
                    okText="Xóa"
                    cancelText="Hủy"
                    icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                >
                    <Button 
                        danger 
                        icon={<DeleteOutlined />}
                    >
                        Xóa
                    </Button>
                </Popconfirm>
            </Space>
        ),
    },
];  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Title level={4}>Quản lý danh mục sản phẩm</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCreateModal}
        >
          Thêm danh mục mới
        </Button>
      </div>

      <div className="mb-4">
        <Row gutter={24}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm kiếm danh mục..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              value={searchText}
              allowClear
            />
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCategories}
        rowKey="madanhmuc"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showTotal: (total) => `Tổng số: ${total} danh mục`
        }}
        bordered
        size="middle"
        locale={{
          emptyText: searchText ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'
        }}
        className="category-table"
      />

      <Modal
        title={modalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
        okText={modalMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
        cancelText="Hủy"
        maskClosable={false}
        destroyOnClose
        bodyStyle={{ paddingTop: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          name="category_form"
          requiredMark="optional"
        >
          <Form.Item
            name="tendanhmuc"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" autoFocus />
          </Form.Item>
          
          <Form.Item
            name="maloai"
            label="Loại"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select 
              placeholder="Chọn loại"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
              }
              options={loais.map(loai => ({
                value: loai.maloai,
                label: loai.tenloai
              }))}
            />
          </Form.Item>
          
          {modalMode === 'edit' && selectedCategory && (
            <div style={{ marginTop: 8, color: '#666' }}>
              <p><strong>Mã danh mục:</strong> {selectedCategory.madanhmuc}</p>
              <p><strong>Slug:</strong> {selectedCategory.slug}</p>
            </div>
          )}
        </Form>
      </Modal>

      <style jsx global>{`
        .category-table .ant-table-tbody > tr > td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        .category-table .ant-table-thead > tr > th {
          background-color: #f7f7f7;
          font-weight: 600;
          padding: 12px 16px;
        }
        
        .category-table .ant-table-tbody > tr:hover > td {
          background-color: #f0f7ff;
        }
        
        @media (max-width: 768px) {
          .category-table .ant-table-tbody > tr > td,
          .category-table .ant-table-thead > tr > th {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryManagement;
