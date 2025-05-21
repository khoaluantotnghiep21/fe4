'use client';

import React from 'react';
import { Alert } from 'antd';

interface ClientErrorDisplayProps {
    title: string;
    message: string;
}

const ClientErrorDisplay: React.FC<ClientErrorDisplayProps> = ({ title, message }) => {
    if (!title || !message) return null;

    return (
        <div className="mb-4">
            <Alert
                message={message}
                type="error"
                showIcon
            />
        </div>
    );
};

export default ClientErrorDisplay; 