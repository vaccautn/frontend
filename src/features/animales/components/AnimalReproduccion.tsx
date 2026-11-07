import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
type Resultado = {
  id: number;
  servicio_id: number;
  estado: string;
  fecha_diagnostico: string | null;
  cria_id: number | null;
  cria_caravana: string | null;
};
export function AnimalReproduccion({ animalId }: { animalId: number }) {
  const [items, setItems] = useState<Resultado[]>([]);
  const [revision, setRevision] = useState(0);
  const [registrando, setRegistrando] = useState<number | null>(null);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [caravana, setCaravana] = useState("");
  const [lote, setLote] = useState("");
  const [categoria, setCategoria] = useState("TERNERA");
  const [fecha, setFecha] = useState(new Date().toLocaleDateString("en-CA"));
  const [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() => setMensaje("No se pudieron cargar los lotes."));
  }, []);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancel = false;
    getJson<Resultado[]>(`/animales/${animalId}/reproduccion`, getAccessToken())
      .then((data) => {
        if (!cancel) setItems(data);
      })
      .catch(() => {
        if (!cancel) setError(true);
      });
    return () => {
      cancel = true;
    };
  }, [animalId, revision]);
  return (
    <section className="animal-detail__section">
      <h2>Servicios y crías</h2>
      {error ? (
        <p role="alert">No se pudo cargar el historial reproductivo.</p>
      ) : !items.length ? (
        <p>Sin resultados reproductivos registrados.</p>
      ) : (
        items.map((r) => (
          <article className="actividad-tanda" key={r.id}>
            <Link to={`/servicios/${r.servicio_id}`}>
              Servicio #{r.servicio_id}
            </Link>
            <p>
              {r.estado}
              {r.fecha_diagnostico ? ` · ${r.fecha_diagnostico}` : ""}
            </p>
            {r.cria_id && (
              <Link to={`/rodeo/${r.cria_id}`}>
                Cría {r.cria_caravana ?? `#${r.cria_id}`}
              </Link>
            )}
            {!r.cria_id && ["PRENADA", "PARIDA"].includes(r.estado) && (
              <button
                type="button"
                onClick={() => {
                  setRegistrando(r.id);
                  setMensaje("");
                }}
              >
                Registrar nacimiento
              </button>
            )}
          </article>
        ))
      )}
      {mensaje && <p role="alert">{mensaje}</p>}
      {registrando && (
        <form
          className="evaluaciones-filtros"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setMensaje("");
            try {
              await postJson(
                `/resultados-servicio/${registrando}/cria`,
                {
                  caravana,
                  lote_id: Number(lote),
                  categoria,
                  fecha_nacimiento: fecha,
                },
                getAccessToken(),
              );
              setRegistrando(null);
              setCaravana("");
              setRevision((v) => v + 1);
            } catch (err) {
              setMensaje(
                err instanceof Error
                  ? err.message
                  : "No se pudo registrar el nacimiento",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Caravana de la cría
            <input
              required
              value={caravana}
              onChange={(e) => setCaravana(e.target.value)}
            />
          </label>
          <label>
            Nuevo lote
            <select
              required
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            >
              <option value="">Elegir lote</option>
              {lotes
                .filter((l) => l.activo)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="TERNERA">Ternera</option>
              <option value="TERNERO">Ternero</option>
            </select>
          </label>
          <label>
            Fecha de nacimiento
            <input
              required
              type="date"
              value={fecha}
              max={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            Guardar nacimiento
          </button>
          <button type="button" onClick={() => setRegistrando(null)}>
            Cancelar
          </button>
        </form>
      )}
    </section>
  );
}
