type Props = {
  loteNombre?: string;
  onClear: () => void;
};

export function RodeoBreadcrumb({ loteNombre, onClear }: Props) {
  return (
    <div className="rodeo-breadcrumb">
      <span className="rodeo-breadcrumb__todo" onClick={onClear}>
        Todo el rodeo
      </span>
      {loteNombre && (
        <>
          <span className="rodeo-breadcrumb__separador">›</span>
          <span>{loteNombre}</span>
        </>
      )}
    </div>
  );
}
