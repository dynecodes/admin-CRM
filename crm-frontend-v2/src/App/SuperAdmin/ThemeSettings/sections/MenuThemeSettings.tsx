import React, { useState, useMemo } from "react";
import useAuth from "../../../../hooks/Auth/useAuth";
import useTheme from "../../../../hooks/useTheme";
import axios from "../../../../api/api";
import ColorPickerSimple from "../components/ColorPickerSimple";

interface MenuThemeSettingsProps {
  themeId: string;
}

const MenuThemeSettings: React.FC<MenuThemeSettingsProps> = ({ themeId }) => {
  const { colors } = useTheme();
  const { auth }: any = useAuth();
  const [localColors, setLocalColors] = useState(colors);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Filter ONLY sidebar colors (not header colors)
  const sidebarColors = useMemo(() => {
    return localColors.filter((c) => c.componentName === "sidebar");
  }, [localColors]);

  const { headerColors, menuColors, submenuColors } = useMemo(() => {
    return {
      headerColors: sidebarColors.filter((c) => c.category === "header"),
      menuColors: sidebarColors.filter((c) => c.category === "menu"),
      submenuColors: sidebarColors.filter((c) => c.category === "submenu"),
    };
  }, [sidebarColors]);

  const updateColor = (id: number | undefined, colorKey: string, newValue: string) => {
    setLocalColors((prev) =>
      prev.map((c) => {
        // Use both id and colorKey to ensure uniqueness
        if (id && c.id === id) {
          return { ...c, colorValue: newValue };
        }
        // Fallback if no id (shouldn't happen)
        if (!id && c.colorKey === colorKey && c.componentName === "sidebar") {
          return { ...c, colorValue: newValue };
        }
        return c;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const instance = axios.create({
        baseURL: axios.defaults.baseURL,
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      // Save ONLY the sidebar colors being edited
      await instance.put("/theme/colors", {
        themeId,
        colors: sidebarColors,
      });
      setMessage("Menu colors saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save colors:", error);
      setMessage("Failed to save colors");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const renderColorGroup = (groupName: string, colorList: any[]) => {
    if (colorList.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{groupName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-4 border-blue-500">
          {colorList.map((color) => (
            <div key={`${color.componentName}-${color.category}-${color.colorKey}-${color.id}`} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {color.colorKey.replace(/_/g, " ")}
              </label>
              <div className="flex items-center gap-3">
                <ColorPickerSimple
                  value={color.colorValue}
                  onChange={(newValue) => updateColor(color.id, color.colorKey, newValue)}
                />
                <input
                  type="text"
                  value={color.colorValue}
                  onChange={(e) => updateColor(color.id, color.colorKey, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Sidebar & Menu Customization</h2>

        {headerColors.length === 0 && menuColors.length === 0 && submenuColors.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            No sidebar colors found.
          </div>
        ) : (
          <>
            {renderColorGroup("📋 Sidebar Header (Top Bar)", headerColors)}
            {renderColorGroup("🔗 Main Navigation Menu (Dashboard, Services, etc.)", menuColors)}
            {renderColorGroup("📑 Submenu Panel (Right Side)", submenuColors)}
          </>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? "Saving..." : "Save All Colors"}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuThemeSettings;