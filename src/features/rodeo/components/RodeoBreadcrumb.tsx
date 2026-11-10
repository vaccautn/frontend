type Props = { loteNombre?: string; onClear: () => void };
export function RodeoBreadcrumb({ loteNombre, onClear }: Props) {
  return (
    <div className="rodeo-breadcrumb">
      {loteNombre ? (
        <>
          <button
            type="button"
            className="rodeo-breadcrumb__todo"
            onClick={onClear}
          >
            Rodeo
          </button>
          <span className="rodeo-breadcrumb__separador" aria-hidden="true">
            ?
          </span>
          <span>{loteNombre}</span>
        </>
      ) : (
        <span>Rodeo</span>
      )}
    </div>
  );
}
