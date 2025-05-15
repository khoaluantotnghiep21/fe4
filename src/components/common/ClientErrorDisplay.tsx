'use client';

import React from 'react';
import { Alert } from 'antd';

interface ClientErrorDisplayProps {
    error: string;
}

const ClientErrorDisplay: React.FC<ClientErrorDisplayProps> = ({ error }) => {
    if (!error) return null;

    return (
        <div className="mb-4">
            <Alert
                message={error}
                type="error"
                showIcon
            />
        </div>
    );
};

export default ClientErrorDisplay; 