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
  return (
    <nav className="paginador" aria-label="Paginación">
      <button
        type="button"
        disabled={pagina <= 0}
        onClick={() => onChange(pagina - 1)}
      >
        Anterior
      </button>
      <span role="status">
        Página {pagina + 1} de {paginas} · {total} resultados
      </span>
      <button
        type="button"
        disabled={pagina + 1 >= paginas}
        onClick={() => onChange(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
