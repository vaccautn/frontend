import { useMemo } from "react";
import { FechaInput } from "@/components/FechaInput";
import { ServiciosEstadoSelector } from "./ServiciosEstadoSelector";
import { ServicioListaCard } from "./ServicioListaCard";
import type { PendientesServicio } from "../../utils/servicioEstado";
import type { EstadoServicio, ResultadoServicioRead, ServicioRead } from "../../types";

type Props = {
  servicios: ServicioRead[];
  resultados: ResultadoServicioRead[];
  pendientesPorServicioId: Map<number, PendientesServicio>;
  seleccionadoId: number | null;
  onSelect: (id: number) => void;
  estado: EstadoServicio | null;
  fechaDesde: string;
  fechaHasta: string;
  onEstadoChange: (estado: EstadoServicio | null) => void;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
};

export function ServiciosListaPanel({
  servicios,
  resultados,
  pendientesPorServicioId,
  seleccionadoId,
  onSelect,
  estado,
  fechaDesde,
  fechaHasta,
  onEstadoChange,
  onFechaDesdeChange,
  onFechaHastaChange,
}: Props) {
  const resultadosPorServicioId = useMemo(() => {
    const mapa = new Map<number, ResultadoServicioRead[]>();
    for (const r of resultados) {
      const lista = mapa.get(r.servicio_id) ?? [];
      lista.push(r);
      mapa.set(r.servicio_id, lista);
    }
    return mapa;
  }, [resultados]);

  const filtrados = useMemo(
    () =>
      servicios.filter((s) => {
        if (estado && s.estado !== estado) return false;
        if (fechaDesde && s.fecha_inicio < fechaDesde) return false;
        if (fechaHasta && s.fecha_inicio > fechaHasta) return false;
        return true;
      }),
    [servicios, estado, fechaDesde, fechaHasta],
  );

  return (
    <div className="servicios-lista-panel">
      <div className="servicios-lista-panel__filtros">
        <div className="servicios-lista-panel__fechas">
          <FechaInput
            value={fechaDesde}
            onChange={onFechaDesdeChange}
            aria-label="Filtrar servicios desde una fecha de inicio"
            className="animales-filtros__input"
          />
          <FechaInput
            value={fechaHasta}
            onChange={onFechaHastaChange}
            aria-label="Filtrar servicios hasta una fecha de inicio"
            className="animales-filtros__input"
          />
        </div>
        <ServiciosEstadoSelector servicios={servicios} estado={estado} onChange={onEstadoChange} />
      </div>

      <div className="servicios-lista-panel__scroll">
        {filtrados.length === 0 && (
          <p className="status-message">No se encontraron servicios con los filtros aplicados.</p>
        )}
        {filtrados.map((servicio) => (
          <ServicioListaCard
            key={servicio.id}
            servicio={servicio}
            seleccionado={servicio.id === seleccionadoId}
            pendiente={pendientesPorServicioId.get(servicio.id)}
            resultados={resultadosPorServicioId.get(servicio.id) ?? []}
            onClick={() => onSelect(servicio.id)}
          />
        ))}
      </div>
    </div>
  );
}
