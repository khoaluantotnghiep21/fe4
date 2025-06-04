'use client';
import { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, InputNumber, Switch, Select, Card, Spin, Modal, Typography, Row, Col, message } from 'antd';
import { SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { createProduct } from '@/lib/api/productApi';
import { getAllDanhMuc } from '@/lib/api/danhMucApi';
import { getAllThuongHieu } from '@/lib/api/thuongHieuApi';
import { getAllKhuyenMai } from '@/lib/api/khuyenMaiApi';
import dayjs from 'dayjs';
import { DanhMuc } from '@/types/danhmuc.types';
import { ThuongHieu } from '@/types/thuonghieu.types';
import { KhuyenMai } from '@/types/khuyenmai.types';

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

export default function AddProductForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
    const [thuongHieuList, setThuongHieuList] = useState<ThuongHieu[]>([]);
    const [khuyenMaiList, setKhuyenMaiList] = useState<KhuyenMai[]>([]);

    useEffect(() => {
        getAllDanhMuc().then(setDanhMucList);
        getAllThuongHieu().then(setThuongHieuList);
        getAllKhuyenMai().then(setKhuyenMaiList);
    }, []);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            const formattedValues = {
                ...values,
                ngaysanxuat: values.ngaysanxuat ? values.ngaysanxuat.format('YYYY-MM-DD') : undefined,
            };
            await createProduct(formattedValues);
            onSuccess();
        } catch (error) {
            message.error('Có lỗi xảy ra khi thêm sản phẩm!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Card title="Thông tin cơ bản" bordered={false} className="mb-6">
                            <Form.Item name="tensanpham" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}><Input /></Form.Item>
                            <Form.Item name="masanpham" label="Mã sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}><Input /></Form.Item>
                            <Form.Item name="dangbaoche" label="Dạng bào chế" rules={[{ required: true, message: 'Vui lòng nhập dạng bào chế' }]}><Input /></Form.Item>
                            <Form.Item name="motangan" label="Mô tả ngắn" rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn' }]}><TextArea rows={4} /></Form.Item>
                            <Form.Item name="congdung" label="Công dụng" rules={[{ required: true, message: 'Vui lòng nhập công dụng' }]}><TextArea rows={2} /></Form.Item>
                            <Form.Item name="chidinh" label="Chỉ định" rules={[{ required: true, message: 'Vui lòng nhập chỉ định' }]}><TextArea rows={2} /></Form.Item>
                            <Form.Item name="chongchidinh" label="Chống chỉ định" rules={[{ required: true, message: 'Vui lòng nhập chống chỉ định' }]}><TextArea rows={2} /></Form.Item>
                            <Form.Item name="doituongsudung" label="Đối tượng sử dụng" rules={[{ required: true, message: 'Vui lòng nhập đối tượng sử dụng' }]}><TextArea rows={2} /></Form.Item>
                            <Form.Item name="luuy" label="Lưu ý" rules={[{ required: true, message: 'Vui lòng nhập lưu ý' }]}><TextArea rows={2} /></Form.Item>

                            <Form.Item name="madanhmuc" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                                <Select showSearch placeholder="Chọn danh mục" options={danhMucList.map(dm => ({ value: dm.madanhmuc, label: dm.tendanhmuc }))} />
                            </Form.Item>
                            <Form.Item name="mathuonghieu" label="Thương hiệu" rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}>
                                <Select showSearch placeholder="Chọn thương hiệu" options={thuongHieuList.map(th => ({ value: th.mathuonghieu, label: th.tenthuonghieu }))} />
                            </Form.Item>
                            <Form.Item name="machuongtrinh" label="Chương trình khuyến mãi">
                                <Select showSearch placeholder="Chọn chương trình khuyến mãi" allowClear options={khuyenMaiList.map(km => ({ value: km.machuongtrinh, label: km.tenchuongtrinh }))} />
                            </Form.Item>
                            <Form.Item name="thuockedon" label="Thuốc kê đơn" valuePropName="checked"><Switch checkedChildren="Có" unCheckedChildren="Không" /></Form.Item>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Thông tin thời gian & giá" bordered={false}>
                            <Form.Item name="ngaysanxuat" label="Ngày sản xuất" rules={[{ required: true, message: 'Vui lòng chọn ngày sản xuất' }]}>
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                            <Form.Item name="hansudung" label="Hạn sử dụng (ngày)" rules={[{ required: true, message: 'Vui lòng nhập hạn sử dụng' }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                            <Form.Item name="gianhap" label="Giá nhập" rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                            <Form.Item name="congdung" label="Công dụng" rules={[{ required: true, message: 'Vui lòng nhập công dụng' }]}>
                                <TextArea rows={2} />
                            </Form.Item>
                            <Form.Item name="chidinh" label="Chỉ định" rules={[{ required: true, message: 'Vui lòng nhập chỉ định' }]}>
                                <TextArea rows={2} />
                            </Form.Item>
                            <Form.Item name="chongchidinh" label="Chống chỉ định" rules={[{ required: true, message: 'Vui lòng nhập chống chỉ định' }]}>
                                <TextArea rows={2} />
                            </Form.Item>
                            <Form.Item name="doituongsudung" label="Đối tượng sử dụng" rules={[{ required: true, message: 'Vui lòng nhập đối tượng sử dụng' }]}>
                                <TextArea rows={2} />
                            </Form.Item>
                            <Form.Item name="luuy" label="Lưu ý" rules={[{ required: true, message: 'Vui lòng nhập lưu ý' }]}>
                                <TextArea rows={2} />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
                {/* Thêm các trường khác như thành phần, đơn vị tính, công dụng, chỉ định, chống chỉ định, đối tượng sử dụng, lưu ý... */}
                <Row>
                    <Col span={24} style={{ textAlign: 'right' }}>
                        <Button onClick={onCancel} icon={<CloseCircleOutlined />} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Thêm sản phẩm</Button>
                    </Col>
                </Row>
            </Form>
        </Spin>
    );
}