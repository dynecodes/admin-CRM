import { useMemo, useState, useRef, useEffect } from "react";
import useTheme from "../../../hooks/useTheme";
import { Textarea, Dropdown, DropdownItem, Label } from "flowbite-react";
import CustomDateRangePicker from "../../../components/ui/CustomDateRangePicker";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import CustomToggle from "../../../components/ui/CustomToggle";
import type { Holiday } from "../../../types/bookingSpots";

export type { Holiday };

const formatHolidayDate = (date: Date): string => {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${weekday} ${month}/${day}/${year}`;
};

const formatHolidayDateRange = (startDate: Date, endDate: Date): string => {
  const start = formatHolidayDate(startDate);
  const end = formatHolidayDate(endDate);
  if (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()
  ) {
    return start;
  }
  return `${start} to ${end}`;
};

const formatHolidayDisplay = (holidayString: string): string => {
  if (holidayString.includes(" to ")) {
    const parts = holidayString.split(" to ");
    if (parts.length === 2) {
      const startDateMatch = parts[0].match(/(\d{2}\/\d{2}\/\d{4})/);
      const endDateMatch = parts[1].match(/(\d{2}\/\d{2}\/\d{4})/);
      if (
        startDateMatch &&
        endDateMatch &&
        startDateMatch[1] === endDateMatch[1]
      ) {
        return parts[0];
      }
    }
  }
  return holidayString;
};

const parseHolidayDate = (dateString: string): Date | null => {
  try {
    if (dateString.includes(" to ")) {
      const firstDate = dateString.split(" to ")[0];
      const dateMatch = firstDate.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!dateMatch) return null;

      const month = parseInt(dateMatch[1], 10) - 1;
      const day = parseInt(dateMatch[2], 10);
      const year = parseInt(dateMatch[3], 10);

      return new Date(year, month, day);
    }

    const dateMatch = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) return null;

    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);

    return new Date(year, month, day);
  } catch {
    return null;
  }
};

const parseHolidayDateRange = (dateString: string): [Date, Date] | null => {
  try {
    if (!dateString.includes(" to ")) return null;

    const parts = dateString.split(" to ");
    const startDate = parseHolidayDate(parts[0]);
    const endDate = parseHolidayDate(parts[1]);

    if (startDate && endDate) {
      return [startDate, endDate];
    }
    return null;
  } catch {
    return null;
  }
};

interface HolidaysProps {
  selectedLocations: Set<string>;
  locations: Array<{ value: string; label: string }>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  isAddHolidayFormOpen: boolean;
  setIsAddHolidayFormOpen: (updater: (prev: boolean) => boolean) => void;
  newHolidayStartDate: Date | null;
  setNewHolidayStartDate: (date: Date | null) => void;
  newHolidayEndDate: Date | null;
  setNewHolidayEndDate: (date: Date | null) => void;
  newHolidayLocations: Set<string>;
  setNewHolidayLocations: React.Dispatch<React.SetStateAction<Set<string>>>;
  newHolidayDescription: string;
  setNewHolidayDescription: (value: string) => void;
  addHistoryEntry: (entry: { what: string }) => void;
  onRemoveHoliday: (holidayId: string, holidayName: string) => void;
  onCreateHoliday?: (data: any) => Promise<any>;
  onUpdateHoliday?: (id: number, data: any) => Promise<any>;
}

const Holidays = ({
  selectedLocations,
  locations,
  holidays,
  setHolidays,
  isAddHolidayFormOpen,
  setIsAddHolidayFormOpen,
  newHolidayStartDate,
  setNewHolidayStartDate,
  newHolidayEndDate,
  setNewHolidayEndDate,
  newHolidayLocations,
  setNewHolidayLocations,
  newHolidayDescription,
  setNewHolidayDescription,
  addHistoryEntry,
  onRemoveHoliday,
  onCreateHoliday,
  onUpdateHoliday,
}: HolidaysProps) => {
  const { getColorByPath } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    holidayId: string | null;
    holidayName: string;
  }>({
    isOpen: false,
    holidayId: null,
    holidayName: "",
  });

  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [editHolidayStartDate, setEditHolidayStartDate] = useState<Date | null>(
    null,
  );
  const [editHolidayEndDate, setEditHolidayEndDate] = useState<Date | null>(
    null,
  );
  const [editHolidayLocations, setEditHolidayLocations] = useState<Set<string>>(
    new Set(),
  );
  const [editHolidayDescription, setEditHolidayDescription] = useState("");

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const minHeight = 2 * 20 + 16;
    textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
  }, [newHolidayDescription]);

  useEffect(() => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const minHeight = 2 * 20 + 16;
    textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
  }, [editHolidayDescription]);

  const handleCancelEdit = () => {
    setEditingHoliday(null);
    setEditHolidayStartDate(null);
    setEditHolidayEndDate(null);
    setEditHolidayLocations(new Set());
    setEditHolidayDescription("");
  };

  const handleSaveEdit = async () => {
    if (!editingHoliday || !editHolidayStartDate || !editHolidayEndDate) return;

    const selectedLocationLabels = Array.from(editHolidayLocations)
      .map((locValue) => {
        const location = locations.find((l) => l.value === locValue);
        return location?.label || "";
      })
      .filter((label) => label !== "");

    let updatedHoliday: Holiday | null = null;

    if (editHolidayStartDate && editHolidayEndDate) {
      updatedHoliday = {
        id: editingHoliday.id,
        holiday: formatHolidayDateRange(
          editHolidayStartDate,
          editHolidayEndDate,
        ),
        description: editHolidayDescription || "",
        locations: selectedLocationLabels,
      };
    }

    if (updatedHoliday) {
      if (onUpdateHoliday) {
        try {
          const locationIds = Array.from(editHolidayLocations).map(id => parseInt(id));
          await onUpdateHoliday(Number(editingHoliday.id), {
            name: editHolidayDescription || "Holiday",  // Add this
            description: editHolidayDescription || "",
            start_date: editHolidayStartDate.toISOString().split('T')[0],
            end_date: editHolidayEndDate.toISOString().split('T')[0],
            location_ids: locationIds
          });
        } catch (error) {
          console.error("Failed to update holiday:", error);
          return;
        }
      }

      setHolidays((prev) =>
        prev.map((h) => (h.id === updatedHoliday!.id ? updatedHoliday! : h)),
      );

      const details: string[] = [];
      if (updatedHoliday.locations.length > 0) {
        details.push(`Locations: ${updatedHoliday.locations.join(", ")}`);
      }
      if (updatedHoliday.description) {
        details.push(`Description: ${updatedHoliday.description}`);
      }

      addHistoryEntry({
        what:
          details.length > 0
            ? `Holiday updated: ${updatedHoliday.holiday} (${details.join(" • ")})`
            : `Holiday updated: ${updatedHoliday.holiday}`,
      });
    }

    handleCancelEdit();
  };

  const rowOddBgColor = getColorByPath("datatable", "row_odd", "background");
  const rowEvenBgColor = getColorByPath("datatable", "row_even", "background");
  const rowOddBorderColor = getColorByPath("datatable", "row_odd", "border");
  const rowEvenBorderColor = getColorByPath("datatable", "row_even", "border");
  const filteredHolidays = useMemo(() => {
    let result: Holiday[];

    if (selectedLocations.size === 0) {
      result = [];
    } else if (selectedLocations.size === locations.length) {
      result = holidays;
    } else {
      const selectedLocationIds = Array.from(selectedLocations);

      result = holidays.filter((holiday) => {
        // holiday.locations contains location IDs as strings
        const holidayLocationIds = holiday.locations.map((loc) => String(loc));
        
        // Check if any selected location ID is in this holiday's locations
        return holidayLocationIds.some((locId) =>
          selectedLocationIds.includes(locId),
        );
      });
    }

    return [...result].sort((a, b) => {
      const getHolidayStartDate = (holiday: Holiday): Date | null => {
        const dateRange = parseHolidayDateRange(holiday.holiday);
        if (dateRange && dateRange[0]) {
          return dateRange[0];
        }
        const parsedDate = parseHolidayDate(holiday.holiday);
        return parsedDate;
      };

      const dateA = getHolidayStartDate(a);
      const dateB = getHolidayStartDate(b);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateA.getTime() - dateB.getTime();
    });
  }, [holidays, selectedLocations, locations]);

  const handleCloseAddHolidayForm = () => {
    setIsAddHolidayFormOpen((prev) => !prev);
    setNewHolidayStartDate(null);
    setNewHolidayEndDate(null);
    setNewHolidayLocations(new Set());
    setNewHolidayDescription("");
  };

  return (
    <>
      <div className="mb-4 w-full sm:mb-5">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-900 sm:text-sm">
                Add New Holiday
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                On which date(s) you want holiday(s)?
              </p>
            </div>
            <CustomToggle
              checked={isAddHolidayFormOpen}
              onChange={(checked) => setIsAddHolidayFormOpen(() => checked)}
            />
          </div>

          {isAddHolidayFormOpen && (
            <div className="mt-4 space-y-4 sm:mt-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Date Range Picker */}
                <div className="flex flex-1 flex-col gap-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Select specific or range date
                  </label>
                  <CustomDateRangePicker
                    startDate={newHolidayStartDate}
                    endDate={newHolidayEndDate}
                    onChange={(start, end) => {
                      setNewHolidayStartDate(start);
                      setNewHolidayEndDate(end);
                    }}
                    className="w-full"
                  />
                </div>
                {/* Locations */}
                <div className="flex flex-1 flex-col gap-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Locations
                  </label>
                  <div className="relative w-full">
                    <Dropdown
                      label={
                        newHolidayLocations.size > 0
                          ? newHolidayLocations.size === 1
                            ? locations.find(
                                (loc) =>
                                  loc.value ===
                                  Array.from(newHolidayLocations)[0],
                              )?.label || "Select location"
                            : `${newHolidayLocations.size} locations selected`
                          : "Select location(s)"
                      }
                      dismissOnClick={false}
                      className="w-full"
                      theme={{
                        floating: {
                          target:
                            "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all outline-none hover:bg-gray-50 focus:border-gray-100",
                          base: "z-50 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
                          content: "w-full py-1",
                        },
                      }}
                    >
                      <div className="flex gap-2 border-b border-gray-200 px-2 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayLocations(
                              new Set(locations.map((loc) => loc.value)),
                            );
                          }}
                          className="flex-1 cursor-pointer rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-xs"
                        >
                          Select All Locations
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewHolidayLocations(new Set());
                          }}
                          className="flex-1 cursor-pointer rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-xs"
                        >
                          Deselect All
                        </button>
                      </div>
                      {locations.map((location) => {
                        const isSelected = newHolidayLocations.has(
                          location.value,
                        );
                        return (
                          <DropdownItem
                            key={location.value}
                            onClick={() => {
                              setNewHolidayLocations((prev) => {
                                const next = new Set(prev);
                                if (next.has(location.value)) {
                                  next.delete(location.value);
                                } else {
                                  next.add(location.value);
                                }
                                return next;
                              });
                            }}
                            className={
                              isSelected
                                ? "bg-gray-50 font-medium text-gray-700"
                                : "hover:bg-gray-100"
                            }
                          >
                            <div className="flex w-full items-center justify-between">
                              <span>{location.label}</span>
                              {isSelected && (
                                <svg
                                  className="h-4 w-4 text-gray-700"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </DropdownItem>
                        );
                      })}
                    </Dropdown>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  ref={textareaRef}
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                  placeholder="Enter holiday description"
                  className="w-full resize-none overflow-hidden bg-white"
                  style={{ minHeight: "56px" }}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const selectedLocationLabels = Array.from(newHolidayLocations)
                      .map((locValue) => {
                        const location = locations.find((l) => l.value === locValue);
                        return location?.label || "";
                      })
                      .filter((label) => label !== "");

                    let createdHoliday: Holiday | null = null;

                    if (newHolidayStartDate && newHolidayEndDate) {
                      if (onCreateHoliday) {
                        try {
                          const locationIds = Array.from(newHolidayLocations).map(id => parseInt(id));
                          const result = await onCreateHoliday({
                            name: newHolidayDescription || "Holiday",  
                            description: newHolidayDescription || "",
                            start_date: newHolidayStartDate.toISOString().split('T')[0], 
                            end_date: newHolidayEndDate.toISOString().split('T')[0],    
                            location_ids: locationIds  
                          });

                          createdHoliday = {
                            id: result.id.toString(),
                            holiday: formatHolidayDateRange(
                              newHolidayStartDate,
                              newHolidayEndDate,
                            ),
                            description: newHolidayDescription || "",
                            locations: selectedLocationLabels,
                          };
                        } catch (error) {
                          console.error("Failed to create holiday:", error);
                          return;
                        }
                      } else {
                        createdHoliday = {
                          id: Date.now().toString(),
                          holiday: formatHolidayDateRange(
                            newHolidayStartDate,
                            newHolidayEndDate,
                          ),
                          description: newHolidayDescription || "",
                          locations: selectedLocationLabels,
                        };
                      }
                    }

                    if (createdHoliday) {
                      setHolidays((prev) => [...prev, createdHoliday]);

                      const details: string[] = [];
                      if (createdHoliday.locations.length > 0) {
                        details.push(`Locations: ${createdHoliday.locations.join(", ")}`);
                      }
                      if (createdHoliday.description) {
                        details.push(`Description: ${createdHoliday.description}`);
                      }

                      addHistoryEntry({
                        what:
                          details.length > 0
                            ? `Holiday created: ${createdHoliday.holiday} (${details.join(" • ")})`
                            : `Holiday created: ${createdHoliday.holiday}`,
                      });
                    }

                    handleCloseAddHolidayForm();
                  }}
                  disabled={
                    !newHolidayStartDate ||
                    !newHolidayEndDate ||
                    newHolidayLocations.size === 0
                  }
                  className="h-10 w-full cursor-pointer rounded-lg bg-gray-600 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Add Holiday
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left transition-all duration-200">
            <colgroup>
              <col className="w-[25%] min-w-[150px]" />
              <col className="w-[35%] min-w-[180px]" />
              <col className="w-[25%] min-w-[150px]" />
              <col className="w-[15%] min-w-[120px]" />
            </colgroup>
            <thead className="bg-[#F8FAFC]">
              <tr className="text-[#1F2937]">
                <th
                  scope="col"
                  className="border-r border-b border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider uppercase sm:px-4"
                >
                  Holiday
                </th>
                <th
                  scope="col"
                  className="border-r border-b border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider uppercase sm:px-4"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="border-r border-b border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider uppercase sm:px-4"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="border-b border-gray-200 px-3 py-2 text-center text-[11px] font-bold tracking-wider uppercase"
                >
                  Settings
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-xs text-gray-500 sm:text-sm"
                  >
                    No holidays found
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday, rowIndex) => {
                  const isEven = rowIndex % 2 === 1;
                  const rowBgColor = isEven ? rowEvenBgColor : rowOddBgColor;
                  const rowBorderColor = isEven
                    ? rowEvenBorderColor
                    : rowOddBorderColor;

                  const isEditing = editingHoliday?.id === holiday.id;

                  return (
                    <tr
                      key={holiday.id}
                      className="border-b transition-colors duration-200"
                      style={{
                        backgroundColor: rowBgColor,
                        borderBottomColor: rowBorderColor,
                      }}
                    >
                      <td className="border-r border-gray-200 px-3 py-4 align-top sm:px-4">
                        {isEditing ? (
                          <div className="w-full sm:w-[240px]">
                            <CustomDateRangePicker
                              startDate={editHolidayStartDate}
                              endDate={editHolidayEndDate}
                              onChange={(start, end) => {
                                setEditHolidayStartDate(start);
                                setEditHolidayEndDate(end);
                              }}
                              className="w-full"
                              inputClassName="h-9 px-3 text-[12px] font-medium"
                            />
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-gray-900 sm:text-sm">
                            {formatHolidayDisplay(holiday.holiday)}
                          </p>
                        )}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-4 align-top sm:px-4">
                        {isEditing ? (
                          <Textarea
                            ref={editTextareaRef}
                            value={editHolidayDescription}
                            onChange={(e) =>
                              setEditHolidayDescription(e.target.value)
                            }
                            placeholder="Enter holiday description"
                            className="w-full resize-none overflow-hidden bg-white text-xs sm:text-sm"
                            style={{ minHeight: "56px" }}
                          />
                        ) : (
                          <p className="text-xs text-gray-700 sm:text-sm">
                            {holiday.description}
                          </p>
                        )}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-4 align-top sm:px-4">
                        {isEditing ? (
                          <div className="relative w-full sm:w-[200px]">
                            <Dropdown
                              label={
                                editHolidayLocations.size > 0
                                  ? editHolidayLocations.size === 1
                                    ? locations.find(
                                        (loc) =>
                                          loc.value ===
                                          Array.from(editHolidayLocations)[0],
                                      )?.label || "Select location"
                                    : `${editHolidayLocations.size} locations selected`
                                  : "Select location(s)"
                              }
                              dismissOnClick={false}
                              className="w-full"
                              theme={{
                                floating: {
                                  target:
                                    "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all outline-none hover:bg-gray-50 focus:border-gray-100",
                                  base: "z-50 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
                                  content: "w-full py-1",
                                },
                              }}
                            >
                              <div className="flex flex-col gap-2 border-b border-gray-200 px-2 py-2 sm:flex-row">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditHolidayLocations(
                                      new Set(
                                        locations.map((loc) => loc.value),
                                      ),
                                    );
                                  }}
                                  className="flex-1 cursor-pointer rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-xs"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditHolidayLocations(new Set());
                                  }}
                                  className="flex-1 cursor-pointer rounded-sm border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:text-xs"
                                >
                                  Deselect All
                                </button>
                              </div>
                              {locations.map((location) => {
                                const isSelected = editHolidayLocations.has(
                                  location.value,
                                );
                                return (
                                  <DropdownItem
                                    key={location.value}
                                    onClick={() => {
                                      setEditHolidayLocations((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(location.value)) {
                                          next.delete(location.value);
                                        } else {
                                          next.add(location.value);
                                        }
                                        return next;
                                      });
                                    }}
                                    className={
                                      isSelected
                                        ? "bg-gray-50 font-medium text-gray-700"
                                        : "hover:bg-gray-100"
                                    }
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span>{location.label}</span>
                                      {isSelected && (
                                        <svg
                                          className="h-4 w-4 text-gray-700"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </DropdownItem>
                                );
                              })}
                            </Dropdown>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {holiday.locations.map((locationId, locIndex) => {
                              // Map location ID to label
                              const locationLabel = locations.find(
                                (loc) => loc.value === String(locationId)
                              )?.label || `Location ${locationId}`;
                              
                              return (
                                <span
                                  key={locIndex}
                                  className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700 sm:px-2.5 sm:py-1 sm:text-xs"
                                >
                                  {locationLabel}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top sm:px-4">
                        <div className="flex flex-col items-stretch gap-1.5 sm:items-center">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={
                                  !editHolidayStartDate ||
                                  !editHolidayEndDate ||
                                  editHolidayLocations.size === 0
                                }
                                className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gray-600 px-3 text-[11px] font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-[12px]"
                              >
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-[11px] font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-none sm:text-[12px]"
                              >
                                <span>Cancel</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingHoliday(holiday);
                                  const dateRange = parseHolidayDateRange(
                                    holiday.holiday,
                                  );
                                  if (
                                    dateRange &&
                                    dateRange[0] &&
                                    dateRange[1]
                                  ) {
                                    const startDate = new Date(dateRange[0]);
                                    const endDate = new Date(dateRange[1]);
                                    if (
                                      !isNaN(startDate.getTime()) &&
                                      !isNaN(endDate.getTime())
                                    ) {
                                      setEditHolidayStartDate(startDate);
                                      setEditHolidayEndDate(endDate);
                                    } else {
                                      setEditHolidayStartDate(null);
                                      setEditHolidayEndDate(null);
                                    }
                                  } else {
                                    const parsedDate = parseHolidayDate(
                                      holiday.holiday,
                                    );
                                    if (parsedDate) {
                                      const validDate = new Date(parsedDate);
                                      if (!isNaN(validDate.getTime())) {
                                        setEditHolidayStartDate(validDate);
                                        setEditHolidayEndDate(validDate);
                                      }
                                    } else {
                                      setEditHolidayStartDate(null);
                                      setEditHolidayEndDate(null);
                                    }
                                  }
                                  const locationValues = new Set(
                                    holiday.locations
                                      .map((label) => {
                                        const loc = locations.find(
                                          (l) => l.label === label,
                                        );
                                        return loc?.value;
                                      })
                                      .filter(
                                        (v): v is string => v !== undefined,
                                      ),
                                  );
                                  setEditHolidayLocations(locationValues);
                                  setEditHolidayDescription(
                                    holiday.description,
                                  );
                                }}
                                className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gray-600 px-3 text-[11px] font-medium whitespace-nowrap text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 focus:outline-none sm:text-[12px]"
                              >
                                <span>Edit Holiday</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteModal({
                                    isOpen: true,
                                    holidayId: holiday.id,
                                    holidayName: holiday.holiday,
                                  });
                                }}
                                className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-red-600 bg-white px-3 text-[11px] font-medium whitespace-nowrap text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none sm:text-[12px]"
                              >
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() =>
            setDeleteModal({
              isOpen: false,
              holidayId: null,
              holidayName: "",
            })
          }
          onConfirm={() => {
            if (deleteModal.holidayId && deleteModal.holidayName) {
              onRemoveHoliday(deleteModal.holidayId, deleteModal.holidayName);
              setDeleteModal({
                isOpen: false,
                holidayId: null,
                holidayName: "",
              });
            }
          }}
          title="Delete Holiday"
          itemName={deleteModal.holidayName}
          itemType="holiday"
        />
      </div>
    </>
  );
};

export default Holidays;
