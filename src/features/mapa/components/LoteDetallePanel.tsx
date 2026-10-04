import { useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { colorPorEstadoLote, labelPorEstadoLote } from "../utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "../types";

type Props = {
  lote: LotePotreroPropiedades;
  onCerrar: () => void;
};

function formatearNumero(valor: number | null, decimales = 1): string {
  return valor === null ? "—" : valor.toFixed(decimales);
}

export function LoteDetallePanel({ lote, onCerrar }: Props) {
  const navigate = useNavigate();

  return (
    <div className="mapa-detalle">
      <div className="mapa-detalle__header">
        <span
          className="mapa-detalle__estado"
          style={{ backgroundColor: colorPorEstadoLote(lote.estado) }}>
          {labelPorEstadoLote(lote.estado)}
        </span>
        <h3>{lote.nombre}</h3>
        <button
          type="button"
          className="mapa-detalle__cerrar"
          aria-label="Cerrar detalle"
          onClick={onCerrar}>
          <IconX size={16} stroke={1.75} />
        </button>
      </div>

      <dl className="mapa-detalle__lista">
        <div>
          <dt>Categoría</dt>
          <dd>{lote.categoria}</dd>
        </div>
        <div>
          <dt>Superficie</dt>
          <dd>{formatearNumero(lote.superficie_ha)} ha</dd>
        </div>
        <div>
          <dt>Animales</dt>
          <dd>{lote.cantidad_animales}</dd>
        </div>
        <div>
          <dt>Carga actual</dt>
          <dd>{formatearNumero(lote.carga_animales_ha, 2)} cab/ha</dd>
        </div>
        <div>
          <dt>Receptividad</dt>
          <dd>{formatearNumero(lote.receptividad_ev_ha)} EV/ha</dd>
        </div>
        <div>
          <dt>CC (últ. sesión)</dt>
          <dd>{formatearNumero(lote.cc_promedio, 2)}</dd>
        </div>
        {lote.edad_promedio_meses !== undefined && lote.edad_promedio_meses !== null && (
          <div>
            <dt>Edad prom.</dt>
            <dd>{formatearNumero(lote.edad_promedio_meses, 0)} meses</dd>
          </div>
        )}
      </dl>

      <div className="mapa-detalle__footer">
        <Button
          size="xs"
          variant="outline"
          colorPalette="brand"
          width="100%"
          onClick={() => navigate(`/animales?lote_id=${lote.id}`)}>
          Ver animales del lote
          <IconArrowRight size={13} />
        </Button>
      </div>
    </div>
  );
}
