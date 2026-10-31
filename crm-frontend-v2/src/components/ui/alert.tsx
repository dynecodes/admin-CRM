import React from 'react';

interface AlertProps {
  type?: 'info' | 'success' | 'error' | 'warning';
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose, className = '' }) => {
  const typeStyles = {
    success: 'border-green-300 bg-green-50 text-green-800',
    error: 'border-red-300 bg-red-50 text-red-800',
    warning: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    info: 'border-red-300 bg-blue-50 text-blue-800'
  };

  return (
    <div className={`border-l-4 p-4 ${typeStyles[type]} ${className}`}>
      <div className="flex">
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-lg leading-none hover:opacity-70"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;