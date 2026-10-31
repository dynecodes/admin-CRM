export const getDefaultMenuColors = () => [
  // ===== SIDEBAR TOP BAR (Header with "MENU" text) =====
  {
    componentName: "sidebar",
    category: "header",
    colorKey: "background",
    colorValue: "#f3f4f6", // bg-gray-100
  },
  {
    componentName: "sidebar",
    category: "header",
    colorKey: "text",
    colorValue: "#374151", // text-gray-700
  },
  {
    componentName: "sidebar",
    category: "header",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // ===== MAIN NAVIGATION (Dashboard, Services, etc.) =====
  {
    componentName: "sidebar",
    category: "menu",
    colorKey: "background",
    colorValue: "#ffffff", // bg-white
  },
  {
    componentName: "sidebar",
    category: "menu",
    colorKey: "text",
    colorValue: "#374151", // text-gray-700
  },
  {
    componentName: "sidebar",
    category: "menu",
    colorKey: "active_background",
    colorValue: "#ffffff", // stays white when active
  },
  {
    componentName: "sidebar",
    category: "menu",
    colorKey: "active_text",
    colorValue: "#330000", // text-blue-700
  },
  {
    componentName: "sidebar",
    category: "menu",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // ===== SUBMENU (Settings, etc. panel on right) =====
  {
    componentName: "sidebar",
    category: "submenu",
    colorKey: "background",
    colorValue: "#f9fafb", // bg-gray-50
  },
  {
    componentName: "sidebar",
    category: "submenu",
    colorKey: "text",
    colorValue: "#1f2937", // text-gray-800
  },
  {
    componentName: "sidebar",
    category: "submenu",
    colorKey: "active_background",
    colorValue: "#f3f4f6", // slight darker on active
  },
  {
    componentName: "sidebar",
    category: "submenu",
    colorKey: "active_text",
    colorValue: "#330000", // text-blue-700
  },
  {
    componentName: "sidebar",
    category: "submenu",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // ===== HEADER (top header bar with logo) =====
  {
    componentName: "header",
    category: "header",
    colorKey: "background",
    colorValue: "#ffffff", // bg-white
  },
  {
    componentName: "header",
    category: "header",
    colorKey: "text",
    colorValue: "#1f2937", // text-gray-900
  },
  {
    componentName: "header",
    category: "header",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // ===== DATA TABLE =====
  // Table Header
  {
    componentName: "datatable",
    category: "header",
    colorKey: "background",
    colorValue: "#f9fafb", // bg-gray-50
  },
  {
    componentName: "datatable",
    category: "header",
    colorKey: "text",
    colorValue: "#374151", // text-gray-700
  },
  {
    componentName: "datatable",
    category: "header",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // Table Body - Main Text Color
  {
    componentName: "datatable",
    category: "body",
    colorKey: "text",
    colorValue: "#6b7280", // text-gray-500
  },

  // Table Row - Odd (Main)
  {
    componentName: "datatable",
    category: "row_odd",
    colorKey: "background",
    colorValue: "#ffffff", // bg-white
  },
  {
    componentName: "datatable",
    category: "row_odd",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // Table Row - Even (Alternating)
  {
    componentName: "datatable",
    category: "row_even",
    colorKey: "background",
    colorValue: "#f9fafb", // bg-gray-50
  },
  {
    componentName: "datatable",
    category: "row_even",
    colorKey: "border",
    colorValue: "#e5e7eb", // border-gray-200
  },

  // Table Row - Hover
  {
    componentName: "datatable",
    category: "row_hover",
    colorKey: "background",
    colorValue: "#f8fafc", // bg-slate-50
  },
];

export const getDefaultTypography = () => [
  {
    componentName: "sidebar",
    category: "header",
    typographyKey: "label",
    fontSize: "1.01rem",
  },
  {
    componentName: "sidebar",
    category: "menu",
    typographyKey: "item_label",
    fontSize: "1.01rem",
  },
  {
    componentName: "sidebar",
    category: "submenu",
    typographyKey: "item_label",
    fontSize: "1.01rem",
  }
];