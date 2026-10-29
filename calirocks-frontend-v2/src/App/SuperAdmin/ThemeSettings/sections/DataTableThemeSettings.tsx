import React, { useState, useMemo } from "react";
import useAuth from "../../../../hooks/Auth/useAuth";
import useTheme from "../../../../hooks/useTheme";
import axios from "../../../../api/api";
import ColorPickerSimple from "../components/ColorPickerSimple";

interface DataTableThemeSettingsProps {
  themeId: string;
}

const DataTableThemeSettings: React.FC<DataTableThemeSettingsProps> = ({ themeId }) => {
  const { colors } = useTheme();
  const { auth }: any = useAuth();
  const [localColors, setLocalColors] = useState(colors);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Filter ONLY datatable colors
  const datatableColors = useMemo(() => {
    return localColors.filter((c) => c.componentName === "datatable");
  }, [localColors]);

  const { headerColors, bodyColors, rowOddColors, rowEvenColors, rowHoverColors } = useMemo(() => {
    return {
        headerColors: datatableColors.filter((c) => c.category === "header"),
        bodyColors: datatableColors.filter((c) => c.category === "body"),
        rowOddColors: datatableColors.filter((c) => c.category === "row_odd"),
        rowEvenColors: datatableColors.filter((c) => c.category === "row_even"),
        rowHoverColors: datatableColors.filter((c) => c.category === "row_hover"),
    };
    }, [datatableColors]);

  const updateColor = (id: number | undefined, colorKey: string, newValue: string) => {
    setLocalColors((prev) =>
      prev.map((c) => {
        if (id && c.id === id) {
          return { ...c, colorValue: newValue };
        }
        if (!id && c.colorKey === colorKey && c.componentName === "datatable") {
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

      await instance.put("/theme/colors", {
        themeId,
        colors: datatableColors,
      });
      setMessage("Data table colors saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save colors:", error);
      setMessage("Failed to save colors");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const renderColorGroup = (groupName: string, colorList: any[], description: string) => {
    if (colorList.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Data Table Customization</h2>

        {headerColors.length === 0 && 
         rowOddColors.length === 0 && 
         rowEvenColors.length === 0 && 
         rowHoverColors.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            No data table colors found.
          </div>
        ) : (
          <>
            {renderColorGroup(
                "📋 Table Header",
                headerColors,
                "Customize the header row background, text color, and border"
                )}
                {renderColorGroup(
                "📝 Table Body",
                bodyColors,
                "Main text color for all table rows"
                )}
                {renderColorGroup(
                "📊 Row (Main/Odd)",
                rowOddColors,
                "Background and border colors for odd-numbered rows"
                )}
                {renderColorGroup(
                "🔄 Row (Alternating/Even)",
                rowEvenColors,
                "Background and border colors for even-numbered rows"
                )}
                {renderColorGroup(
                "🎯 Row (Hover State)",
                rowHoverColors,
                "Background color when hovering over a row"
                )}
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

export default DataTableThemeSettings;