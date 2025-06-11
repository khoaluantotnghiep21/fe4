'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Modal, Typography, Space, Input, Select, DatePicker, Pagination, Tabs, Spin, Empty, Tooltip, message, Badge } from 'antd';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ShopOutlined, CalendarOutlined, UserOutlined, InboxOutlined } from '@ant-design/icons';
import { useUser } from '@/context/UserContext';
import { getPharmacyByEmployeeId } from '@/lib/api/pharmacyService';
import { getListPharmacyProducts, getListProductInPharmacy, updateReceiptStatus } from '@/lib/api/receiveApi';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Interface for product receipt
interface ProductReceipt {
  manhaphang: string;
  ngaygui: string;
  tinhtrang: string;
  nguoi_gui: string;
  danhsach_sanpham: ReceiptProduct[];
}

// Interface for receipt product
interface ReceiptProduct {
  machinhanh: string;
  masanpham: string;
  soluong: number;
  tensanpham: string;
}

// Interface for pharmacy product
interface PharmacyProduct {
  machinhanh: string;
  masanpham: string;
  soluong: number;
  userid: string;
  ngaygui: string;
  tinhtrang: string;
  manhaphang: string;
  tensanpham: string;
  nguoicapnhat: string;
  email_nguoi_capnhat: string;
}

// Interface for pharmacy data
interface PharmacyData {
  id: string;
  idnhathuoc: string;
  machinhanh: string;
  diachi: string;
  thanhpho: string;
  quan: string;
  phuong?: string;
  tenduong?: string;
  diachicuthe?: string;
}

const ProductReceiptManagement = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [receipts, setReceipts] = useState<ProductReceipt[]>([]);
  const [pharmacyProducts, setPharmacyProducts] = useState<PharmacyProduct[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ProductReceipt | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch pharmacy data for the current user
  useEffect(() => {
    const fetchPharmacyData = async () => {
      try {
        if (user?.id) {
          setLoading(true);
          const pharmacyData = await getPharmacyByEmployeeId(user.id);
          
          if (pharmacyData && pharmacyData.length > 0) {
            setPharmacy(pharmacyData[0]);
            // Load receipts once we have the pharmacy data
            fetchReceipts(pharmacyData[0].machinhanh);
          } else {
            message.error('Không tìm thấy thông tin chi nhánh cho nhân viên này!');
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy data:', error);
        message.error('Lỗi khi lấy thông tin chi nhánh!');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacyData();
  }, [user]);

  // Fetch receipt data
  const fetchReceipts = async (branchCode: string) => {
    try {
      setLoading(true);
      const response = await getListPharmacyProducts({
        page: pagination.current,
        take: pagination.pageSize
      });
      
      setReceipts(response.data as unknown as ProductReceipt[]);
      setPagination(prev => ({
        ...prev,
        total: response.meta.total
      }));
    } catch (error) {
      console.error('Error fetching receipts:', error);
      message.error('Lỗi khi tải danh sách đơn nhập hàng!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for a specific receipt
  const fetchProductsForReceipt = async (receiptCode: string) => {
    try {
      if (!pharmacy?.machinhanh) return;
      
      setLoading(true);
      const response = await getListProductInPharmacy(pharmacy.machinhanh);
      
      // Filter products by receipt code
      const filteredProducts = ((response.data as unknown) as PharmacyProduct[]).filter(
        (product: PharmacyProduct) => product.manhaphang === receiptCode
      );
      
      setPharmacyProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products for receipt:', error);
      message.error('Lỗi khi tải danh sách sản phẩm trong đơn nhập hàng!');
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (manhaphang: string, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      console.log(`Attempting to update receipt ${manhaphang} with action: ${action}`);
      await updateReceiptStatus(manhaphang);
      
      const actionText = action === 'approve' ? 'duyệt' : 'từ chối';
      message.success(`Đã ${actionText} đơn nhập hàng thành công!`);
      
      // Refresh receipt data
      if (pharmacy?.machinhanh) {
        fetchReceipts(pharmacy.machinhanh);
      }
      
      // Close detail modal if open
      setDetailModalVisible(false);
    } catch (error: any) {
      console.error('Error updating receipt status:', error);
      // Display the specific error message if available
      const errorMessage = error.message || 'Lỗi khi cập nhật trạng thái đơn hàng!';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
    
    if (pharmacy?.machinhanh) {
      fetchReceipts(pharmacy.machinhanh);
    }
  };

  // Handle view receipt details
  const handleViewDetails = (record: ProductReceipt) => {
    setSelectedReceipt(record);
    fetchProductsForReceipt(record.manhaphang);
    setDetailModalVisible(true);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    
    if (pharmacy?.machinhanh) {
      fetchReceipts(pharmacy.machinhanh);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    
    if (pharmacy?.machinhanh) {
      fetchReceipts(pharmacy.machinhanh);
    }
  };

  // Filter receipts based on search and filters
  const getFilteredReceipts = () => {
    let filtered = [...receipts];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.tinhtrang === statusFilter);
    }
    
    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        receipt => 
          receipt.manhaphang.toLowerCase().includes(searchText.toLowerCase()) ||
          receipt.nguoi_gui.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(receipt => {
        const receiptDate = dayjs(receipt.ngaygui);
        return receiptDate.isAfter(startDate) && receiptDate.isBefore(endDate);
      });
    }
    
    return filtered;
  };

  // Columns for receipts table
  const receiptColumns = [
    {
      title: 'Mã nhập hàng',
      dataIndex: 'manhaphang',
      key: 'manhaphang',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'ngaygui',
      key: 'ngaygui',
      render: (date: string) => (
        <span>
          <CalendarOutlined className="mr-1" />
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: 'Người gửi',
      dataIndex: 'nguoi_gui',
      key: 'nguoi_gui',
      render: (text: string) => (
        <span>
          <UserOutlined className="mr-1" />
          {text}
        </span>
    )
    } as {
    title: string;
    key: string;
    render: (text: string, record: ProductReceipt) => React.ReactNode;
    },
    {
    title: 'Số sản phẩm',
    key: 'soSanPham',
    render: (_: unknown, record: ProductReceipt) => (
      <Badge count={record.danhsach_sanpham.length} showZero color="#108ee9" />
    )
    } as {
    title: string;
    key: string;
    render: (_: unknown, record: ProductReceipt) => React.ReactNode;
    },
    {
    title: 'Trạng thái',
    dataIndex: 'tinhtrang',
    key: 'tinhtrang',
    render: (status: string) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Đã duyệt':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'Đã từ chối':
            color = 'error';
            icon = <CloseCircleOutlined />;
            break;
          case 'Chưa duyệt':
            color = 'processing';
            icon = <Spin size="small" />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: ProductReceipt) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
          {record.tinhtrang === 'Chưa duyệt' && (
            <>
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateStatus(record.manhaphang, 'approve')} 
                className="bg-green-600 hover:bg-green-700"
              >
                Duyệt
              </Button>
              <Button 
                type="primary" 
                danger 
                size="small" 
                icon={<CloseCircleOutlined />}
                onClick={() => handleUpdateStatus(record.manhaphang, 'reject')}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  // Columns for product detail table
  const productColumns = [
    {
      title: 'Mã sản phẩm',
      dataIndex: 'masanpham',
      key: 'masanpham',
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'tensanpham',
      key: 'tensanpham',
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'soluong',
      key: 'soluong',
      align: 'center' as 'center',
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'machinhanh',
      key: 'machinhanh',
      render: (text: string) => (
        <span>
          <ShopOutlined className="mr-1" />
          {text}
        </span>
      )
    }
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">Quản lý đơn nhập hàng</Title>
      
      <Card className="mb-6 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <Input.Search
              placeholder="Tìm kiếm theo mã đơn hoặc người gửi"
              allowClear
              enterButton="Tìm kiếm"
              size="large"
              className="max-w-md"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={handleSearch}
              prefix={<SearchOutlined />}
            />
          </div>
          
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
            <RangePicker 
              size="large"
              onChange={handleDateRangeChange}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
            />
            
            <Select
              size="large"
              className="min-w-[150px]"
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'Chưa duyệt', label: 'Chưa duyệt' },
                { value: 'Đã duyệt', label: 'Đã duyệt' },
                { value: 'Đã từ chối', label: 'Đã từ chối' }
              ]}
            />
          </div>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          className="border rounded-md"
        >
          <TabPane tab="Tất cả đơn nhập hàng" key="1">
            <div className="overflow-x-auto">
              <Table
                dataSource={getFilteredReceipts()}
                columns={receiptColumns}
                rowKey="manhaphang"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty 
                      description="Không có đơn nhập hàng nào" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )
                }}
              />
            </div>
            
            <div className="mt-4 flex justify-end">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePaginationChange}
                showSizeChanger
                showQuickJumper
                showTotal={total => `Tổng ${total} đơn nhập hàng`}
              />
            </div>
          </TabPane>
          
          <TabPane tab="Chưa duyệt" key="2">
            <div className="overflow-x-auto">
              <Table
                dataSource={receipts.filter(r => r.tinhtrang === 'Chưa duyệt')}
                columns={receiptColumns}
                rowKey="manhaphang"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty 
                      description="Không có đơn nhập hàng nào chưa duyệt" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )
                }}
              />
            </div>
          </TabPane>
          
          <TabPane tab="Đã duyệt" key="3">
            <div className="overflow-x-auto">
              <Table
                dataSource={receipts.filter(r => r.tinhtrang === 'Đã duyệt')}
                columns={receiptColumns}
                rowKey="manhaphang"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty 
                      description="Không có đơn nhập hàng nào đã duyệt" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )
                }}
              />
            </div>
          </TabPane>
          
          <TabPane tab="Đã từ chối" key="4">
            <div className="overflow-x-auto">
              <Table
                dataSource={receipts.filter(r => r.tinhtrang === 'Đã từ chối')}
                columns={receiptColumns}
                rowKey="manhaphang"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty 
                      description="Không có đơn nhập hàng nào đã từ chối" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <InboxOutlined style={{ fontSize: '20px' }} />
            <span>Chi tiết đơn nhập hàng: {selectedReceipt?.manhaphang}</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedReceipt?.tinhtrang === 'Chưa duyệt' && (
            <Button 
              key="approve" 
              type="primary" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleUpdateStatus(selectedReceipt.manhaphang, 'approve')}
            >
              <CheckCircleOutlined /> Duyệt đơn hàng
            </Button>
          ),
          selectedReceipt?.tinhtrang === 'Chưa duyệt' && (
            <Button 
              key="reject" 
              type="primary" 
              danger
              onClick={() => handleUpdateStatus(selectedReceipt.manhaphang, 'reject')}
            >
              <CloseCircleOutlined /> Từ chối đơn hàng
            </Button>
          )
        ]}
      >
        {selectedReceipt && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Text strong>Mã đơn nhập hàng:</Text> {selectedReceipt.manhaphang}
              </div>
              <div>
                <Text strong>Ngày gửi:</Text> {dayjs(selectedReceipt.ngaygui).format('DD/MM/YYYY')}
              </div>
              <div>
                <Text strong>Người gửi:</Text> {selectedReceipt.nguoi_gui}
              </div>
              <div>
                <Text strong>Trạng thái:</Text>{' '}
                <Tag 
                  color={
                    selectedReceipt.tinhtrang === 'Đã duyệt' ? 'success' : 
                    selectedReceipt.tinhtrang === 'Đã từ chối' ? 'error' : 'processing'
                  }
                >
                  {selectedReceipt.tinhtrang}
                </Tag>
              </div>
            </div>
            
            <Title level={5} className="mb-3 mt-5">Danh sách sản phẩm</Title>
            <Table
              dataSource={pharmacyProducts.length > 0 ? pharmacyProducts : selectedReceipt.danhsach_sanpham}
              columns={productColumns}
              rowKey="masanpham"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductReceiptManagement;
