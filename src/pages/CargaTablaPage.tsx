import {
  normalizarCaravana,
  esCaravanaValida,
  MENSAJE_FORMATO_CARAVANA,
} from "@/features/animales/utils/caravana";
import "@/components/ui/gestion.css";
import { Button, Input, NativeSelect, Table } from "@chakra-ui/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson } from "@/services/httpClient";
import { getAccessToken } from "@/features/auth";
import { getLotes } from "@/features/lotes/services/lotesService";
import type { LoteOption } from "@/features/lotes/types";
import { usePageState } from "@/hooks/usePageState";
import { CATEGORIAS_ANIMAL } from "@/features/animales/constants";
import { toast } from "react-toastify";
import "@/features/animales/components/animales.css";

type Fila = { caravana: string; lote_id: string; categoria: string };
const vacia = (): Fila => ({ caravana: "", lote_id: "", categoria: "" });
export function CargaTablaPage() {
  const [filas, setFilas] = usePageState<Fila[]>("cargaTabla.borrador", [
    vacia(),
  ]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    getLotes()
      .then(setLotes)
      .catch(() =>
        setError(
          "No se pudieron cargar los lotes. Recargá la página para reintentar.",
        ),
      );
  }, []);
  const cambiar = (index: number, campo: keyof Fila, value: string) =>
    setFilas((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              [campo]: campo === "caravana" ? normalizarCaravana(value) : value,
            }
          : f,
      ),
    );
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setError("");
    if (filas.some((fila) => !esCaravanaValida(fila.caravana))) {
      setError(MENSAJE_FORMATO_CARAVANA);
      return;
    }
    setGuardando(true);
    try {
      const result = await postJson<{ creados: number }, object>(
        "/animales/carga-tabla",
        {
          filas: filas.map((f) => ({
            caravana: f.caravana,
            lote_id: Number(f.lote_id),
            ...(f.categoria ? { categoria: f.categoria } : {}),
          })),
        },
        getAccessToken(),
      );
      setFilas([vacia()]);
      toast.success(
        `${result.creados} animales cargados. La tanda quedó en el historial.`,
      );
      navigate("/actividad");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la tanda",
      );
    } finally {
      setGuardando(false);
    }
  };
  return (
    <section className="gestion-page">
      <div className="section-header">
        <h1>Carga de animales en tabla</h1>
        <Link to="/rodeo/importar">Importar CSV o Excel</Link>
      </div>
      <p>
        Completá caravana y lote. La categoría se toma del lote si no elegís
        otra. Hasta 50 animales por tanda; para cargas mayores usá una planilla.
      </p>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={(e) => void guardar(e)}>
        <div className="animales-table__wrapper">
          <Table.Root className="animales-table carga-manual">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Caravana</Table.ColumnHeader>
                <Table.ColumnHeader>Lote</Table.ColumnHeader>
                <Table.ColumnHeader>Categoría (opcional)</Table.ColumnHeader>
                <Table.ColumnHeader>Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filas.map((f, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    <Input
                      aria-label={`Caravana fila ${i + 1}`}
                      required
                      aria-invalid={Boolean(
                        f.caravana && !esCaravanaValida(f.caravana),
                      )}
                      value={f.caravana}
                      maxLength={15}
                      onChange={(e) => cambiar(i, "caravana", e.target.value)}
                    />
                    {f.caravana && !esCaravanaValida(f.caravana) && (
                      <p className="status-message error" role="alert">
                        {MENSAJE_FORMATO_CARAVANA}
                      </p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        aria-label={`Lote fila ${i + 1}`}
                        aria-required="true"
                        value={f.lote_id}
                        onChange={(e) => cambiar(i, "lote_id", e.target.value)}
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
                  </Table.Cell>
                  <Table.Cell>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        aria-label={`Categoría fila ${i + 1}`}
                        value={f.categoria}
                        onChange={(e) =>
                          cambiar(i, "categoria", e.target.value)
                        }
                      >
                        <option value="">La del lote</option>
                        {CATEGORIAS_ANIMAL.map((c) => (
                          <option value={c.value} key={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      colorPalette="brand"
                      variant="outline"
                      type="button"
                      disabled={filas.length === 1 || guardando}
                      onClick={() =>
                        setFilas((prev) =>
                          prev.filter((_, index) => index !== i),
                        )
                      }
                    >
                      Quitar fila {i + 1}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>
        <div className="gestion-filter">
          <Button
            colorPalette="brand"
            variant="outline"
            type="button"
            disabled={filas.length >= 50 || guardando}
            onClick={() => setFilas((prev) => [...prev, vacia()])}
          >
            + Agregar fila
          </Button>
          <Button
            colorPalette="brand"
            variant="solid"
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? "Guardando…"
              : `Guardar tanda de ${filas.length} animales`}
          </Button>
        </div>
      </form>
    </section>
  );
}
