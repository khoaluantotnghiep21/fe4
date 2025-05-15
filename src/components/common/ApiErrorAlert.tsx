'use client';

import { useState, useEffect } from 'react';
import { Alert } from 'antd';

interface ApiErrorProps {
    error?: string;
    description?: string;
    onClose?: () => void;
    type?: 'warning' | 'error';
    autoHideDuration?: number;
}

const ApiErrorAlert: React.FC<ApiErrorProps> = ({
    error,
    description,
    onClose,
    type = 'error',
    autoHideDuration = 0,
}) => {
    const [visible, setVisible] = useState(!!error);

    useEffect(() => {
        setVisible(!!error);

        if (error && autoHideDuration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) onClose();
            }, autoHideDuration);

            return () => clearTimeout(timer);
        }
    }, [error, autoHideDuration, onClose]);

    if (!error || !visible) return null;

    return (
        <div className="mb-4">
            <Alert
                message={error}
                description={description}
                type={type}
                showIcon
                closable
                onClose={() => {
                    setVisible(false);
                    if (onClose) onClose();
                }}
            />
        </div>
    );
};

export default ApiErrorAlert; 