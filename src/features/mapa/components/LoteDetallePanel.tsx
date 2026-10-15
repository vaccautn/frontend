import { useNavigate } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { colorPorEstadoLote, labelPorEstadoLote, hexConAlpha } from "../utils/estadoLoteColor";
import { colorPorValorCc } from "@/features/animales/utils/ccColor";
import { useAnimalesLote } from "../hooks/useAnimalesLote";
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
  const { animales, loading } = useAnimalesLote(lote.id);
  const colorEstado = colorPorEstadoLote(lote.estado);

  return (
    <aside className="mapa-lote-sidebar">
      <div className="mapa-lote-sidebar__header">
        <div className="mapa-lote-sidebar__titulo-fila">
          <div className="mapa-lote-sidebar__titulo">
            <span
              className="mapa-lote-sidebar__badge"
              style={{ background: hexConAlpha(colorEstado, 0.14), color: colorEstado }}>
              {labelPorEstadoLote(lote.estado)}
            </span>
            <span className="mapa-lote-sidebar__nombre">{lote.nombre}</span>
            <span className="mapa-lote-sidebar__subtitulo">
              {lote.categoria} · {formatearNumero(lote.superficie_ha)} ha
            </span>
          </div>
          <button
            type="button"
            className="mapa-lote-sidebar__cerrar"
            aria-label="Cerrar detalle"
            onClick={onCerrar}>
            <IconX size={18} stroke={1.75} />
          </button>
        </div>

        <div className="mapa-lote-sidebar__stats">
          <div className="mapa-lote-sidebar__stat">
            <span>Animales</span>
            <strong>{lote.cantidad_animales}</strong>
          </div>
          <div className="mapa-lote-sidebar__stat">
            <span>Carga actual</span>
            <strong>
              {formatearNumero(lote.carga_animales_ha, 2)}
              <small> cab/ha</small>
            </strong>
          </div>
          <div className="mapa-lote-sidebar__stat">
            <span>CC promedio</span>
            <strong>{formatearNumero(lote.cc_promedio, 2)}</strong>
          </div>
        </div>
      </div>

      <div className="mapa-lote-sidebar__lista-header">
        <span>Animales</span>
        <span>CC</span>
      </div>

      <div className="mapa-lote-sidebar__lista">
        {loading && <p className="status-message">Cargando...</p>}
        {!loading && animales.length === 0 && (
          <p className="status-message">No hay animales activos en este lote.</p>
        )}
        {!loading &&
          animales.map((animal) => (
            <div key={animal.id} className="mapa-lote-sidebar__animal">
              <div className="mapa-lote-sidebar__animal-info">
                <span className="mapa-lote-sidebar__animal-tag">
                  {animal.caravana ?? `#${animal.id}`}
                </span>
                <span className="mapa-lote-sidebar__animal-cat">{animal.categoria}</span>
              </div>
              <div className="mapa-lote-sidebar__animal-barra">
                {animal.valor_cc !== null && (
                  <div
                    className="mapa-lote-sidebar__animal-barra-rellena"
                    style={{
                      width: `${((animal.valor_cc - animal.escala_min) / (animal.escala_max - animal.escala_min)) * 100}%`,
                      background: colorPorValorCc(animal.valor_cc),
                    }}
                  />
                )}
              </div>
              <span className="mapa-lote-sidebar__animal-valor">
                {animal.valor_cc !== null ? animal.valor_cc.toFixed(1) : "—"}
              </span>
            </div>
          ))}
      </div>

      <div className="mapa-lote-sidebar__footer">
        <Button
          width="100%"
          colorPalette="brand"
          onClick={() => navigate(`/animales?lote_id=${lote.id}`)}>
          Ver detalle del lote
          <IconArrowRight size={16} />
        </Button>
      </div>
    </aside>
  );
}
