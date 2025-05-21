'use client';

import React, { useState } from 'react';
import { Button, Space } from 'antd';
import ApiErrorAlert from '../common/ApiErrorAlert';
import { AuthErrors } from '@/lib/api/authApi';

const ApiErrorExample: React.FC = () => {
    const [error, setError] = useState<string | undefined>();
    const [errorType, setErrorType] = useState<'warning' | 'error'>('error');
    const [errorDesc, setErrorDesc] = useState<string | undefined>();

    const showLoginError = () => {
        setError(AuthErrors.LOGIN_ERROR);
        setErrorDesc('Vui lòng kiểm tra thông tin đăng nhập và thử lại.');
        setErrorType('error');
    };

    const showWarning = () => {
        setError('Cảnh báo hệ thống');
        setErrorDesc('Hệ thống đang bảo trì, một số chức năng có thể không hoạt động bình thường.');
        setErrorType('warning');
    };

    const showNetworkError = () => {
        setError('Lỗi kết nối mạng');
        setErrorDesc('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.');
        setErrorType('error');
    };

    const clearError = () => {
        setError(undefined);
        setErrorDesc(undefined);
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold mb-4">API Error Alert Examples</h2>

            <ApiErrorAlert
                error={error}
                description={errorDesc}
                type={errorType}
                onClose={clearError}
            />

            <Space direction="vertical" className="w-full">
                <Button onClick={showLoginError} type="primary" danger>
                    Show Login Error
                </Button>

                <Button onClick={showWarning} type="primary" className="bg-yellow-500">
                    Show Warning
                </Button>

                <Button onClick={showNetworkError} type="primary" danger>
                    Show Network Error
                </Button>

                <Button onClick={clearError} type="default">
                    Clear Errors
                </Button>
            </Space>
        </div>
    );
};

export default ApiErrorExample; 