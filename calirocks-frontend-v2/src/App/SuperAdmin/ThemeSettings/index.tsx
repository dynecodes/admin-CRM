import { useState, useEffect } from "react";
import useTheme from "../../../hooks/useTheme";
import useAuth from "../../../hooks/Auth/useAuth";
import axios from "../../../api/api";
import MenuThemeSettings from "./sections/MenuThemeSettings";
import HeaderThemeSettings from "./sections/HeaderThemeSettings";
import DataTableThemeSettings from "./sections/DataTableThemeSettings";
import TypographyThemeSettings from "./sections/TypographyThemeSettings";

const ThemeSettingsPage = () => {
  const { themeId: contextThemeId, loading: contextLoading, fetchThemeSettings } = useTheme();
  const { auth }: any = useAuth();
  const [activeSection, setActiveSection] = useState("menu");
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!contextThemeId && !contextLoading && auth?.accessToken) {
      fetchThemeSettings();
    }
  }, [auth?.accessToken, contextThemeId, contextLoading]);

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all theme settings to defaults?")) {
      return;
    }

    try {
      setResetting(true);
      const instance = axios.create({
        baseURL: axios.defaults.baseURL,
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });
      
      await instance.post("/theme/reset", { themeId: contextThemeId });
      setMessage("Theme reset successfully");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset theme:", error);
      setMessage("Failed to reset theme");
    } finally {
      setResetting(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  if (!contextThemeId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load theme settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Theme Settings</h1>
          <p className="text-gray-600 mt-1">Customize colors and typography for your application</p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {resetting ? "Resetting..." : "Reset to Defaults"}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveSection("menu")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === "menu"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Menu & Sidebar
          </button>
          <button
            onClick={() => setActiveSection("header")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === "header"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Header
          </button>
          <button
            onClick={() => setActiveSection("datatable")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === "datatable"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Data Table
          </button>
          <button
            onClick={() => setActiveSection("typography")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSection === "typography"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            Font Sizes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeSection === "menu" && <MenuThemeSettings themeId={contextThemeId} />}
        {activeSection === "header" && <HeaderThemeSettings themeId={contextThemeId} />}
        {activeSection === "datatable" && <DataTableThemeSettings themeId={contextThemeId} />}
        {activeSection === "typography" && <TypographyThemeSettings themeId={contextThemeId} />}
      </div>
    </div>
  );
};

export default ThemeSettingsPage;