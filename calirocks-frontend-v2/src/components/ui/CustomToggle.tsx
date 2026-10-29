import React from 'react';

interface CustomToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const CustomToggle: React.FC<CustomToggleProps> = ({ 
  checked, 
  onChange, 
  label, 
  size = 'md',
  disabled = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4 sm:w-9 sm:h-5',
    md: 'w-10 h-5 sm:w-11 sm:h-6'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3 sm:h-4 sm:w-4',
    md: 'h-4 w-4 sm:h-5 sm:w-5'
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        className={`${sizeClasses[size]} rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 ${
          checked ? 'bg-gray-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span
          className={`${thumbSizeClasses[size]} bg-white rounded-full shadow transform transition-transform duration-200 ${
            checked ? 'translate-x-full' : 'translate-x-0'
          } absolute top-0.5 left-0.5`}
        />
      </button>
      {label && (
        <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-900 ">
          {label}
        </span>
      )}
    </div>
  );
};

export default CustomToggle;