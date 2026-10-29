import React from 'react';
import { Dropdown, DropdownItem } from 'flowbite-react';

interface PaginationProps {
  totalItems: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  isMobile: boolean;
  itemsPerPage?: number;
  setItemsPerPage?: (perPage: number) => void;
  paginationOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
  isMobile,
  itemsPerPage,
  setItemsPerPage,
  paginationOptions = [10, 20, 50, 100]
}) => {
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5; // Show fewer pages on mobile
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
    };

  const handleItemsPerPageChange = (newPerPage: number) => {
    if (setItemsPerPage) {
      setItemsPerPage(newPerPage);
      setCurrentPage(1);
    }
  };

  const PaginationComponent = () => (
    <div className="flex items-center">
        <div className={`flex items-center border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden ${isMobile ? 'w-full' : ''}`}>
        <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center justify-center py-2 text-sm font-medium text-gray-500 bg-white border-r border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 cursor-pointer ${
            isMobile ? 'flex-1' : 'px-3'
            }`}
        >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>

        <div className={`flex ${isMobile ? 'flex-2' : ''}`}>
            {getVisiblePages().map(page => (
                <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center justify-center py-2 text-sm font-medium border-r border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer ${
                    isMobile ? 'flex-1 min-w-[35px]' : 'px-4'
                } ${
                    currentPage === page
                    ? 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                    : 'text-gray-700 bg-white hover:text-gray-900'
                }`}
                >
                {page}
                </button>
            ))}
            </div>

        <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center py-2 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 cursor-pointer ${
            isMobile ? 'flex-1' : 'px-3'
            } ${
            itemsPerPage && setItemsPerPage ? 'border-r border-gray-300' : ''
            }`}
        >
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>

        {itemsPerPage && setItemsPerPage && (
        <div className={`bg-white ${isMobile ? 'w-[110px]' : ''}`}>
            <Dropdown 
            label={`${itemsPerPage} / page`}
            dismissOnClick={true}
            size="sm"
            placement="bottom-end"
            theme={{
                floating: {
                target: `py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-0 border-0 cursor-pointer ${
                    isMobile ? 'w-full text-center px-1' : 'px-4 min-w-[120px]'
                }`,
                base: "z-50 rounded-md shadow-lg border border-gray-200 w-auto min-w-fit",
                },
            }}
            >
            {paginationOptions.map(option => (
                <DropdownItem 
                key={option}
                onClick={() => handleItemsPerPageChange(option)}
                >
                {`${option} / page`}
                </DropdownItem>
            ))}
            </Dropdown>
        </div>
        )}
        </div>
    </div>
    );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-end">
        <div className={isMobile ? "flex justify-end w-full" : ""}>
            <PaginationComponent />
        </div>
    </div>
    );
};

export default Pagination;