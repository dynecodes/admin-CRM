// src/components/ui/AppDataTable/index.tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import DataTableComponent, { TableStyles } from "react-data-table-component";
import FilterSection from "./AppDataTable/FilterSection";
import MobileCards from "./AppDataTable/MobileCards";
import Pagination from "./AppDataTable/Pagination";
import { Button } from "flowbite-react";
import useTheme from "../../hooks/useTheme";

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
  sortFn?: (a: any, b: any) => number;
}

interface MobileCardField {
  key: string;
  label: string;
  type?: "text" | "badge" | "badges" | "currency" | "duration";
  color?: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface MobileCardAction {
  label: string;
  color: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  triggerInlineEdit?: boolean;
}

interface ExtraFilterConfig {
  key: string;
  label: string;
  options: Array<{ id: number | null; name: string }>;
  value: number | null;
  onChange: (value: number | null) => void;
  showAll?: boolean;
}

interface AppDataTableProps {
  data: any[];
  columns: any[];
  searchPlaceholder?: string;
  searchKeys?: string[];

  filterOptions?: FilterOption[];
  filterKey?: string;
  filterLabel?: string;
  defaultFilter?: string;
  showFilter?: boolean;

  sortOptions?: SortOption[];
  defaultSort?: string;
  showSort?: boolean;

  paginationOptions?: number[];
  defaultPerPage?: number;
  noDataMessage?: string;
  showSearch?: boolean;
  customFilters?: React.ReactNode;

  /** OLD single additional filter (backwards compatible) */
  additionalFilterOptions?: Array<{ id: number; name: string }>;
  additionalFilterLabel?: string;
  showAdditionalFilter?: boolean;
  additionalFilterValue?: number | null;
  onAdditionalFilterChange?: (value: number | null) => void;
  additionalFilterShowAll?: boolean;

  /** NEW: generic, scalable extra filters */
  extraFilters?: ExtraFilterConfig[];

  enableInlineEdit?: boolean;
  renderEditForm?: (
    item: any,
    onSave: (data: any) => void,
    onCancel: () => void
  ) => React.ReactNode;

  onRowClick?: (item: any) => void;
  onEditClick?: (item: any) => void;
  showEditButton?: boolean;

  mobileCard?: {
    titleField: string;
    titleRender?: (item: any) => React.ReactNode;
    subtitleRender?: (item: any) => React.ReactNode;
    statusField?: string;
    fields?: MobileCardField[];
    actions?: MobileCardAction[];
    enableEdit?: boolean;
  };

  enableDragDrop?: boolean;
  entityType?: string;
  onReorder?: (reorderedData: any[]) => void;
}

function useMedia(query: string) {
  const getMatch = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : true;
  const [matches, setMatches] = useState(getMatch);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);
  return matches;
}

const AppDataTable: React.FC<AppDataTableProps> = ({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys = ["name"],
  filterOptions,
  filterKey,
  filterLabel = "Filter by",
  defaultFilter = "all",
  showFilter = true,
  sortOptions,
  defaultSort,
  showSort = true,
  paginationOptions = [10, 20, 50, 100],
  defaultPerPage = 20,
  noDataMessage = "No data found",
  showSearch = true,
  customFilters,
  additionalFilterOptions,
  additionalFilterLabel = "Filter",
  showAdditionalFilter = false,
  additionalFilterValue,
  onAdditionalFilterChange,
  additionalFilterShowAll = true,
  extraFilters, // NEW
  enableInlineEdit = false,
  renderEditForm,
  onRowClick,
  onEditClick,
  showEditButton = false,
  mobileCard,
  enableDragDrop = false,
  entityType,
  onReorder,
}) => {
  const { getColorByPath } = useTheme();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultFilter);
  const [sortBy, setSortBy] = useState(
    defaultSort || sortOptions?.[0]?.value || ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [editingId, setEditingId] = useState<any>(null);
  const [draggedOverId, setDraggedOverId] = useState<any>(null);

  const headerBgColor = getColorByPath("datatable", "header", "background");
  const headerTextColor = getColorByPath("datatable", "header", "text");
  const headerBorderColor = getColorByPath("datatable", "header", "border");

  const bodyTextColor = getColorByPath("datatable", "body", "text");

  const rowOddBgColor = getColorByPath("datatable", "row_odd", "background");
  const rowOddBorderColor = getColorByPath("datatable", "row_odd", "border");

  const rowEvenBgColor = getColorByPath("datatable", "row_even", "background");
  const rowEvenBorderColor = getColorByPath("datatable", "row_even", "border");

  const rowHoverBgColor = getColorByPath("datatable", "row_hover", "background");

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (showFilter && filterOptions && filterKey && statusFilter !== "all") {
      filtered = filtered.filter((item) => item[filterKey] === statusFilter);
    }

    if (showSearch && search && searchKeys.length > 0) {
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = key.includes(".")
            ? key.split(".").reduce((obj: any, k: string) => obj?.[k], item)
            : item[key];

          if (Array.isArray(value)) {
            return value.some((v) =>
              typeof v === "object"
                ? Object.values(v).some((val) =>
                    String(val).toLowerCase().includes(search.toLowerCase())
                  )
                : String(v).toLowerCase().includes(search.toLowerCase())
            );
          }
          return String(value || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        })
      );
    }

    if (showSort && sortOptions && sortBy) {
      const currentSortOption = sortOptions.find(
        (option) => option.value === sortBy
      );
      if (currentSortOption?.sortFn) {
        filtered.sort(currentSortOption.sortFn);
      }
    }

    return filtered;
  }, [
    data,
    search,
    statusFilter,
    sortBy,
    searchKeys,
    filterKey,
    sortOptions,
    filterOptions,
    showFilter,
    showSearch,
    showSort,
  ]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const openEditor = (row: any) => {
    if (enableInlineEdit) {
      setEditingId((curr: any) => (curr === row.id ? null : row.id));
      return;
    }
    if (onEditClick) {
      onEditClick(row);
      return;
    }
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleRowClick = (row: any) => {
    openEditor(row);
  };

  const handleEditButtonClick = (row: any) => {
    openEditor(row);
  };

  const handleMobileCardClick = (item: any) => {
    if (enableInlineEdit && mobileCard?.enableEdit) {
      setEditingId((curr: any) => (curr === item.id ? null : item.id));
    }
    if (onRowClick) onRowClick(item);
  };

  const handleEditSave = useCallback((_data: any) => setEditingId(null), []);
  const handleEditCancel = useCallback(() => setEditingId(null), []);

  const isXL = useMedia("(min-width: 1280px)");

  const responsiveColumns = useMemo(() => {
    const cols = [...columns].map((col: any) => {
      const next: any = { ...col, wrap: true };

      if (!isXL) {
        if ("width" in next) delete next.width;
        if ("minWidth" in next) delete next.minWidth;
        if (!("grow" in next)) next.grow = 1;
      }
      return next;
    });

    if (showEditButton) {
      cols.push({
        name: "Actions",
        width: "120px",
        ignoreRowClick: true,
        cell: (row: any) => (
          <div className="py-2">
            <Button
              size="xs"
              color="black"
              onClick={(e) => {
                e.stopPropagation();
                handleEditButtonClick(row);
              }}
              className="w-full min-w-[60px] cursor-pointer"
            >
              Edit
            </Button>
          </div>
        ),
      });
    }

    return cols;
  }, [columns, isXL, showEditButton]);

  const customStyles: TableStyles = {
    table: {
      style: { backgroundColor: rowOddBgColor, width: "100%" },
    },
    tableWrapper: {
      style: {
        backgroundColor: rowOddBgColor,
        border: `1px solid ${headerBorderColor}`,
        borderRadius: "0.375rem",
        overflow: "hidden",
      },
    },
    head: {
      style: {
        backgroundColor: headerBgColor,
        color: headerTextColor,
      },
    },
    headRow: {
      style: {
        backgroundColor: headerBgColor,
        borderBottom: `1px solid ${headerBorderColor}`,
        minHeight: "48px",
        alignItems: "flex-start",
        color: headerTextColor,
      },
    },
    headCells: {
      style: {
        fontSize: "0.8rem",
        fontWeight: 700,
        color: headerTextColor,
        textTransform: "none" as const,
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        whiteSpace: "normal",
        wordBreak: "break-word",
        minWidth: 0,
        maxWidth: "100%",
      },
    },
    rows: {
      style: {
        fontSize: "0.875rem",
        color: bodyTextColor,
        borderBottom: `1px solid ${rowOddBorderColor}`,
        backgroundColor: rowOddBgColor,
        minHeight: "60px",
        alignItems: "flex-start",
      },
      denseStyle: {
        color: bodyTextColor,
        borderBottom: `1px solid ${rowOddBorderColor}`,
        backgroundColor: rowOddBgColor,
      },
    },
    expanderRow: {
      style: {
        borderLeft: `4px solid #1d4ed8`,
        borderRight: `4px solid #1d4ed8`,
        borderBottom: `4px solid #1d4ed8`,
        backgroundColor: rowEvenBgColor,
        color: bodyTextColor,
      },
    },
    cells: {
      style: {
        color: bodyTextColor,
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingTop: "1rem",
        paddingBottom: "1rem",
        whiteSpace: "normal",
        wordBreak: "break-word",
        minWidth: 0,
        maxWidth: "100%",
        flexWrap: "wrap" as const,
      },
    },
    expanderButton: { style: { display: "none" } },
  };

  const conditionalRowStyles = [
    {
      when: (row: any) => editingId === row.id,
      style: {
        borderLeft: `4px solid #1d4ed8`,
        borderRight: `4px solid #1d4ed8`,
        borderTop: `4px solid #1d4ed8`,
        borderBottom: "none",
        color: bodyTextColor,
        backgroundColor: rowEvenBgColor,
      },
    },
    {
      when: (row: any) => {
        const rowIndex = paginatedData.findIndex((item) => item.id === row.id);
        return rowIndex % 2 === 1;
      },
      style: {
        backgroundColor: rowEvenBgColor,
        color: bodyTextColor,
        borderBottom: `1px solid ${rowEvenBorderColor}`,
        "&:hover": {
          backgroundColor: rowHoverBgColor,
        },
      },
    },
    {
      when: (row: any) => {
        const rowIndex = paginatedData.findIndex((item) => item.id === row.id);
        return rowIndex % 2 === 0;
      },
      style: {
        backgroundColor: rowOddBgColor,
        color: bodyTextColor,
        borderBottom: `1px solid ${rowOddBorderColor}`,
        "&:hover": {
          backgroundColor: rowHoverBgColor,
        },
      },
    },
  ];

  /** Normalize old single additionalFilter into generic extraFilters array */
  const normalizedExtraFilters: ExtraFilterConfig[] = useMemo(() => {
    const list: ExtraFilterConfig[] = extraFilters ? [...extraFilters] : [];

    if (
      showAdditionalFilter &&
      additionalFilterOptions &&
      onAdditionalFilterChange
    ) {
      list.push({
        key: "additional",
        label: additionalFilterLabel,
        options: additionalFilterOptions.map((o) => ({
          id: o.id,
          name: o.name,
        })),
        value: additionalFilterValue ?? null,
        onChange: onAdditionalFilterChange,
        showAll: additionalFilterShowAll,
      });
    }

    return list;
  }, [
    extraFilters,
    showAdditionalFilter,
    additionalFilterOptions,
    onAdditionalFilterChange,
    additionalFilterLabel,
    additionalFilterValue,
    additionalFilterShowAll,
  ]);

  const showFiltersSection =
    showSearch ||
    (showFilter && filterOptions) ||
    (showSort && sortOptions) ||
    normalizedExtraFilters.length > 0 ||
    customFilters;

  const ExpandableRowComponent = React.memo(
    ({ data: rowData }: { data: any }) => {
      const wrapperRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (wrapperRef.current) {
          setTimeout(() => {
            wrapperRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 150);
        }
      }, []);

      return (
        <div ref={wrapperRef} className="bg-gray-50 px-6 py-4">
          {renderEditForm &&
            renderEditForm(rowData, handleEditSave, handleEditCancel)}
        </div>
      );
    }
  );
  ExpandableRowComponent.displayName = "ExpandableRowComponent";

  return (
    <div className="space-y-4">
      {showFiltersSection && (
        <FilterSection
          showSearch={showSearch}
          search={search}
          setSearch={setSearch}
          searchPlaceholder={searchPlaceholder}
          showFilter={showFilter}
          filterOptions={filterOptions}
          filterKey={filterKey}
          filterLabel={filterLabel}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setCurrentPage={setCurrentPage}
          showSort={showSort}
          sortOptions={sortOptions}
          sortBy={sortBy}
          setSortBy={setSortBy}
          customFilters={customFilters}
          // extraFilters={normalizedExtraFilters} 
        />
      )}

      <div className="hidden sm:block">
        <Pagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          paginationOptions={paginationOptions}
          isMobile={false}
        />
      </div>

      <div className="block sm:hidden">
        <Pagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          paginationOptions={paginationOptions}
          isMobile={true}
        />
      </div>

      <MobileCards
        paginatedData={paginatedData}
        noDataMessage={noDataMessage}
        mobileCard={mobileCard}
        enableInlineEdit={enableInlineEdit}
        editingId={editingId}
        handleMobileCardClick={handleMobileCardClick}
        renderEditForm={renderEditForm}
        handleEditSave={handleEditSave}
        handleEditCancel={handleEditCancel}
      />

      {enableDragDrop && entityType ? (
        <div className="hidden overflow-x-hidden lg:block">
          <div
            style={{
              backgroundColor: rowOddBgColor,
              border: `1px solid ${headerBorderColor}`,
              borderRadius: "0.375rem",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: headerBgColor,
                borderBottom: `1px solid ${headerBorderColor}`,
                minHeight: "48px",
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              {responsiveColumns.map((col: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: headerTextColor,
                    textTransform: "none",
                    paddingLeft: "1.25rem",
                    paddingRight: "1.25rem",
                    paddingTop: "0.75rem",
                    paddingBottom: "0.75rem",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    flex: col.grow
                      ? col.grow
                      : col.width
                      ? "0 0 auto"
                      : "1",
                    width: col.width || "auto",
                    minWidth: 0,
                    maxWidth: "100%",
                  }}
                >
                  {col.name}
                </div>
              ))}
            </div>

            {/* Body */}
            <div>
              {paginatedData.length === 0 ? (
                <div
                  style={{
                    backgroundColor: rowOddBgColor,
                    padding: "2rem",
                    textAlign: "center",
                    color: bodyTextColor,
                  }}
                >
                  <p style={{ fontSize: "1.125rem", fontWeight: 500 }}>
                    {noDataMessage}
                  </p>
                  <p style={{ fontSize: "0.875rem" }}>
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                paginatedData.map((row: any) => {
                  const rowIndex = paginatedData.findIndex(
                    (item) => item.id === row.id
                  );
                  const isEven = rowIndex % 2 === 1;
                  const bgColor = isEven ? rowEvenBgColor : rowOddBgColor;
                  const borderColor = isEven
                    ? rowEvenBorderColor
                    : rowOddBorderColor;

                  return (
                    <div
                      key={row.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(row.id));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDraggedOverId(row.id);
                      }}
                      onDragLeave={() => {
                        setDraggedOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggedOverId(null);

                        const draggedId = parseInt(
                          e.dataTransfer.getData("text/plain")
                        );

                        const draggedIndex = paginatedData.findIndex(
                          (item) => item.id === draggedId
                        );
                        const targetIndex = paginatedData.findIndex(
                          (item) => item.id === row.id
                        );

                        if (
                          draggedIndex !== targetIndex &&
                          draggedIndex !== -1
                        ) {
                          const newData = [...paginatedData];
                          const [draggedItem] = newData.splice(
                            draggedIndex,
                            1
                          );
                          newData.splice(targetIndex, 0, draggedItem);
                          if (onReorder) {
                            onReorder(newData);
                          }
                        }
                      }}
                      onClick={() => handleRowClick(row)}
                      style={{
                        backgroundColor:
                          draggedOverId === row.id ? "#eff6ff" : bgColor,
                        borderBottom: `1px solid ${borderColor}`,
                        borderLeftColor:
                          editingId === row.id
                            ? headerTextColor
                            : "transparent",
                        borderRightColor:
                          editingId === row.id
                            ? headerTextColor
                            : "transparent",
                        borderTopColor:
                          editingId === row.id
                            ? headerTextColor
                            : "transparent",
                        borderLeftWidth: editingId === row.id ? "4px" : "0px",
                        borderRightWidth: editingId === row.id ? "4px" : "0px",
                        borderTopWidth: editingId === row.id ? "4px" : "0px",
                        minHeight: "60px",
                        display: "flex",
                        alignItems: "flex-start",
                        fontSize: "0.875rem",
                        color: bodyTextColor,
                        cursor: "grab",
                        userSelect: "none",
                      }}
                    >
                      {responsiveColumns.map((col: any, colIdx: number) => (
                        <div
                          key={colIdx}
                          style={{
                            paddingLeft: "1.25rem",
                            paddingRight: "1.25rem",
                            paddingTop: "1rem",
                            paddingBottom: "1rem",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            flex: col.grow
                              ? col.grow
                              : col.width
                              ? "0 0 auto"
                              : "1",
                            width: col.width || "auto",
                            minWidth: 0,
                            maxWidth: "100%",
                          }}
                        >
                          {col.cell ? col.cell(row) : row[col.selector]}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden overflow-x-hidden lg:block">
          <DataTableComponent
            keyField="id"
            columns={responsiveColumns}
            data={paginatedData}
            customStyles={customStyles}
            conditionalRowStyles={conditionalRowStyles}
            pagination={false}
            expandableRows={enableInlineEdit}
            expandOnRowClicked={enableInlineEdit}
            expandOnRowDoubleClicked={enableInlineEdit}
            expandableRowsComponent={
              enableInlineEdit ? ExpandableRowComponent : undefined
            }
            expandableRowExpanded={(row) => editingId === row.id}
            expandableRowsHideExpander
            onRowClicked={(row) => handleRowClick(row)}
            onRowDoubleClicked={(row) => handleRowClick(row)}
            dense
            noDataComponent={
              <div className="py-8 text-center text-gray-500">
                <p className="text-lg font-medium">{noDataMessage}</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            }
          />
        </div>
      )}

      <div className="hidden sm:block">
        <Pagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          paginationOptions={paginationOptions}
          isMobile={false}
        />
      </div>

      <div className="block sm:hidden">
        <Pagination
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          paginationOptions={paginationOptions}
          isMobile={true}
        />
      </div>
    </div>
  );
};

export default AppDataTable;
