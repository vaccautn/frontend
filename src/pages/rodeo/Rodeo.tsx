import { PrimaryButton } from "@/components/ui/PrimaryButton";
import "./rodeo.css";
import { Outlet } from "react-router-dom";

export function RodeoPage() {
  return (
    <div>
      <h1>Rodeo</h1>
      <PrimaryButton label="Registrar animal" href="/rodeo/nuevo" />
      <Outlet />
    </div>
  );
}
