import { ConfirmacionDialog } from "@/components/ui/ConfirmacionDialog";
import "@/components/ui/gestion.css";
import { Button, Input, NativeSelect } from "@chakra-ui/react";
import { useEffect, useState, type FormEvent } from "react";
import { getJson, postJson, deleteRequest } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";

type Campo = { id: number; nombre: string; es_propietario: boolean };
type Miembro = { id: number; email: string; nombre: string };
export function CamposPage() {
  const [aQuitar, setAQuitar] = useState<Miembro | null>(null);
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
    <section className="gestion-page">
      <div className="section-header">
        <h1>Campo y colaboradores</h1>
      </div>
      <p>
        Los colaboradores pueden consultar y gestionar el rodeo del campo. Sólo
        el propietario administra los accesos.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="gestion-filter">
        <label>
          Campo activo
          <NativeSelect.Root>
            <NativeSelect.Field
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
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </label>
      </div>
      {campos.map((c) => (
        <article className="gestion-card" key={c.id}>
          <h2>{c.nombre}</h2>
          <p>{c.es_propietario ? "Propietario" : "Colaborador"}</p>
          {c.es_propietario && (
            <Button
              colorPalette="brand"
              variant="outline"
              type="button"
              onClick={() => {
                setMiembros([]);
                setAdministrar(c.id);
              }}
            >
              Administrar colaboradores
            </Button>
          )}
        </article>
      ))}
      {!campos.some((c) => c.es_propietario) && (
        <form className="gestion-filter" onSubmit={crear}>
          <label>
            Nombre de tu campo
            <Input
              required
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <Button
            colorPalette="brand"
            variant="outline"
            disabled={busy}
            type="submit"
          >
            Crear campo
          </Button>
        </form>
      )}
      {administrar && (
        <section>
          <h2>Colaboradores</h2>
          <form
            className="gestion-filter"
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
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <Button
              colorPalette="brand"
              variant="solid"
              type="submit"
              disabled={busy}
            >
              Agregar colaborador
            </Button>
          </form>
          {miembros.map((m) => (
            <div className="gestion-member" key={m.id}>
              {m.nombre} · {m.email}{" "}
              <Button
                colorPalette="brand"
                variant="outline"
                type="button"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setAQuitar(m);
                }}
              >
                Quitar acceso
              </Button>
            </div>
          ))}
        </section>
      )}
      <ConfirmacionDialog
        open={aQuitar !== null}
        titulo="Quitar acceso al campo"
        confirmar="Quitar acceso"
        peligro
        pendiente={busy}
        onClose={() => setAQuitar(null)}
        onConfirm={() => {
          if (aQuitar)
            void actuar(async () => {
              await deleteRequest(
                `/campos/${administrar}/miembros/${aQuitar.id}`,
                getAccessToken(),
              );
              setAQuitar(null);
            });
        }}
      >
        <p>
          {aQuitar?.nombre || aQuitar?.email} dejará de tener acceso a este
          campo.
        </p>
        {error && (
          <p role="alert" className="status-message error">
            {error}
          </p>
        )}
      </ConfirmacionDialog>
    </section>
  );
}
