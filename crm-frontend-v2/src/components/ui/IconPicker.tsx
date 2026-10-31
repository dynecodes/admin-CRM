import React, { useState, useMemo, useRef, useEffect } from "react";
import { Label, TextInput } from "flowbite-react";
import { iconLibrary, iconCategories } from "../../utils/iconLibrary";
import { HiSearch, HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";
import { useCustomIcons } from "../../hooks/useCustomIcons";

interface IconPickerProps {
  selectedIcon?: string;
  onSelect: (iconId: string) => void;
  label?: string;
  className?: string;
}

const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
  label = "Choose from Icon Library",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const { customIcons, deleteCustomIcon } = useCustomIcons();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    if (isOpen || isCategoryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isCategoryOpen]);

  const filteredIcons = useMemo(() => {
    let icons = iconLibrary;

    if (selectedCategory !== "all" && selectedCategory !== "custom") {
      icons = icons.filter((icon) => icon.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(search) ||
          icon.id.toLowerCase().includes(search) ||
          icon.category.toLowerCase().includes(search),
      );
    }

    return icons;
  }, [selectedCategory, searchTerm]);

  const filteredCustomIcons = useMemo(() => {
    if (selectedCategory === "all" || selectedCategory === "custom") {
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        return customIcons.filter((icon) =>
          icon.icon_name.toLowerCase().includes(search),
        );
      }
      return customIcons;
    }
    return [];
  }, [customIcons, selectedCategory, searchTerm]);

  const selectedIconData = iconLibrary.find((icon) => icon.id === selectedIcon);
  const selectedCustomIcon = customIcons.find(
    (icon) => icon.icon_url === selectedIcon,
  );
  const selectedCategoryData = iconCategories.find(
    (cat) => cat.value === selectedCategory,
  );

  const handleSelectIcon = (iconId: string) => {
    onSelect(iconId);
    setIsOpen(false);
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const handleSelectCategory = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setIsCategoryOpen(false);
  };

  const handleDeleteCustomIcon = async (
    e: React.MouseEvent,
    iconId: number,
  ) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this custom icon?")) {
      try {
        await deleteCustomIcon(iconId);
        // If the deleted icon was selected, clear selection
        const deletedIcon = customIcons.find((icon) => icon.id === iconId);
        if (deletedIcon && selectedIcon === deletedIcon.icon_url) {
          onSelect("");
        }
      } catch (error) {
        alert("Failed to delete custom icon");
      }
    }
  };

  // Enhanced categories list with Custom Icons at the top
  const enhancedCategories = [
    { value: "custom", label: "Custom Icons" },
    ...iconCategories,
  ];

  return (
    <div className={className} ref={dropdownRef}>
      <Label className="mb-1 block text-xs sm:mb-2 sm:text-sm">{label}</Label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:border-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:outline-none"
      >
        {selectedIconData ? (
          <div className="flex items-center gap-2">
            <div className="text-xl text-gray-700">{selectedIconData.icon}</div>
            <span className="text-gray-900">{selectedIconData.name}</span>
          </div>
        ) : selectedCustomIcon ? (
          <div className="flex items-center gap-2">
            <img
              src={selectedCustomIcon.icon_url}
              alt={selectedCustomIcon.icon_name}
              className="h-6 w-6 rounded object-cover"
            />
            <span className="text-gray-900">
              {selectedCustomIcon.icon_name}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">Select an icon...</span>
        )}
        {isOpen ? (
          <HiChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <HiChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="space-y-3 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <TextInput
                  icon={HiSearch}
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sizing="sm"
                  theme={{
                    base: "block w-full border-gray-100 bg-white rounded-lg border text-sm",
                    field: {
                      input: {
                        base: "flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:border-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:outline-none",
                        sizes: {
                          sm: "p-2"
                        },
                        colors: {
                          gray:
                            "focus:border-gray-400 focus:ring-gray-500"
                        }
                      }
                    }
                  }}
                  color="gray"
                />
              </div>

              <div className="relative w-full sm:w-48" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 hover:border-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                >
                  <span>{selectedCategoryData?.label || "Custom Icons"}</span>
                  {isCategoryOpen ? (
                    <HiChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <HiChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {isCategoryOpen && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg sm:max-h-64">
                    {enhancedCategories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleSelectCategory(category.value)}
                        className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          selectedCategory === category.value
                            ? "bg-gray-50 font-medium text-gray-700"
                            : "text-gray-900"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 sm:max-h-80">
              {/* Custom Icons Section */}
              {(selectedCategory === "all" ||
                selectedCategory === "custom") && (
                <div
                  className={
                    selectedCategory === "all" && filteredCustomIcons.length > 0
                      ? "mb-4"
                      : ""
                  }
                >
                  {filteredCustomIcons.length > 0 ? (
                    <>
                      <h4 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold text-gray-700">
                        <span>Custom Icons</span>
                      </h4>
                      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
                        {filteredCustomIcons.map((icon) => (
                          <div key={icon.id} className="group relative">
                            <button
                              type="button"
                              onClick={() => handleSelectIcon(icon.icon_url)}
                              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-all hover:border-gray-500 hover:bg-gray-50 ${
                                selectedIcon === icon.icon_url
                                  ? "border-gray-500 bg-gray-50"
                                  : "border-gray-200 bg-white"
                              }`}
                              title={icon.icon_name}
                            >
                              <img
                                src={icon.icon_url}
                                alt={icon.icon_name}
                                className="h-8 w-8 rounded object-cover sm:h-10 sm:w-10"
                              />
                              <span className="line-clamp-1 text-center text-[10px] text-gray-600 sm:text-xs">
                                {icon.icon_name}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteCustomIcon(e, icon.id)
                              }
                              className="absolute -top-1 -right-1 z-10 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                              title="Delete custom icon"
                            >
                              <HiX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : selectedCategory === "custom" ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      <p className="mb-2">No custom icons uploaded yet.</p>
                      <p className="text-xs">
                        Upload an icon below to add it to your library!
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Library Icons Section */}
              {selectedCategory !== "custom" && (
                <>
                  {selectedCategory === "all" &&
                    filteredCustomIcons.length > 0 && (
                      <h4 className="mb-2 px-1 text-xs font-semibold text-gray-700">
                        Icon Library
                      </h4>
                    )}
                  {filteredIcons.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => handleSelectIcon(icon.id)}
                          className={`group flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-all hover:border-gray-500 hover:bg-gray-50 ${
                            selectedIcon === icon.id
                              ? "border-gray-500 bg-gray-50"
                              : "border-gray-200 bg-white"
                          }`}
                          title={icon.name}
                        >
                          <div
                            className={`text-xl transition-colors sm:text-2xl ${
                              selectedIcon === icon.id
                                ? "text-gray-600"
                                : "text-gray-600 group-hover:text-gray-600"
                            }`}
                          >
                            {icon.icon}
                          </div>
                          <span className="line-clamp-1 text-center text-[10px] text-gray-600 sm:text-xs">
                            {icon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No icons found matching your search.
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {selectedCategory === "custom"
                ? `${filteredCustomIcons.length} custom icon${filteredCustomIcons.length !== 1 ? "s" : ""}`
                : selectedCategory === "all"
                  ? `${filteredCustomIcons.length} custom + ${filteredIcons.length} library icons`
                  : `Showing ${filteredIcons.length} of ${iconLibrary.length} icons`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
