import "./layout.css";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { BottomNav } from "./BottomNav";
import { ToastContainer } from "react-toastify";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const isFullBleed = pathname.startsWith("/mapa");

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="app-shell__main">
        <main
          className={`app-shell__content${isFullBleed ? " app-shell__content--full" : ""}`}>
          <div
            className={`app-shell__content-inner${isFullBleed ? " app-shell__content-inner--full" : ""}`}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
