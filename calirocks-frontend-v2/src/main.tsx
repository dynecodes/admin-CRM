import { initThemeMode } from "flowbite-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeInit } from "../.flowbite-react/init";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { SocketProvider } from "./context/SocketProvider.tsx";
import App from "./App.tsx";
import "./index.css";
import './polyfills';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeInit />
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
);

initThemeMode();