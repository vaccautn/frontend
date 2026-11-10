import { Button } from "@chakra-ui/react";
export function Paginador({
  pagina,
  total,
  tamano = 50,
  onChange,
}: {
  pagina: number;
  total: number;
  tamano?: number;
  onChange: (pagina: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / tamano));
  // Con una sola página los botones no hacen nada: no se muestra.
  if (paginas === 1 && pagina === 0) return null;
  return (
    <nav className="paginador" aria-label="Paginación">
      <Button
        colorPalette="brand"
        variant="outline"
        borderRadius="full"
        type="button"
        disabled={pagina <= 0}
        onClick={() => onChange(pagina - 1)}
      >
        Anterior
      </Button>
      <span role="status">
        Página {pagina + 1} de {paginas} · {total} resultados
      </span>
      <Button
        colorPalette="brand"
        variant="outline"
        borderRadius="full"
        type="button"
        disabled={pagina + 1 >= paginas}
        onClick={() => onChange(pagina + 1)}
      >
        Siguiente
      </Button>
    </nav>
  );
}
