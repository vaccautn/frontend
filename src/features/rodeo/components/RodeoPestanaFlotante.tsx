type Props = {
  texto: string;
  onClick: () => void;
};

export function RodeoPestanaFlotante({ texto, onClick }: Props) {
  return (
    <button type="button" className="rodeo-pestana-flotante" onClick={onClick}>
      <span>‹</span>
      {texto}
    </button>
  );
}
