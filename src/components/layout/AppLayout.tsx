import "./layout.css";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { Header } from "./Header";
import { ToastContainer } from "react-toastify";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="app-shell__main">
        <Header
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
