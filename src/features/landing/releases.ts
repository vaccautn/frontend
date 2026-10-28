export type Release = {
  id: string;
  etiqueta: string;
  titulo: string;
  fecha: string;
  resumen: string;
  funciones: string[];
};

// Inventario armado desde el historial de los repos. Solo v1.0.0 y v1.0.1
// tienen release publicada; el resto se agrupa por fecha y tema.
export const releases: Release[] = [
  {
    id: "r1",
    etiqueta: "v1.0.0",
    titulo: "Gestión de usuarios y del rodeo",
    fecha: "Julio 2026",
    resumen: "La base: cada productor entra con su cuenta y administra sus animales.",
    funciones: [
      "Registro, inicio y cierre de sesión del productor",
      "Alta de animales desde un formulario lateral",
      "Listado y detalle de cada animal del rodeo",
      "Edición de datos del animal",
      "Baja lógica, sin perder el historial",
    ],
  },
  {
    id: "r2",
    etiqueta: "v1.0.1",
    titulo: "Filtrado y búsqueda en el rodeo",
    fecha: "Julio 2026",
    resumen: "Encontrar un animal en segundos y empezar a registrar su condición.",
    funciones: [
      "Búsqueda por caravana mientras escribís",
      "Filtros por sexo, raza y estado",
      "Registro manual de condición corporal en escala 1 a 5",
    ],
  },
  {
    id: "r3",
    etiqueta: "Etapa 3",
    titulo: "Evaluaciones, sesiones y tableros",
    fecha: "Julio 2026",
    resumen: "De la manga al tablero: se evalúa en sesiones y se ve el estado del rodeo.",
    funciones: [
      "Fotos adjuntas a cada evaluación, guardadas en la nube",
      "Cada productor ve solo su rodeo, sus lotes y sus capturas",
      "Lotes y animales agrupados por lote",
      "Sesiones de evaluación con carga de varios animales seguidos",
      "Tableros del rodeo, de cada animal y de cada sesión",
      "Edición de evaluaciones de sesiones ya finalizadas",
    ],
  },
  {
    id: "r4",
    etiqueta: "Etapa 4",
    titulo: "IA de detección bovina",
    fecha: "Agosto 2026",
    resumen: "Un modelo propio revisa cada foto antes de guardarla.",
    funciones: [
      "Modelo YOLO entrenado para detectar vacas en la imagen",
      "Validación automática: si no hay vaca, la foto se rechaza con el motivo",
      "Soporte para JPG, JPEG y PNG",
      "Historial de evaluaciones con fotos por fila",
    ],
  },
  {
    id: "r5",
    etiqueta: "Etapa 5",
    titulo: "Servicios y condición corporal automática",
    fecha: "Septiembre 2026",
    resumen: "La temporada de monta completa, y la IA estimando la condición corporal.",
    funciones: [
      "Categorías de animal y de lote por sexo y etapa productiva",
      "Servicios con lotes asociados y estados que avanzan solos según las fechas",
      "Carga de resultados: preñada, vacía o parida",
      "Calendario, historial y línea de tiempo de nacimientos",
      "Reservicio de vacas vacías",
      "Condición corporal estimada por IA a partir de una foto",
      "Recomendaciones de manejo para revisar y decidir",
    ],
  },
  {
    id: "r6",
    etiqueta: "Etapa 6",
    titulo: "Mapa del campo",
    fecha: "Octubre 2026",
    resumen: "El rodeo sobre el mapa: cada lote en su potrero.",
    funciones: [
      "Vista satelital con selector de capas",
      "Buscador de localidades y botón “mi campo”",
      "Importación de potreros desde archivos KMZ",
      "Panel del lote con sus animales y su condición corporal",
      "Pantalla Rodeo que une mapa y listado",
    ],
  },
];

export const metricasIA = [
  { valor: "97,4%", etiqueta: "mAP50" },
  { valor: "97,6%", etiqueta: "Precisión" },
  { valor: "92,4%", etiqueta: "Recall" },
];
