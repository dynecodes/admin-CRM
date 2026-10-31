// layouts/menus/types.ts
import { ReactNode } from "react";

export interface MenuItem {
  name: string;
  label: string;
  link?: string;
  icon: ReactNode;
  children?: MenuItem[];
}