import "@/components/ui/gestion.css";
import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import { Paginador } from "@/components/ui/Paginador";
import { usePageState } from "@/hooks/usePageState";
import "@/features/animales/components/animales.css";

type Tanda = {
  id: number;
  tipo: string;
  creado_en: string;
  responsable: string;
  detalle: {
    animal_ids?: number[];
    caravanas?: string[];
    cambios?: { animal_id: number; origen_id: number; destino_id: number }[];
    filas?: { numero: number; estado: string; animal_id?: number }[];
  };
};
export function ActividadPage() {
  const [pagina, setPagina] = usePageState("actividad.pagina", 0);
  const [items, setItems] = useState<Tanda[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [limites, setLimites] = useState<Record<number, number>>({});
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      getJson<{ items: Tanda[]; total: number }>(
        `/actividad?limit=50&offset=${pagina * 50}`,
        getAccessToken(),
      )
        .then((data) => {
          if (!cancelled) {
            setItems(data.items);
            setTotal(data.total);
          }
        })
        .catch(() => {
          if (!cancelled) setError("No se pudo cargar el historial.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [pagina, revision]);
  return (
    <section className="gestion-page">
      <div className="section-header">
        <h1>Historial de actividad</h1>
      </div>
      <p>
        Altas, importaciones y movimientos, con su responsable y el resultado de
        cada tanda.
      </p>
      {error && (
        <p role="alert">
          {error}{" "}
          <Button colorPalette="brand" variant="outline" type="button" onClick={() => setRevision((v) => v + 1)}>
            Reintentar
          </Button>
        </p>
      )}
      {loading ? (
        <p>Cargando historial…</p>
      ) : (
        <>
          <Paginador pagina={pagina} total={total} onChange={setPagina} />
          {!items.length && !error && (
            <p>No hay actividad registrada todavía.</p>
          )}
          {items.map((t) => (
            <article className="gestion-card" key={t.id}>
              <h2>
                {t.tipo === "IMPORTACION"
                  ? "Importación de planilla"
                  : t.tipo === "MOVIMIENTO"
                    ? "Movimiento entre lotes"
                    : "Alta de animales"}{" "}
                · #{t.id}
              </h2>
              <p>
                {new Date(t.creado_en).toLocaleString("es-AR")} ·{" "}
                {t.responsable}
              </p>
              <details
                onToggle={(event) => {
                  const abierto = event.currentTarget.open;
                  setLimites((prev) => ({
                    ...prev,
                    [t.id]: abierto ? 100 : 0,
                  }));
                }}
              >
                <summary>Ver animales y resultados</summary>
                {t.detalle.caravanas?.slice(0, limites[t.id] ?? 0).join(", ")}
                {t.detalle.cambios?.slice(0, limites[t.id] ?? 0).map((c) => (
                  <p key={c.animal_id}>
                    Animal #{c.animal_id}: lote #{c.origen_id} → lote #
                    {c.destino_id}
                  </p>
                ))}
                {t.detalle.filas?.slice(0, limites[t.id] ?? 0).map((f) => (
                  <p key={f.numero}>
                    Fila {f.numero} · {f.estado}
                    {f.animal_id ? ` · animal #${f.animal_id}` : ""}
                  </p>
                ))}
                {Math.max(
                  t.detalle.caravanas?.length ?? 0,
                  t.detalle.cambios?.length ?? 0,
                  t.detalle.filas?.length ?? 0,
                ) > (limites[t.id] ?? 0) &&
                  limites[t.id] > 0 && (
                    <Button colorPalette="brand" variant="outline"
                      type="button"
                      onClick={() =>
                        setLimites((prev) => ({
                          ...prev,
                          [t.id]: (prev[t.id] ?? 100) + 100,
                        }))
                      }
                    >
                      Mostrar 100 resultados más
                    </Button>
                  )}
              </details>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
