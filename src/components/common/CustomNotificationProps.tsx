'use client';

import { useEffect, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled, CloseOutlined } from '@ant-design/icons';

interface CustomNotificationProps {
  type: 'success' | 'error';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function CustomNotification({ 
  type, 
  message, 
  duration = 3000, 
  onClose 
}: CustomNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className={`custom-notification ${type} fixed top-4 right-4 z-50 flex items-center justify-between px-4 py-3 rounded shadow-md min-w-[300px] max-w-md animate-slideIn`}>
      <div className="flex items-center">
        {type === 'success' ? (
          <CheckCircleFilled className="text-white text-lg mr-2" />
        ) : (
          <CloseCircleFilled className="text-white text-lg mr-2" />
        )}
        <span className="text-white">{message}</span>
      </div>
      <button 
        onClick={handleClose} 
        className="text-white hover:text-gray-200 focus:outline-none ml-4"
      >
        <CloseOutlined />
      </button>

      <style jsx>{`
        .custom-notification {
          transition: all 0.3s ease-in-out;
        }
        .custom-notification.success {
          background-color: #4CAF50;
        }
        .custom-notification.error {
          background-color: #f44336;
        }
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s forwards;
        }
      `}</style>
    </div>
  );
}