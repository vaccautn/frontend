import { Paginador } from "@/components/ui/Paginador";
import type { CcAnimal } from "@/features/animales/components/AnimalesTabla";
import { useEffect, useMemo, useState } from "react";
import { useAnimalesLote } from "@/features/mapa/hooks/useAnimalesLote";
import { colorPorEstadoLote } from "@/features/mapa/utils/estadoLoteColor";
import type { LotePotreroPropiedades } from "@/features/mapa/types";
import { getAnimalesPagina } from "@/features/animales/services/animalesService";
import { nivelCC, type NivelCC } from "@/features/animales/utils/ccColor";
import type { Animal, CategoriaAnimal } from "@/features/animales/types";

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
  if (lote) return <ListaDeLote key={lote.id} loteId={lote.id} />;
  return (
    <ListaGeneral
      key={`${busquedaCaravana}-${categoriaLote}`}
      lotes={lotes}
      busquedaCaravana={busquedaCaravana}
      categoriaLote={categoriaLote}
      onLoteHover={onLoteHover}
    />
  );
}

function ListaDeLote({ loteId }: { loteId: number }) {
  const { animales, loading } = useAnimalesLote(loteId);
  const [pagina, setPagina] = useState(0);

  return (
    <>
      <Paginador pagina={pagina} total={animales.length} onChange={setPagina} />
      <div className="rodeo-panel__lista-header">
        <span>Animales</span>
        <span>CC</span>
      </div>
      <div className="rodeo-panel__lista-scroll">
        {loading && <p className="status-message">Cargando...</p>}
        {!loading && animales.length === 0 && (
          <p className="status-message">
            No hay animales activos en este lote.
          </p>
        )}
        {!loading &&
          animales.slice(pagina * 50, (pagina + 1) * 50).map((animal) => (
            <div key={animal.id} className="rodeo-panel__animal">
              <div className="rodeo-panel__animal-info">
                <span className="rodeo-panel__animal-tag">
                  {animal.caravana ?? `#${animal.id}`}
                </span>
                <span className="rodeo-panel__animal-cat">
                  {animal.categoria}
                </span>
              </div>
              <div className="rodeo-panel__animal-barra">
                {animal.valor_cc !== null && (
                  <div
                    className="rodeo-panel__animal-barra-rellena"
                    style={{
                      width: `${((animal.valor_cc - animal.escala_min) / (animal.escala_max - animal.escala_min)) * 100}%`,
                      background: colorPorNivelCC(
                        animal.valor_cc,
                        animal.fecha_cc,
                      ),
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
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [ccPorAnimal, setCcPorAnimal] = useState<Map<number, CcAnimal>>(
    new Map(),
  );
  const lotePorId = useMemo(
    () => new Map(lotes.map((lote) => [lote.id, lote])),
    [lotes],
  );
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      getAnimalesPagina(
        {
          estado: "ACTIVO",
          ...(busquedaCaravana ? { caravana: busquedaCaravana } : {}),
        },
        pagina,
        categoriaLote,
      )
        .then((data) => {
          if (!cancelled) {
            setAnimales(data.items);
            setTotal(data.total);
            setCcPorAnimal(
              new Map(
                Object.entries(data.cc).map(([id, cc]) => [Number(id), cc]),
              ),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setError("No se pudieron cargar los animales.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [busquedaCaravana, categoriaLote, pagina]);
  const animalesFiltrados = animales;

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <Paginador pagina={pagina} total={total} onChange={setPagina} />
      <div className="rodeo-panel__lista-header">
        <span>Animales · {animalesFiltrados.length}</span>
        <span>CC</span>
      </div>
      <div className="rodeo-panel__lista-scroll">
        {loading && <p className="status-message">Cargando...</p>}
        {!loading && animalesFiltrados.length === 0 && (
          <p className="status-message">
            No se encontraron animales con los filtros aplicados.
          </p>
        )}
        {!loading &&
          animalesFiltrados.map((animal) => {
            const lote =
              animal.lote_id !== null
                ? lotePorId.get(animal.lote_id)
                : undefined;
            const cc = ccPorAnimal.get(animal.id);
            return (
              <div
                key={animal.id}
                className="rodeo-panel__animal"
                onMouseEnter={() => onLoteHover?.(animal.lote_id)}
                onMouseLeave={() => onLoteHover?.(null)}
              >
                <div className="rodeo-panel__animal-info">
                  <span className="rodeo-panel__animal-tag">
                    {animal.caravana ?? `#${animal.id}`}
                  </span>
                  <span className="rodeo-panel__animal-cat">
                    {lote ? (
                      <>
                        <span
                          className="rodeo-panel__animal-dot"
                          style={{
                            background: colorPorEstadoLote(lote.estado),
                          }}
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
