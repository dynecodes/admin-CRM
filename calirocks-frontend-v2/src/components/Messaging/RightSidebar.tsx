import React from 'react';
import { Search, CheckSquare, FileText, Bell } from 'lucide-react';

interface RightSidebarProps {
  onReminderClick: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ onReminderClick }) => {
  return (
    <div className="w-[60px] bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-6">
      {/* Search */}
      <button
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group"
        title="Search"
      >
        <Search size={20} />
        <span className="text-[9px] mt-0.5 font-medium">Search</span>
      </button>

      {/* Directory */}
      <button
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group"
        title="Directory"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span className="text-[9px] mt-0.5 font-medium">Directory</span>
      </button>

      {/* Files */}
      <button
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group"
        title="Files"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        <span className="text-[9px] mt-0.5 font-medium">Files</span>
      </button>

      {/* To-do */}
      <button
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group"
        title="To-do"
      >
        <CheckSquare size={20} />
        <span className="text-[9px] mt-0.5 font-medium">To-do</span>
      </button>

      {/* Notes */}
      <button
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group"
        title="Notes"
      >
        <FileText size={20} />
        <span className="text-[9px] mt-0.5 font-medium">Notes</span>
      </button>

      {/* Reminders - with purple indicator dot */}
      <button
        onClick={onReminderClick}
        className="w-10 h-10 flex flex-col items-center justify-center text-gray-600 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors group relative"
        title="Reminders"
      >
        <Bell size={20} />
        <span className="text-[9px] mt-0.5 font-medium">Reminders</span>
        {/* purple indicator dot */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full"></div>
      </button>
    </div>
  );
};

export default RightSidebar;