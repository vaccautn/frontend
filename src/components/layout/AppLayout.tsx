import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { Header } from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Header />
        <main className="app-shell__content">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
