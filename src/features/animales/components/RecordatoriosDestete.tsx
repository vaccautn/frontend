import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson, postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
type Recordatorio = { id: number; animal_id: number; vencimiento: string };
export function RecordatoriosDestete() {
  const [ahora] = useState(() => Date.now());
  const [items, setItems] = useState<Recordatorio[]>([]);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancel = false;
    getJson<Recordatorio[]>("/recordatorios", getAccessToken())
      .then((data) => {
        if (!cancel) setItems(data);
      })
      .catch(() => {
        if (!cancel)
          setError("No se pudieron cargar los seguimientos de destete.");
      });
    return () => {
      cancel = true;
    };
  }, [revision]);
  const resolver = async (id: number) => {
    setError("");
    try {
      await postJson(`/recordatorios/${id}/resolver`, {}, getAccessToken());
      setRevision((v) => v + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar el seguimiento",
      );
    }
  };
  if (!items.length && !error) return null;
  return (
    <section className="actividad-tanda">
      <h2>Seguimientos de destete</h2>
      {error && <p role="alert">{error}</p>}
      {items.map((r) => (
        <article key={r.id}>
          <p>
            <Link to={`/rodeo/${r.animal_id}`}>Animal #{r.animal_id}</Link> ·{" "}
            {new Date(r.vencimiento).getTime() <= ahora
              ? "Reevaluación pendiente"
              : "Próxima reevaluación"}
            : {new Date(r.vencimiento).toLocaleDateString("es-AR")}
          </p>
          <Link to="/sesiones">Registrar nueva evaluación de CC</Link> ·{" "}
          <button type="button" onClick={() => void resolver(r.id)}>
            Completar seguimiento
          </button>
        </article>
      ))}
    </section>
  );
}
