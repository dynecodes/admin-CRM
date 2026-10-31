import React, { useState, useMemo } from "react";
import useAuth from "../../../../hooks/Auth/useAuth";
import useTheme from "../../../../hooks/useTheme";
import axios from "../../../../api/api";

interface TypographyThemeSettingsProps {
  themeId: string;
}

const TypographyThemeSettings: React.FC<TypographyThemeSettingsProps> = ({ themeId }) => {
  const { typography } = useTheme();
  const { auth }: any = useAuth();
  const [localTypography, setLocalTypography] = useState(typography);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sidebarTypography = useMemo(() => {
    return localTypography.filter((t) => t.componentName === "sidebar");
  }, [localTypography]);

  const headerTypography = useMemo(() => {
    return localTypography.filter((t) => t.componentName === "header");
  }, [localTypography]);

  const datatableTypography = useMemo(() => {
    return localTypography.filter((t) => t.componentName === "datatable");
  }, [localTypography]);

  const updateFontSize = (id: number | undefined, newValue: string) => {
    setLocalTypography((prev) =>
      prev.map((t) => {
        if (id && t.id === id) {
          return { ...t, fontSize: newValue };
        }
        return t;
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

      await instance.put("/theme/typography", {
        themeId,
        typography: localTypography,
      });
      setMessage("Font sizes saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save typography:", error);
      setMessage("Failed to save font sizes");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const renderTypographyGroup = (groupName: string, typoList: any[], description: string) => {
    if (typoList.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="space-y-4 pl-4 border-l-4 border-blue-500">
          {typoList.map((typo) => (
            <div key={`${typo.componentName}-${typo.category}-${typo.typographyKey}-${typo.id}`} className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 capitalize mb-2">
                {typo.typographyKey.replace(/_/g, " ")}
              </label>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={typo.fontSize}
                    onChange={(e) => updateFontSize(typo.id, e.target.value)}
                    placeholder="e.g., 14px, 0.875rem, 1.2em"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Use px, rem, em, etc.</p>
                </div>
              </div>

              <div className="border-t mt-3 pt-3">
                <p style={{ fontSize: typo.fontSize }} className="text-gray-900">
                  Preview: The quick brown fox
                </p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Font Sizes</h2>

        {sidebarTypography.length === 0 && 
         headerTypography.length === 0 && 
         datatableTypography.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            No font size settings found.
          </div>
        ) : (
          <>
            {renderTypographyGroup(
              "📋 Sidebar Font Sizes",
              sidebarTypography,
              "Customize font sizes for sidebar menu items"
            )}
            {renderTypographyGroup(
              "🎯 Header Font Sizes",
              headerTypography,
              "Customize font sizes for header elements"
            )}
            {renderTypographyGroup(
              "📊 Data Table Font Sizes",
              datatableTypography,
              "Customize font sizes for table headers and cells"
            )}
          </>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? "Saving..." : "Save Font Sizes"}
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

export default TypographyThemeSettings;