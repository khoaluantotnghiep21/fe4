'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, Table, message } from 'antd';
import { getProducts } from '@/lib/api/productApi';
import axiosClient from '@/lib/axiosClient';

const paymentMethods = [
    { value: 'tienmat', label: 'Tiền mặt' },
    { value: 'chuyenkhoan', label: 'Chuyển khoản' },
];

const receiveMethods = [
    { value: 'taicuahang', label: 'Tại cửa hàng' },
    { value: 'giaotannoi', label: 'Giao tận nơi' },
];

export default function CreateOrderForm() {
    const [form] = Form.useForm();
    const [products, setProducts] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProducts().then(res => setProducts(res.data));
    }, []);

    // Thêm sản phẩm vào giỏ
    const handleAddToCart = () => {
        const { productId, quantity, donvitinh } = form.getFieldsValue(['productId', 'quantity', 'donvitinh']);
        if (!productId || !quantity || !donvitinh) {
            message.warning('Vui lòng chọn sản phẩm, đơn vị tính và nhập số lượng!');
            return;
        }
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const exist = cartItems.find(item => item.masanpham === productId && item.donvitinh === donvitinh);
        if (exist) {
            setCartItems(cartItems.map(item =>
                item.masanpham === productId && item.donvitinh === donvitinh
                    ? { ...item, soluong: item.soluong + quantity, giaban: product.gianhap, total: (item.soluong + quantity) * product.gianhap }
                    : item
            ));
        } else {
            setCartItems([
                ...cartItems,
                {
                    masanpham: productId,
                    tensanpham: product.tensanpham,
                    soluong: quantity,
                    giaban: product.gianhap,
                    donvitinh: donvitinh,
                    total: quantity * product.gianhap,
                }
            ]);
        }
        form.setFieldsValue({ productId: undefined, quantity: 1, donvitinh: undefined });
    };

    // Xóa sản phẩm khỏi giỏ
    const handleRemoveItem = (masanpham: string, donvitinh: string) => {
        setCartItems(cartItems.filter(item => !(item.masanpham === masanpham && item.donvitinh === donvitinh)));
    };

    // Tính tổng tiền
    const tongtien = cartItems.reduce((sum, item) => sum + item.total, 0);
    const giamgiatructiep = form.getFieldValue('giamgiatructiep') || 0;
    const phivanchuyen = form.getFieldValue('phivanchuyen') || 0;
    const thanhtien = tongtien - giamgiatructiep + phivanchuyen;

    // Tạo đơn hàng
    const handleCreateOrder = async () => {
        if (cartItems.length === 0) {
            message.warning('Vui lòng thêm sản phẩm vào giỏ hàng!');
            return;
        }
        try {
            setLoading(true);
            const values = form.getFieldsValue([
                'phuongthucthanhtoan',
                'hinhthucnhanhang',
                'mavoucher',
                'giamgiatructiep',
                'phivanchuyen',
                'machinhhanh'
            ]);
            const payload = {
                phuongthucthanhtoan: values.phuongthucthanhtoan,
                hinhthucnhanhang: values.hinhthucnhanhang,
                mavoucher: values.mavoucher || '',
                tongtien,
                giamgiatructiep: values.giamgiatructiep || 0,
                thanhtien,
                phivanchuyen: values.phivanchuyen || 0,
                machinhhanh: values.machinhhanh || 'CN001',
                details: cartItems.map(item => ({
                    masanpham: item.masanpham,
                    soluong: item.soluong,
                    giaban: item.giaban,
                    donvitinh: item.donvitinh,
                })),
            };
            await axiosClient.post('/purchase-order/createOrder', payload);
            message.success('Tạo đơn hàng thành công!');
            setCartItems([]);
            form.resetFields();
        } catch (error) {
            message.error('Tạo đơn hàng thất bại!');
        } finally {
            setLoading(false);
        }
    };

    // Lấy đơn vị tính của sản phẩm đã chọn
    const selectedProduct = products.find(p => p.id === form.getFieldValue('productId'));
    const donViTinhOptions = selectedProduct?.chitietdonvi?.map((dv: any) => ({
        value: dv.donvitinh,
        label: dv.donvitinh,
    })) || [];

    const columns = [
        { title: 'Sản phẩm', dataIndex: 'tensanpham', key: 'tensanpham' },
        { title: 'Đơn vị', dataIndex: 'donvitinh', key: 'donvitinh' },
        { title: 'Đơn giá', dataIndex: 'giaban', key: 'giaban', render: (v: number) => v.toLocaleString('vi-VN') + 'đ' },
        { title: 'Số lượng', dataIndex: 'soluong', key: 'soluong' },
        { title: 'Thành tiền', dataIndex: 'total', key: 'total', render: (v: number) => v.toLocaleString('vi-VN') + 'đ' },
        {
            title: '',
            key: 'action',
            render: (_: any, record: any) => (
                <Button danger size="small" onClick={() => handleRemoveItem(record.masanpham, record.donvitinh)}>
                    Xóa
                </Button>
            ),
        },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={{
                giamgiatructiep: 0,
                phivanchuyen: 0,
                quantity: 1,
            }}
        >
            <Card title="Thông tin đơn hàng" className="mb-4">
                <div className="flex gap-4 flex-wrap">
                    <Form.Item
                        name="phuongthucthanhtoan"
                        label="Phương thức thanh toán"
                        rules={[{ required: true, message: 'Chọn phương thức thanh toán!' }]}
                        style={{ minWidth: 220 }}
                    >
                        <Select options={paymentMethods} placeholder="Chọn phương thức" />
                    </Form.Item>
                    <Form.Item
                        name="hinhthucnhanhang"
                        label="Hình thức nhận hàng"
                        rules={[{ required: true, message: 'Chọn hình thức nhận hàng!' }]}
                        style={{ minWidth: 220 }}
                    >
                        <Select options={receiveMethods} placeholder="Chọn hình thức" />
                    </Form.Item>
                    <Form.Item name="mavoucher" label="Mã voucher" style={{ minWidth: 180 }}>
                        <Input placeholder="Nhập mã voucher (nếu có)" />
                    </Form.Item>
                    <Form.Item name="machinhhanh" label="Mã chi nhánh" style={{ minWidth: 180 }}>
                        <Input placeholder="Nhập mã chi nhánh" />
                    </Form.Item>
                </div>
            </Card>
            <Card title="Thêm sản phẩm" className="mb-4">
                <div className="flex gap-4 flex-wrap items-end">
                    <Form.Item
                        name="productId"
                        label="Sản phẩm"
                        rules={[{ required: true, message: 'Chọn sản phẩm!' }]}
                        style={{ minWidth: 250 }}
                    >
                        <Select
                            showSearch
                            placeholder="Chọn sản phẩm"
                            options={products.map(p => ({
                                value: p.id,
                                label: p.tensanpham,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="donvitinh"
                        label="Đơn vị tính"
                        rules={[{ required: true, message: 'Chọn đơn vị tính!' }]}
                        style={{ minWidth: 180 }}
                    >
                        <Select
                            placeholder="Chọn đơn vị"
                            options={
                                donViTinhOptions.length > 0
                                    ? donViTinhOptions
                                    : [{ value: 'hộp', label: 'hộp' }]
                            }

                        />
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập số lượng!' }]}
                        initialValue={1}
                        style={{ minWidth: 120 }}
                    >
                        <InputNumber min={1} />
                    </Form.Item>
                    <Button type="primary" onClick={handleAddToCart}>
                        Thêm vào giỏ hàng
                    </Button>
                </div>
            </Card>
            <Card title="Giỏ hàng">
                <Table
                    columns={columns}
                    dataSource={cartItems}
                    rowKey={r => r.masanpham + r.donvitinh}
                    pagination={false}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <strong>Tổng tiền</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <strong>{tongtien.toLocaleString('vi-VN')}đ</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                    )}
                />
                <div className="flex gap-4 mt-4 flex-wrap">
                    <Form.Item name="giamgiatructiep" label="Giảm giá trực tiếp" style={{ minWidth: 180 }}>
                        <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item name="phivanchuyen" label="Phí vận chuyển" style={{ minWidth: 180 }}>
                        <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item label="Thành tiền" style={{ minWidth: 180 }}>
                        <Input value={thanhtien.toLocaleString('vi-VN') + 'đ'} disabled />
                    </Form.Item>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button type="primary" size="large" loading={loading} onClick={handleCreateOrder}>
                        Tạo đơn hàng
                    </Button>
                </div>
            </Card>
        </Form>
    );
}