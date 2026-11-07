import { useEffect, useState, type FormEvent } from "react";
import { getJson, postJson, deleteRequest } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";

type Campo = { id: number; nombre: string; es_propietario: boolean };
type Miembro = { id: number; email: string; nombre: string };
export function CamposPage() {
  const [campos, setCampos] = useState<Campo[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [administrar, setAdministrar] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancel = false;
    getJson<Campo[]>("/campos", getAccessToken())
      .then((data) => {
        if (!cancel) setCampos(data);
      })
      .catch(() => {
        if (!cancel) setError("No se pudieron cargar los campos.");
      });
    return () => {
      cancel = true;
    };
  }, [revision]);
  useEffect(() => {
    let cancel = false;
    if (administrar)
      getJson<Miembro[]>(`/campos/${administrar}/miembros`, getAccessToken())
        .then((data) => {
          if (!cancel) setMiembros(data);
        })
        .catch(() => {
          if (!cancel) setError("No se pudieron cargar los colaboradores.");
        });
    return () => {
      cancel = true;
    };
  }, [administrar, revision]);
  const actuar = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };
  const crear = (e: FormEvent) => {
    e.preventDefault();
    void actuar(async () => {
      await postJson("/campos", { nombre }, getAccessToken());
      setNombre("");
    });
  };
  return (
    <section>
      <div className="section-header">
        <h1>Campo y colaboradores</h1>
      </div>
      <p>
        Los colaboradores pueden consultar y gestionar el rodeo del campo. Sólo
        el propietario administra los accesos.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="evaluaciones-filtros">
        <label>
          Campo activo
          <select
            value={sessionStorage.getItem("vacca.campoActivo") ?? ""}
            onChange={(e) => {
              if (e.target.value)
                sessionStorage.setItem("vacca.campoActivo", e.target.value);
              else sessionStorage.removeItem("vacca.campoActivo");
              window.location.assign("/rodeo");
            }}
          >
            <option value="">Mi rodeo y campos compartidos</option>
            {campos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      {campos.map((c) => (
        <article className="actividad-tanda" key={c.id}>
          <h2>{c.nombre}</h2>
          <p>{c.es_propietario ? "Propietario" : "Colaborador"}</p>
          {c.es_propietario && (
            <button
              type="button"
              onClick={() => {
                setMiembros([]);
                setAdministrar(c.id);
              }}
            >
              Administrar colaboradores
            </button>
          )}
        </article>
      ))}
      {!campos.some((c) => c.es_propietario) && (
        <form className="evaluaciones-filtros" onSubmit={crear}>
          <label>
            Nombre de tu campo
            <input
              required
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            Crear campo
          </button>
        </form>
      )}
      {administrar && (
        <section>
          <h2>Colaboradores</h2>
          <form
            className="evaluaciones-filtros"
            onSubmit={(e) => {
              e.preventDefault();
              void actuar(async () => {
                await postJson(
                  `/campos/${administrar}/miembros`,
                  { email },
                  getAccessToken(),
                );
                setEmail("");
              });
            }}
          >
            <label>
              Email de una cuenta existente
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button type="submit" disabled={busy}>
              Agregar colaborador
            </button>
          </form>
          {miembros.map((m) => (
            <p key={m.id}>
              {m.nombre} · {m.email}{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`¿Quitar el acceso de ${m.email}?`))
                    void actuar(() =>
                      deleteRequest(
                        `/campos/${administrar}/miembros/${m.id}`,
                        getAccessToken(),
                      ),
                    );
                }}
              >
                Quitar acceso
              </button>
            </p>
          ))}
        </section>
      )}
    </section>
  );
}
