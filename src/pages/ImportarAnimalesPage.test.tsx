import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderConApp } from "@/test/render";
import type { AnalisisImportacion, ResultadoImportacion } from "@/features/animales/types/importacion";
import { ImportarAnimalesPage } from "./ImportarAnimalesPage";

const servicio = vi.hoisted(() => ({
  analizarPlanilla: vi.fn(),
  confirmarImportacion: vi.fn(),
  descargarArchivoErrores: vi.fn(),
}));

vi.mock("@/features/animales/services/importacionService", () => servicio);
vi.mock("@/features/lotes/services/lotesService", () => ({
  getLotes: vi.fn().mockResolvedValue([
    { id: 1, nombre: "Lote Norte", categoria: "VACA_SECA", activo: true },
    { id: 2, nombre: "Viejo", categoria: "TORO", activo: false },
  ]),
}));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const valores = {
  categoria: "VACA_SECA",
  lote: "Lote Norte",
  origen: "COMPRA",
  fecha_nacimiento: "2020-08-15",
  raza: "Angus",
};

const ANALISIS: AnalisisImportacion = {
  hoja: null,
  hojas_revisadas: [],
  encabezados: ["caravana", "categoria", "lote", "origen", "fecha_nacimiento", "raza"],
  columnas: { caravana: 0, categoria: 1, lote: 2, origen: 3, fecha_nacimiento: 4, raza: 5 },
  columnas_faltantes: [],
  formato_fecha: "DD/MM/AAAA",
  filas: [
    {
      numero: 2,
      celdas: ["AB1230001", "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "angus"],
      valores: { caravana: "AB1230001", ...valores },
      sexo: "HEMBRA",
      estado: "LISTA",
      inferencias: [],
      errores: [],
      consultas: [],
    },
    {
      numero: 3,
      celdas: ["AB1230002", "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "rangus"],
      valores: { caravana: "AB1230002", ...valores, raza: "rangus" },
      sexo: "HEMBRA",
      estado: "CONSULTA",
      inferencias: [],
      errores: [],
      consultas: ["raza:rangus"],
    },
    {
      numero: 4,
      celdas: ["V-1", "Vaca seca", "Lote Norte", "Compra", "15/08/2020", "Angus"],
      valores: { caravana: "V-1", ...valores },
      sexo: "HEMBRA",
      estado: "ERROR",
      inferencias: [],
      errores: [{ campo: "caravana", mensaje: "La caravana debe tener el formato de SENASA." }],
      consultas: [],
    },
  ],
  consultas: [
    {
      clave: "raza:rangus",
      tipo: "VALOR_DUDOSO",
      campo: "raza",
      valor: "rangus",
      mensaje: "No estamos seguros de qué raza es «rangus». ¿Es Angus o Brangus?",
      opciones: [
        { valor: "Angus", etiqueta: "Angus" },
        { valor: "Brangus", etiqueta: "Brangus" },
        { valor: "__NO_IMPORTAR__", etiqueta: "No importar: lo corrijo en el archivo" },
      ],
      filas: [3],
      lote_id: null,
      animal_existente: null,
    },
  ],
  resumen: { total: 3, listas: 1, con_inferencias: 0, con_consultas: 1, con_errores: 1 },
};

const RESULTADO: ResultadoImportacion = {
  creados: 2,
  actualizados: 0,
  reactivados: 0,
  con_errores: 0,
  lotes_creados: [],
  lotes_reactivados: [],
  filas: [
    { numero: 2, estado: "CREADO", animal_id: 10, errores: [] },
    { numero: 3, estado: "CREADO", animal_id: 11, errores: [] },
  ],
};

async function subirPlanilla() {
  const archivo = new File(["caravana;categoria"], "rodeo.csv", { type: "text/csv" });
  await userEvent.upload(screen.getByLabelText("Elegir planilla"), archivo);
}

describe("ImportarAnimalesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el formato: columnas, razas y lotes del productor", async () => {
    renderConApp(<ImportarAnimalesPage />);
    expect(screen.getByText("Formato del archivo")).toBeInTheDocument();
    expect(screen.queryByText("Sexo")).not.toBeInTheDocument();
    expect(screen.getByText("Origen")).toBeInTheDocument();
    expect(screen.getAllByText("Obligatoria")).toHaveLength(3);
    expect(await screen.findByText("Viejo")).toBeInTheDocument();
    expect(screen.getByText("Ver razas aceptadas")).toBeInTheDocument();
  });

  it("analiza, deja decidir, importa y descarga el Excel con errores", async () => {
    servicio.analizarPlanilla.mockResolvedValue(ANALISIS);
    servicio.confirmarImportacion.mockResolvedValue(RESULTADO);
    renderConApp(<ImportarAnimalesPage />);

    await subirPlanilla();

    expect(await screen.findByText("Necesitamos tu confirmación")).toBeInTheDocument();
    expect(servicio.analizarPlanilla).toHaveBeenCalledOnce();
    // Con la consulta sin decidir, solo se importa la fila lista.
    expect(screen.getByRole("button", { name: "Importar 1 animal" })).toBeEnabled();

    await userEvent.click(screen.getByRole("radio", { name: "Brangus" }));
    await userEvent.click(screen.getByRole("button", { name: "Importar 2 animales" }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText(/2 animales nuevos/)).toBeInTheDocument();
    expect(within(dialogo).getByText(/1 fila no se importa/)).toBeInTheDocument();
    await userEvent.click(within(dialogo).getByRole("button", { name: "Importar 2 animales" }));

    await waitFor(() => expect(servicio.confirmarImportacion).toHaveBeenCalledOnce());
    const [payload] = servicio.confirmarImportacion.mock.calls[0];
    expect(payload.filas.map((f: { numero: number; raza: string }) => [f.numero, f.raza])).toEqual([
      [2, "Angus"],
      [3, "Brangus"],
    ]);

    expect(await screen.findByText(/Importamos 2 animales, pero 1 fila no se pudo cargar/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Descargar Excel con errores/ }));
    expect(servicio.descargarArchivoErrores).toHaveBeenCalledWith(
      expect.objectContaining({
        filas: [
          {
            numero: 4,
            celdas: ANALISIS.filas[2].celdas,
            errores: ANALISIS.filas[2].errores,
          },
        ],
      }),
    );
  });

  it("si faltan columnas lo avisa y no muestra la revisión", async () => {
    servicio.analizarPlanilla.mockResolvedValue({
      ...ANALISIS,
      columnas_faltantes: ["origen"],
      filas: [],
      consultas: [],
    });
    renderConApp(<ImportarAnimalesPage />);

    await subirPlanilla();

    expect(await screen.findByText("Falta una columna")).toBeInTheDocument();
    expect(screen.getByText(/Agregá "origen"/)).toBeInTheDocument();
    expect(screen.queryByText("Vista previa")).not.toBeInTheDocument();
  });

  it("muestra el error del backend si no puede leer el archivo", async () => {
    const { ApiError } = await import("@/services/httpClient");
    servicio.analizarPlanilla.mockRejectedValue(new ApiError(400, "No pudimos leer el archivo."));
    renderConApp(<ImportarAnimalesPage />);

    await subirPlanilla();

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos leer el archivo.");
  });
});
