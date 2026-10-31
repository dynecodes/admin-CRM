// src/components/ui/AppDataTable/FilterSection.tsx
import React from "react";
import { Dropdown, DropdownItem } from "flowbite-react";

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
  sortFn?: (a: any, b: any) => number;
}

interface FilterSectionProps {
  showSearch: boolean;
  search: string;
  setSearch: (search: string) => void;
  searchPlaceholder: string;

  showFilter: boolean;
  filterOptions?: FilterOption[];
  filterKey?: string;
  filterLabel: string;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  setCurrentPage: (page: number) => void;

  showSort: boolean;
  sortOptions?: SortOption[];
  sortBy: string;
  setSortBy: (sort: string) => void;

  customFilters?: React.ReactNode;

  additionalFilterOptions?: Array<{ id: number; name: string }>;
  additionalFilterLabel?: string;
  showAdditionalFilter?: boolean;
  additionalFilterValue?: number | null;
  onAdditionalFilterChange?: (value: number | null) => void;
  additionalFilterShowAll?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  showSearch,
  search,
  setSearch,
  searchPlaceholder,
  showFilter,
  filterOptions,
  filterKey,
  filterLabel,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
  showSort,
  sortOptions,
  sortBy,
  setSortBy,
  customFilters,
  additionalFilterOptions,
  additionalFilterLabel = "Filter",
  showAdditionalFilter = false,
  additionalFilterValue,
  onAdditionalFilterChange,
  additionalFilterShowAll = true,
}) => {
  const getAdditionalFilterLabel = () => {
    if (!additionalFilterOptions || additionalFilterOptions.length === 0) {
      return additionalFilterLabel;
    }

    if (additionalFilterShowAll) {
      return additionalFilterValue
        ? additionalFilterOptions.find((s) => s.id === additionalFilterValue)
            ?.name || `All ${additionalFilterLabel}s`
        : `All ${additionalFilterLabel}s`;
    }

    // When we don't show "All", just show the current option (or the first one)
    return (
      additionalFilterOptions.find((s) => s.id === additionalFilterValue)
        ?.name || additionalFilterOptions[0].name
    );
  };

  const showAnyControls =
    (showFilter && filterOptions) ||
    (showSort && sortOptions) ||
    showAdditionalFilter ||
    customFilters;

  return (
    <div className="p-4 sm:p-7 bg-gray-50 border border-gray-200 rounded-md">
      {showSearch && (
        <form className="mx-auto mb-3">
          <label
            htmlFor="default-search"
            className="mb-2 text-sm font-medium text-gray-900 sr-only"
          >
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              {/* keep search icon */}
              <svg
                className="w-4 h-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              id="default-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-md bg-white focus:ring-gray-500 focus:border-gray-500"
              placeholder={searchPlaceholder}
            />
          </div>
        </form>
      )}

      {showAnyControls && (
        <>
          {/* DESKTOP: everything on one row (wrapping if needed) */}
          <div className="hidden sm:flex flex-nowrap items-center gap-4">
            {/* ===== Filter by ===== */}
            {showFilter && filterOptions && filterKey && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {filterLabel}:
                </div>
                <Dropdown
                  label={
                    filterOptions.find((opt) => opt.value === statusFilter)
                      ?.label || "All"
                  }
                  dismissOnClick={true}
                  size="sm"
                  placement="bottom"
                  theme={{
                    floating: {
                      target:
                        "bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                      base: "z-50 rounded-md shadow-md",
                    },
                  }}
                >
                  {filterOptions.map((option) => (
                    <DropdownItem
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setCurrentPage(1);
                      }}
                    >
                      {option.label}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            )}

            {/* ===== Sort by ===== */}
            {showSort && sortOptions && (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  Sort by:
                </div>
                <Dropdown
                  label={
                    sortOptions.find((opt) => opt.value === sortBy)?.label ||
                    "Default"
                  }
                  dismissOnClick={true}
                  size="sm"
                  placement="bottom"
                  theme={{
                    floating: {
                      target:
                        "bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                      base: "z-50 rounded-md shadow-md",
                    },
                  }}
                >
                  {sortOptions.map((option) => (
                    <DropdownItem
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setCurrentPage(1);
                      }}
                    >
                      {option.label}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            )}

            {/* ===== Optional legacy additional filter (if any) ===== */}
            {showAdditionalFilter &&
              additionalFilterOptions &&
              onAdditionalFilterChange && (
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {additionalFilterLabel}:
                  </div>
                  <Dropdown
                    label={getAdditionalFilterLabel()}
                    dismissOnClick={true}
                    size="sm"
                    placement="bottom"
                    theme={{
                      floating: {
                        target:
                          "w-full justify-between bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer",
                        base: "z-50 rounded-md shadow-md",
                      },
                    }}
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {additionalFilterShowAll && (
                        <DropdownItem
                          onClick={() => {
                            onAdditionalFilterChange(null);
                            setCurrentPage(1);
                          }}
                        >
                          All {additionalFilterLabel}s
                        </DropdownItem>
                      )}
                      {additionalFilterOptions.map((option) => (
                        <DropdownItem
                          key={option.id}
                          onClick={() => {
                            onAdditionalFilterChange(option.id);
                            setCurrentPage(1);
                          }}
                        >
                          {option.name}
                        </DropdownItem>
                      ))}
                    </div>
                  </Dropdown>
                </div>
              )}

            {/* ===== Custom filters (Blocked, Location, Recurrence, etc.) ===== */}
            {customFilters && (
              <div className="flex flex-wrap items-center gap-4">
                {customFilters}
              </div>
            )}
          </div>

          {/* MOBILE: keep stacked layout, but no icons in labels */}
          <fieldset className="sm:hidden mt-2 border border-gray-300 rounded-md p-3 overflow-visible relative">
            <legend className="text-xs text-gray-500 px-2">Options</legend>
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                {showFilter && filterOptions && filterKey && (
                  <div className="flex-1 space-y-1 relative">
                    <div className="text-xs text-gray-500">
                      {filterLabel}:
                    </div>
                    <div className="relative z-50">
                      <Dropdown
                        label={
                          filterOptions.find(
                            (opt) => opt.value === statusFilter
                          )?.label || "All"
                        }
                        dismissOnClick={true}
                        size="sm"
                        placement="bottom-start"
                        theme={{
                          floating: {
                            target:
                              "w-full bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900",
                            base: "z-[9999] rounded-md shadow-md fixed",
                          },
                        }}
                      >
                        {filterOptions.map((option) => (
                          <DropdownItem
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value);
                              setCurrentPage(1);
                            }}
                          >
                            {option.label}
                          </DropdownItem>
                        ))}
                      </Dropdown>
                    </div>
                  </div>
                )}

                {showSort && sortOptions && (
                  <div className="flex-1 space-y-1 relative">
                    <div className="text-xs text-gray-500">Sort by:</div>
                    <div className="relative z-50">
                      <Dropdown
                        label={
                          sortOptions.find((opt) => opt.value === sortBy)
                            ?.label || "Default"
                        }
                        dismissOnClick={true}
                        size="sm"
                        placement="bottom-start"
                        theme={{
                          floating: {
                            target:
                              "w-full bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900",
                            base: "z-[9999] rounded-md shadow-md fixed",
                          },
                        }}
                      >
                        {sortOptions.map((option) => (
                          <DropdownItem
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setCurrentPage(1);
                            }}
                          >
                            {option.label}
                          </DropdownItem>
                        ))}
                      </Dropdown>
                    </div>
                  </div>
                )}
              </div>

              {showAdditionalFilter &&
                additionalFilterOptions &&
                onAdditionalFilterChange && (
                  <div className="flex-1 space-y-1 relative">
                    <div className="text-xs text-gray-500">
                      {additionalFilterLabel}:
                    </div>
                    <div className="relative z-10">
                      <Dropdown
                        label={getAdditionalFilterLabel()}
                        dismissOnClick={true}
                        size="sm"
                        placement="bottom-start"
                        theme={{
                          floating: {
                            target:
                              "w-full bg-white text-gray-800 border border-gray-300 focus:ring-2 focus:ring-gray-400 hover:bg-gray-200 hover:text-gray-900",
                            base: "z-[9999] rounded-md shadow-md fixed",
                            content: "max-h-60 overflow-y-auto",
                          },
                        }}
                      >
                        <div className="max-h-60 overflow-y-auto">
                          {additionalFilterShowAll && (
                            <DropdownItem
                              onClick={() => {
                                onAdditionalFilterChange(null);
                                setCurrentPage(1);
                              }}
                            >
                              All {additionalFilterLabel}s
                            </DropdownItem>
                          )}
                          {additionalFilterOptions.map((option) => (
                            <DropdownItem
                              key={option.id}
                              onClick={() => {
                                onAdditionalFilterChange(option.id);
                                setCurrentPage(1);
                              }}
                            >
                              {option.name}
                            </DropdownItem>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                  </div>
                )}

              {customFilters && <div>{customFilters}</div>}
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
};

export default FilterSection;
