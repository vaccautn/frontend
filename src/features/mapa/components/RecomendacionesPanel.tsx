import { useState } from "react";
import { Button } from "@chakra-ui/react";
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import type { Movimiento } from "../types";

type Props = {
  movimientos: Movimiento[];
  loading: boolean;
  visible: boolean;
  onToggleVisible: () => void;
};

export function RecomendacionesPanel({
  movimientos,
  loading,
  visible,
  onToggleVisible,
}: Props) {
  const [panelAbierto, setPanelAbierto] = useState(true);

  return (
    <div className="mapa-recomendaciones">
      <div className="mapa-recomendaciones__header">
        <h3>Movimientos recomendados</h3>
        <div className="mapa-recomendaciones__acciones">
          <Button
            size="xs"
            variant="ghost"
            onClick={onToggleVisible}
            title={visible ? "Ocultar flechas" : "Mostrar flechas"}
            aria-label={visible ? "Ocultar flechas" : "Mostrar flechas"}>
            {visible ? <IconEye size={14} /> : <IconEyeOff size={14} />}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={() => setPanelAbierto((valor) => !valor)}
            title={panelAbierto ? "Contraer" : "Expandir"}>
            {panelAbierto ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )}
          </Button>
        </div>
      </div>

      {panelAbierto && (
        <>
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
                  <span>
                    {" "}
                    <strong>{movimiento.origen_nombre}</strong> →{" "}
                    <strong>{movimiento.destino_nombre}</strong>
                  </span>

                  <span className="mapa-recomendaciones__motivo">
                    {movimiento.motivo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
