import { Outlet } from "react-router-dom";
import { Sidebar } from "./SideBar";
import { Header } from "./Header";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Header />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
