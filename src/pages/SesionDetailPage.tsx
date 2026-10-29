import { Button } from "@chakra-ui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { SesionDetalle } from "@/features/sesiones/components/SesionDetalle";
import "@/features/sesiones/components/sesiones.css";

/** Ruta directa a una sesión (p. ej. desde los avisos de recomendaciones). */
export function SesionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <>
      <Button
        colorPalette="brand"
        variant="ghost"
        className="sesion-detail__back"
        onClick={() => navigate(`/sesiones?sesion=${id}`)}>
        <IconArrowLeft size={16} stroke={1.5} />
        Volver a sesiones
      </Button>
      <SesionDetalle
        sesionId={Number(id)}
        onEliminada={() => navigate("/sesiones")}
      />
    </>
  );
}
