'use client';

import Link from 'next/link';

export default function CategoryNotFound() {
    return (
        <div className="container mx-auto py-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Danh mục không tồn tại</h1>
            <p className="text-gray-600 mb-8">Danh mục bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link
                href="/"
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition"
            >
                Quay lại trang chủ
            </Link>
        </div>
    );
} 