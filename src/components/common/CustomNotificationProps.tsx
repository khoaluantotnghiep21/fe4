'use client';

import { useEffect, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled, CloseOutlined } from '@ant-design/icons';

interface CustomNotificationProps {
  type: 'success' | 'error';
  message: string;
  duration?: number;
  visible?: boolean;
  onClose?: () => void;
}

export default function CustomNotification({ 
  type, 
  message, 
  duration = 3000,
  visible: propVisible = true,
  onClose 
}: CustomNotificationProps) {
  const [isVisible, setIsVisible] = useState(propVisible);
  
  // Update internal visibility when prop changes
  useEffect(() => {
    setIsVisible(propVisible);
  }, [propVisible]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, message, isVisible]); 

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;
  
  // Define the styles based on notification type
  const backgroundColor = type === 'success' ? '#52c41a' : '#ff4d4f';
    return (
    <div 
      className={`fixed top-4 right-4 z-50 flex items-center justify-between px-4 py-3 rounded-md shadow-lg min-w-[300px] max-w-md custom-notification ${type === 'success' ? 'success' : 'error'}`}
      style={{ 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s forwards',
      }}
    >
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
      </button><style jsx>{`
        .custom-notification {
          transition: all 0.3s ease-in-out;
        }
        .custom-notification.success {
          background-color: #52c41a !important; /* Ant design success color */
          color: white;
        }
        .custom-notification.error {
          background-color: #ff4d4f !important; /* Ant design error color */
          color: white;
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