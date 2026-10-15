import { useEffect, useMemo, useState } from "react";
import { useAnimalesLote } from "@/features/mapa/hooks/useAnimalesLote";
import { colorPorEstadoLote } from "@/features/mapa/utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "@/features/mapa/types";
import { getAnimales } from "@/features/animales/services/animalesService";
import { nivelCC, type NivelCC } from "@/features/animales/utils/ccColor";
import type { Animal, CategoriaAnimal } from "@/features/animales/types";
import { useCcPorAnimal } from "../../hooks/useCcPorAnimal";

// Mismo criterio que DashboardHistograma/MiniHistogramaCC: color por nivel de
// alerta mes-dependiente, no por el valor de CC en sí.
const NIVEL_COLORS: Record<NivelCC, string> = {
  critico: "#c94c4c",
  atencion: "#e0a83e",
  normal: "#4a9163",
};

function colorPorNivelCC(valorCc: number, fechaCc: string | null): string {
  return NIVEL_COLORS[nivelCC(valorCc, fechaCc ?? new Date().toISOString())];
}

type Props = {
  lote: LotePotreroPropiedades | null;
  lotes: LotePotreroPropiedades[];
  busquedaCaravana: string;
  categoriaLote: CategoriaAnimal | null;
  onLoteHover?: (loteId: number | null) => void;
};

export function RodeoListaAnimales({
  lote,
  lotes,
  busquedaCaravana,
  categoriaLote,
  onLoteHover,
}: Props) {
  if (lote) return <ListaDeLote loteId={lote.id} />;
  return (
    <ListaGeneral
      lotes={lotes}
      busquedaCaravana={busquedaCaravana}
      categoriaLote={categoriaLote}
      onLoteHover={onLoteHover}
    />
  );
}

function ListaDeLote({ loteId }: { loteId: number }) {
  const { animales, loading } = useAnimalesLote(loteId);

  return (
    <>
      <div className="rodeo-panel__lista-header">
        <span>Animales</span>
        <span>CC</span>
      </div>
      <div className="rodeo-panel__lista-scroll">
        {loading && <p className="status-message">Cargando...</p>}
        {!loading && animales.length === 0 && (
          <p className="status-message">No hay animales activos en este lote.</p>
        )}
        {!loading &&
          animales.map((animal) => (
            <div key={animal.id} className="rodeo-panel__animal">
              <div className="rodeo-panel__animal-info">
                <span className="rodeo-panel__animal-tag">
                  {animal.caravana ?? `#${animal.id}`}
                </span>
                <span className="rodeo-panel__animal-cat">{animal.categoria}</span>
              </div>
              <div className="rodeo-panel__animal-barra">
                {animal.valor_cc !== null && (
                  <div
                    className="rodeo-panel__animal-barra-rellena"
                    style={{
                      width: `${((animal.valor_cc - animal.escala_min) / (animal.escala_max - animal.escala_min)) * 100}%`,
                      background: colorPorNivelCC(animal.valor_cc, animal.fecha_cc),
                    }}
                  />
                )}
              </div>
              <span className="rodeo-panel__animal-valor">
                {animal.valor_cc !== null ? animal.valor_cc.toFixed(1) : "—"}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}

function ListaGeneral({
  lotes,
  busquedaCaravana,
  categoriaLote,
  onLoteHover,
}: {
  lotes: LotePotreroPropiedades[];
  busquedaCaravana: string;
  categoriaLote: CategoriaAnimal | null;
  onLoteHover?: (loteId: number | null) => void;
}) {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const lotePorId = useMemo(() => new Map(lotes.map((l) => [l.id, l])), [lotes]);

  useEffect(() => {
    setLoading(true);
    getAnimales({
      estado: "ACTIVO",
      ...(busquedaCaravana ? { caravana: busquedaCaravana } : {}),
    })
      .then(setAnimales)
      .catch(() => setAnimales([]))
      .finally(() => setLoading(false));
  }, [busquedaCaravana]);

  const animalesFiltrados = useMemo(() => {
    if (!categoriaLote) return animales;
    return animales.filter(
      (a) => a.lote_id !== null && lotePorId.get(a.lote_id)?.categoria === categoriaLote,
    );
  }, [animales, categoriaLote, lotePorId]);

  const loteIds = useMemo(
    () => [...new Set(animalesFiltrados.map((a) => a.lote_id).filter((id): id is number => id !== null))],
    [animalesFiltrados],
  );
  const { ccPorAnimal } = useCcPorAnimal(loteIds);

  return (
    <>
      <div className="rodeo-panel__lista-header">
        <span>Animales · {animalesFiltrados.length}</span>
        <span>CC</span>
      </div>
      <div className="rodeo-panel__lista-scroll">
        {loading && <p className="status-message">Cargando...</p>}
        {!loading && animalesFiltrados.length === 0 && (
          <p className="status-message">No se encontraron animales con los filtros aplicados.</p>
        )}
        {!loading &&
          animalesFiltrados.map((animal) => {
            const lote = animal.lote_id !== null ? lotePorId.get(animal.lote_id) : undefined;
            const cc = ccPorAnimal.get(animal.id);
            return (
              <div
                key={animal.id}
                className="rodeo-panel__animal"
                onMouseEnter={() => onLoteHover?.(animal.lote_id)}
                onMouseLeave={() => onLoteHover?.(null)}>
                <div className="rodeo-panel__animal-info">
                  <span className="rodeo-panel__animal-tag">
                    {animal.caravana ?? `#${animal.id}`}
                  </span>
                  <span className="rodeo-panel__animal-cat">
                    {lote ? (
                      <>
                        <span
                          className="rodeo-panel__animal-dot"
                          style={{ background: colorPorEstadoLote(lote.estado) }}
                        />
                        {lote.nombre}
                      </>
                    ) : (
                      "Sin lote"
                    )}
                  </span>
                </div>
                <div className="rodeo-panel__animal-barra">
                  {cc?.valor_cc != null && (
                    <div
                      className="rodeo-panel__animal-barra-rellena"
                      style={{
                        width: `${((cc.valor_cc - cc.escala_min) / (cc.escala_max - cc.escala_min)) * 100}%`,
                        background: colorPorNivelCC(cc.valor_cc, cc.fecha_cc),
                      }}
                    />
                  )}
                </div>
                <span className="rodeo-panel__animal-valor">
                  {cc?.valor_cc != null ? cc.valor_cc.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
      </div>
    </>
  );
}
