import React, { useState } from "react";
import useAuth from "../../../../hooks/Auth/useAuth";
import useTheme from "../../../../hooks/useTheme";
import axios from "../../../../api/api";
import ColorPickerSimple from "../components/ColorPickerSimple";

interface HeaderThemeSettingsProps {
  themeId: string;
}

const HeaderThemeSettings: React.FC<HeaderThemeSettingsProps> = ({ themeId }) => {
  const { colors } = useTheme();
  const { auth }: any = useAuth();
  const [localColors, setLocalColors] = useState(
    colors.filter((c) => c.componentName === "header" && c.category === "header")
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateColor = (colorKey: string, newValue: string) => {
    setLocalColors((prev) =>
      prev.map((c) =>
        c.colorKey === colorKey ? { ...c, colorValue: newValue } : c
      )
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
        colors: localColors,
      });
      setMessage("Header colors saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save colors:", error);
      setMessage("Failed to save colors");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Header Colors</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localColors.map((color) => (
            <div key={color.id || color.colorKey} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {color.colorKey.replace(/_/g, " ")}
              </label>
              <div className="flex items-center gap-3">
                <ColorPickerSimple
                  value={color.colorValue}
                  onChange={(newValue) => updateColor(color.colorKey, newValue)}
                />
                <input
                  type="text"
                  value={color.colorValue}
                  onChange={(e) => updateColor(color.colorKey, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? "Saving..." : "Save Colors"}
        </button>

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

export default HeaderThemeSettings;