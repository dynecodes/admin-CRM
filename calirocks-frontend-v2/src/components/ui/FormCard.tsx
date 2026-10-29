import React from 'react';
import { Card } from 'flowbite-react';

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard: React.FC<FormCardProps> = ({ title, children, className = "" }) => {
  return (
    <Card className={className}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </Card>
  );
};

export default FormCard;