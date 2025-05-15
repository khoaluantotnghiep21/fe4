'use client';

import React from 'react';
import { Alert } from 'antd';

interface ErrorAlertProps {
    message: string;
    description?: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    showIcon?: boolean;
    closable?: boolean;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
    message,
    description,
    type = 'error',
    showIcon = true,
    closable = false
}) => {
    if (!message) return null;

    return (
        <div className="mb-4">
            <Alert
                message={message}
                description={description}
                type={type}
                showIcon={showIcon}
                closable={closable}
            />
        </div>
    );
};

export default ErrorAlert; 