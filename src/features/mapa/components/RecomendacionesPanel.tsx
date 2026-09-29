import { Button } from "@chakra-ui/react";
import { IconRefresh } from "@tabler/icons-react";
import type { Movimiento } from "../types";

type Props = {
  movimientos: Movimiento[];
  loading: boolean;
  visible: boolean;
  onToggleVisible: () => void;
  onRefrescar: () => void;
};

export function RecomendacionesPanel({
  movimientos,
  loading,
  visible,
  onToggleVisible,
  onRefrescar,
}: Props) {
  return (
    <div className="mapa-recomendaciones">
      <div className="mapa-recomendaciones__header">
        <h3>Movimientos recomendados</h3>
        <div className="mapa-recomendaciones__acciones">
          <Button size="xs" variant="ghost" onClick={onToggleVisible}>
            {visible ? "Ocultar flechas" : "Mostrar flechas"}
          </Button>
          <Button size="xs" variant="ghost" onClick={onRefrescar} loading={loading}>
            <IconRefresh size={14} stroke={1.75} />
          </Button>
        </div>
      </div>

      {loading && <p className="status-message">Calculando...</p>}

      {!loading && movimientos.length === 0 && (
        <p className="status-message">
          No hay lotes que necesiten aliviarse por ahora.
        </p>
      )}

      {!loading && movimientos.length > 0 && (
        <ul className="mapa-recomendaciones__lista">
          {movimientos.map((movimiento, indice) => (
            <li key={indice} className="mapa-recomendaciones__item">
              <strong>{movimiento.origen_nombre}</strong> → <strong>{movimiento.destino_nombre}</strong>
              <span className="mapa-recomendaciones__cantidad">
                {movimiento.cantidad_animales} animales
              </span>
              <span className="mapa-recomendaciones__motivo">{movimiento.motivo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
