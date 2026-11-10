import "@/components/ui/gestion.css";
import { Button, Input, NativeSelect } from "@chakra-ui/react";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import { IconArrowUpRight, IconHeart, IconPlus } from "@tabler/icons-react";
import { ESTADO_RESULTADO_SERVICIO_LABELS } from "@/features/servicios/constants";
import { normalizarCaravana, esCaravanaValida, MENSAJE_FORMATO_CARAVANA } from "../utils/caravana";
import { FechaInput } from "@/components/FechaInput";
import { localNaiveNow } from "@/utils/localDateTime";
import "./animal-reproduccion.css";
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
  const [fecha, setFecha] = useState(localNaiveNow().slice(0, 10));
  const [mensaje, setMensaje] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
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
        if (!cancel) {
          setItems(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancel) setError(true);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [animalId, revision]);
  return (
    <section className="animal-detail__section reproduccion" aria-labelledby="reproduccion-titulo">
      <div className="animal-detail__section-header">
        <div>
          <span className="animal-detail__section-eyebrow">Historial reproductivo</span>
          <h2 id="reproduccion-titulo">Servicios y crías</h2>
        </div>
        <IconHeart size={24} stroke={1.5} aria-hidden="true" />
      </div>
      {error ? (
        <div role="alert" className="reproduccion__vacio">
          <p>No se pudo cargar el historial reproductivo.</p>
          <Button variant="outline" colorPalette="brand" onClick={() => {
            setLoading(true);
            setError(false);
            setRevision((v) => v + 1);
          }}>Reintentar</Button>
        </div>
      ) : loading ? (
        <p className="reproduccion__vacio" role="status">Cargando historial reproductivo…</p>
      ) : !items.length ? (
        <div className="reproduccion__vacio">
          <p>Sin servicios registrados para este animal.</p>
          <span>Sus diagnósticos y crías aparecerán acá.</span>
        </div>
      ) : (
        <div className="reproduccion__lista">
        {items.map((r) => (
          <article className="reproduccion__item" key={r.id}>
            <div className="reproduccion__item-header">
              <Link className="reproduccion__enlace" to={`/servicios/${r.servicio_id}`}>
                Servicio #{r.servicio_id} <IconArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <span className="reproduccion__estado" data-estado={r.estado}>
                {ESTADO_RESULTADO_SERVICIO_LABELS[r.estado] ?? r.estado}
              </span>
            </div>
            <p className="reproduccion__fecha">
              {r.fecha_diagnostico
                ? `Diagnóstico · ${r.fecha_diagnostico.slice(0, 10).split("-").reverse().join("/")}`
                : "Sin fecha de diagnóstico"}
            </p>
            {r.cria_id && (
              <Link className="reproduccion__cria" to={`/rodeo/${r.cria_id}`}>
                <span>Cría registrada <strong>{r.cria_caravana ?? `#${r.cria_id}`}</strong></span>
                <IconArrowUpRight size={18} aria-hidden="true" />
              </Link>
            )}
            {!r.cria_id && ["PRENADA", "PARIDA"].includes(r.estado) && (
              <Button
                colorPalette="brand"
                variant="outline"
                type="button"
                disabled={busy}
                onClick={() => {
                  setRegistrando(r.id);
                  setCaravana("");
                  setLote("");
                  setCategoria("TERNERA");
                  setFecha(localNaiveNow().slice(0, 10));
                  setMensaje("");
                }}
              >
                <IconPlus size={16} aria-hidden="true" /> Registrar nacimiento
              </Button>
            )}
          </article>
        ))}
        </div>
      )}
      {mensaje && <p role="alert">{mensaje}</p>}
      {registrando && (
        <form
          className="reproduccion__form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (!esCaravanaValida(caravana)) {
              setMensaje(MENSAJE_FORMATO_CARAVANA);
              return;
            }
            if (!lote || !fecha) {
              setMensaje("Completá el lote y la fecha de nacimiento.");
              return;
            }
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
          <div className="reproduccion__form-titulo">
            <h3>Registrar nacimiento</h3>
            <p>Servicio #{items.find((item) => item.id === registrando)?.servicio_id}</p>
          </div>
          <label>
            Caravana de la cría
            <Input
              required
              maxLength={15}
              value={caravana}
              onChange={(e) => setCaravana(normalizarCaravana(e.target.value))}
            />
          </label>
          <label>
            Nuevo lote
            <NativeSelect.Root>
              <NativeSelect.Field
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
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </label>
          <label>
            Categoría
            <NativeSelect.Root>
              <NativeSelect.Field
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="TERNERA">Ternera</option>
                <option value="TERNERO">Ternero</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </label>
          <label>
            Fecha de nacimiento
            <FechaInput
              value={fecha}
              aria-label="Fecha de nacimiento de la cría"
              max={localNaiveNow().slice(0, 10)}
              onChange={setFecha}
            />
          </label>
          <div className="reproduccion__acciones">
          <Button
            colorPalette="brand"
            variant="solid"
            loading={busy}
            disabled={busy}
            type="submit"
          >
            Guardar nacimiento
          </Button>
          <Button
            colorPalette="brand"
            variant="outline"
            type="button"
            disabled={busy}
            onClick={() => setRegistrando(null)}
          >
            Cancelar
          </Button>
          </div>
        </form>
      )}
    </section>
  );
}
