import React, { createContext, useState, useEffect } from "react";
import axios from "../api/api";
import { getDefaultMenuColors, getDefaultTypography } from "../config/themeDefaults";
import useAuth from "../hooks/Auth/useAuth";

export interface ColorConfig {
  id?: number;
  componentName: string;
  category: string;
  colorKey: string;
  colorValue: string;
}

export interface TypographyConfig {
  id?: number;
  componentName: string;
  category: string;
  typographyKey: string;
  fontSize: string;
}

export interface ThemeContextType {
  colors: ColorConfig[];
  typography: TypographyConfig[];
  themeId: string | null;
  loading: boolean;
  error: string | null;
  getColorByPath: (componentName: string, category: string, colorKey: string) => string;
  getTypographyByPath: (
    componentName: string,
    category: string,
    typographyKey: string
  ) => TypographyConfig | undefined;
  getFontSize: (componentName: string, category: string, typographyKey: string) => string;
  fetchThemeSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_COLORS = getDefaultMenuColors();
const DEFAULT_TYPOGRAPHY = getDefaultTypography();
// const DEFAULT_COLORS: ColorConfig[] = [
//   // Header colors
//   { componentName: "header", category: "header", colorKey: "background", colorValue: "#FFFFFF" }, // white
//   { componentName: "header", category: "header", colorKey: "text", colorValue: "#DC2626" },      // red
//   { componentName: "header", category: "header", colorKey: "border", colorValue: "#D1D5DB" },    // gray-300

//   // Other default menu colors
//   ...getDefaultMenuColors(),
// ];

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colors, setColors] = useState<ColorConfig[]>(DEFAULT_COLORS);
  const [typography, setTypography] = useState<TypographyConfig[]>(DEFAULT_TYPOGRAPHY);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { auth }: any = useAuth();

  const fetchThemeSettings = async () => {
    if (!auth?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const instance = axios.create({
        baseURL: axios.defaults.baseURL,
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      const response = await instance.get("/theme/settings");
      
      setThemeId(response.data.data.themeId);
      
      const fetchedColors = response.data.data.colors || [];
      setColors(fetchedColors.length > 0 ? fetchedColors : DEFAULT_COLORS);
      
      const fetchedTypography = response.data.data.typography || [];
      setTypography(fetchedTypography.length > 0 ? fetchedTypography : DEFAULT_TYPOGRAPHY);
    } catch (error: any) {
      console.error("Failed to fetch theme settings:", error);
      setError(error.message);
      setColors(DEFAULT_COLORS);
      setTypography(DEFAULT_TYPOGRAPHY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.accessToken && !themeId) {
      fetchThemeSettings();
    }
  }, [auth?.accessToken]);

  const getColorByPath = (
    componentName: string,
    category: string,
    colorKey: string
  ): string => {
    const color = colors.find(
      (c) =>
        c.componentName === componentName &&
        c.category === category &&
        c.colorKey === colorKey
    );
    return color?.colorValue || "#FFFFFF";
  };

  const getTypographyByPath = (
    componentName: string,
    category: string,
    typographyKey: string
  ): TypographyConfig | undefined => {
    return typography.find(
      (t) =>
        t.componentName === componentName &&
        t.category === category &&
        t.typographyKey === typographyKey
    );
  };

  const getFontSize = (
    componentName: string,
    category: string,
    typographyKey: string
  ): string => {
    const typo = getTypographyByPath(componentName, category, typographyKey);
    return typo?.fontSize || "0.875rem";
  };

  return (
    <ThemeContext.Provider
      value={{
        colors,
        typography,
        themeId,
        loading,
        error,
        getColorByPath,
        getTypographyByPath,
        getFontSize,
        fetchThemeSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;