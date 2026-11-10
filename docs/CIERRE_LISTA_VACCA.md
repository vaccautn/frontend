# Revisión de la lista de VACCA

Trabajo local en las ramas `recta-final` (frontend) y
`recta-final` (backend e IA). No se hicieron push ni publicaciones. Las capturas de la landing están autorizadas y usan datos de demostración. Las pruebas usan una base de demostración separada.

## Criterios de importación

| Historia | Resultado y evidencia |
|---|---|
| HU-01 | Normalización en alta, edición e importación; validación en ambos extremos, respuesta 422 y unicidad por productor incluso para animales dados de baja. Acepta dos letras ASCII, tres números y cuatro caracteres alfanuméricos ASCII, o quince dígitos. Migración `20261107_identificacion` comprueba todo antes de escribir, informa inválidos/duplicados y recalcula sexo. Generador `backend/scripts/carga_masiva_local.py`. Pruebas en `test_animales.py`, `test_importacion_normalizacion.py` y `test_cierre_criterios.py`. |
| IMP-02 | Nombres de lote únicos por productor sin distinguir mayúsculas, 409 en creación/edición, mensaje en UI y migración que detecta duplicados. `test_lotes.py` y migración `b7c8d9e0f1a2`. |
| IMP-03 | Alta y edición sin selector de sexo. El backend ignora cualquier sexo enviado y lo deduce de las nueve categorías; al editar categoría lo recalcula. Migración y pruebas de todas las categorías en `test_importacion_normalizacion.py`, además de integración de alta/edición. |
| IMP-04 | Pasos seleccionables, transiciones con movimiento reducido, explicación de seis columnas, obligatoriedad de valores, orden libre, catálogos, lotes y plantilla XLSX con caravana como texto. `PasosImportacion`, `FormatoArchivo`, utilidades y pruebas de importación. |
| IMP-05 | CSV/XLSX hasta 5 MB en ambos extremos; UTF-8/BOM/Windows-1252, coma/punto y coma; búsqueda de hoja con seis encabezados, alias normalizados, filas vacías ignoradas, columnas sexo/Error sin efecto en los datos. Análisis sin escrituras. `test_importacion_lector.py`, `test_importacion_api.py` y documentación del router. Se conservan valores originales, incluidos espacios, para el archivo de errores. |
| IMP-06 | Normalización de catálogos, inferencia hasta distancia 2, consulta a distancia 3 o empate, categoría vacía/desconocida como error, raza desconocida/ausente consultada, cuatro estados. `test_importacion_normalizacion.py`, `test_importacion_api.py`. La tabla distingue «Lista con inferencias». |
| IMP-07 | Orden de fecha detectado por archivo; fechas reales de Excel; rechazo de espacios, formatos incompletos, días imposibles, futuro y más de treinta años exactos. Todos los errores indican DD/MM/AAAA. Confirmaciones para datos ausentes y origen Servicio sin fecha o anterior a un año. Pruebas unitarias e integración. |
| IMP-08 | Duplicados normalizados, elección de fila, actualización/reactivación confirmada y comparación de valores; lotes desconocidos/inactivos con decisiones agrupadas, categoría elegida o predominante. Pruebas de cada decisión y aislamiento entre productores. **Excepción de especificación:** se mantiene la unicidad por productor de HU-01; una caravana de otro productor no bloquea la compra. |
| IMP-09 | Resumen de cuatro estados, originales e inferencias visibles, consultas agrupadas con excepciones por fila, confirmación de pendientes excluidos y diálogos del sistema. Revisión paginada de a 50 sin límite de 500; prueba que llega a la fila 501 y reinicia página al filtrar. Tests de componente y recorrido real de importación. |
| IMP-10 | Revalidación en servidor, decisiones aplicadas, savepoint por fila y carga parcial, permisos y participación en servicios. Bloqueo del envío repetido y botones durante carga; mensaje de progreso. Vuelve al rodeo si no hay errores; ofrece Excel si los hay. Integración backend y E2E desktop/celular. |
| IMP-11 | Excel únicamente con errores/pendientes, valores originales, celdas resaltadas y motivo; reimportable al ignorar Error. Sin persistir filas rechazadas. Pruebas del archivo y flujo E2E que descarga, corrige y vuelve a cargar. |

No se invoca un formato legal nuevo: la expresión regular implementa el contrato
de producto que se pidió. La documentación previa de SENASA no sustituye una
validación normativa de los cuatro caracteres alfanuméricos.

## Backlog y correcciones

| Pedido | Implementación para revisar |
|---|---|
| Uso en celular | Navegación y carga probadas en viewport 390×844; importación E2E también en perfil móvil. Tablas dentro de contenedores desplazables. No se verificó un dispositivo físico ni Safari. |
| Pantallas de errores | 404 y error de ruta con recuperación, avisos de API y reintentos. Los errores 422 muestran los mensajes de validación del servidor. |
| Filtro de evaluaciones por fecha/calificación | Filtros en URL, consulta paginada al servidor, limpiar filtros reinicia página. |
| Paginación de evaluaciones y animales | Listas de 50 en servidor; tablas de evaluación/carga y revisión acotadas; sesiones de a 24 tarjetas. |
| Filtro por lote | Selección por lote y panel lateral del rodeo, estado conservado y tabla paginada. |
| Detalles de evaluación y sesión | Ficha de sesión, edición/ampliación de evaluación y fotos; rutas de detalle y acceso desde listado. |
| Borrar sesiones y evaluaciones | Acciones con confirmación y endpoints de eliminación existentes, integrados en estas ramas. |
| Estado durante la sesión | Filtros, selección y borradores en sessionStorage por usuario/campo; selección de sesión en URL y restauración de scroll. |
| Alta mínima y tabla | Caravana y lote; categoría heredada del lote en alta manual/tabla. Hasta 50 filas por tanda; para cantidades mayores CSV/XLSX. |
| Tandas e historial | Entidad persistida con actor, propietario, fecha y detalle; `/actividad` muestra altas, planillas, movimientos y nacimientos. No inventa registros anteriores a su incorporación. |
| Varios usuarios por campo | Propietario y colaboradores con cuentas existentes; selector de campo, alta/revocación de miembros y aislamiento de datos. Pruebas de acceso y revocación. |
| Selección y movimiento | Mover al lote elegido, advertencia si hay varios orígenes y diálogo con el mismo tema; validación atómica y registro de movimiento. |
| Nombre | VACCA en la presentación y análisis visual, por la corrección posterior del usuario. |
| Reproducción y nacimientos | Historial de servicios/crías en ficha y alta vinculada a madre, resultado, servicio y lote elegido en una transacción. |
| Portada del animal | Foto de la última evaluación confirmada, independiente del filtro del historial; se actualiza tras guardar una evaluación. |
| Servicios y sus detalles | Vista con línea temporal, lista, resumen expandible y detalle, reutilizando componentes y tema existentes. |
| Inicio y mapa | Tablero con indicadores de manejo basados en última CC y semáforo mensual; acceso al mapa grande y controles de lotes junto al rodeo. |
| Destete | Recordatorios a 30 días/precoz y 14 días/temporario al aceptar una recomendación. Reevaluación desde Inicio; para resolver exige evaluación posterior confirmada. |
| Sólo categorías de vaca para CC | Selector de evaluación filtra VACA_SECA y VACA_LACTANDO mediante `CATEGORIAS_VACA`. |
| Leyendas sin categorías en cero | Gráficos de animal/sesión filtran categorías sin animales; no se agregaron leyendas vacías. |
| Redondeo, hover y paleta | Recorte del contenedor de aplicación, hover en tarjetas y neutros ocre/marrón conservados de la base integrada. Nuevos controles usan Chakra y tokens del proyecto, y diálogos con el estilo de sesiones. |
| Textos y botones | «Abrir mapa», panel sin «Todo el rodeo», accesos de lotes y acciones con + junto a los títulos según los componentes existentes. |
| Rendimiento con 3.000+ animales | Consulta paginada con última CC incluida; última CC y promedios calculados en SQL, consulta de una sola sesión en Inicio, páginas por demanda y DOM limitado. Script `performance-preview.mjs` con demo de 3.000 vacas/125 toros. SQLite local no representa un benchmark de producción. |
| Landing general | `/landing` pública, acceso desde login, funciones, recorrido, presentación del proyecto y CC automática señalada como experimental. Con capturas reales de la demo. |

## Decisiones que no se pueden cumplir simultáneamente

- **HU-01 frente a IMP-08:** HU-01 permite la misma caravana entre productores;
  una línea de IMP-08 lo prohíbe. Se mantiene HU-01 y el flujo de compra ya
  implementado por el equipo, sin divulgar información de otros productores.
- **Alta mínima frente a seis columnas:** caravana/lote bastan en manual y tabla.
  La importación requiere seis encabezados y categoría con valor según IMP-05/06;
  origen, fecha y raza pueden quedar sin dato tras confirmación.
- **VACCA frente a VaccaWho:** se aplica la corrección posterior del nombre.
- **IMP-12:** figura como dependencia pero no fue incluido en la lista recibida;
  los endpoints y tipos necesarios ya están integrados.

## Preguntas para Diego

Son preguntas de definición, no funcionalidades que puedan darse por aprobadas
sin una respuesta. Se mantienen las reglas existentes: categoría en vez de edad
obligatoria, nacimiento opcional, sexo deducido, estado activo en importación,
reactivación explícita de lote/animal y categoría predominante del lote nuevo
cuando no se elige otra. La carga masiva y el uso móvil están implementados.

Quedan para validación de dominio: edad/dentición y precisión mes/año; datos
entregados en compras; cantidad típica de razas/lotes; roles específicos de
peones; integración física Tru-Test/otros escáneres; significado cartográfico
de reservicios y polígonos; utilidad de inundaciones/pasturas y escala de color
preferida para el mapa. No se inventaron requisitos ni integración con hardware.

## Límites de la validación

No se aplicaron migraciones ni cambios a una base real. La migración nueva se
prueba en una base aislada y se debe ejecutar al desplegar. Las pruebas de IA
validan contratos/tracking con fixtures; no prueban exactitud de inferencia con
pesos privados. El lint general mantiene infracciones anteriores de efectos de
React/Fast Refresh; no se desactivaron reglas para ocultarlas. La publicación sigue fuera de esta entrega. Las capturas se incorporaron por pedido posterior del usuario.


## Validación del cierre

- Backend: **730 aprobadas y 1 omitida**; tras endurecer `fullmatch`, otras
  **107 pruebas de identificación, alta/edición e importación aprobadas**.
- Frontend: **56 aprobadas** en 11 archivos (`vitest run --maxWorkers=1
  --testTimeout=15000`); build y tipos aprobados. El límite mayor evita falsos
  timeouts de las interacciones de archivos grandes al competir por recursos.
- Recuperación de video: **14 aprobadas** con `node --test`.
- IA: **308 aprobadas y 2 omitidas** por dependencias opcionales.
- Navegador: **28 vistas** en escritorio y celular, sin errores JS/API ni
  desbordes; verificación de componentes Chakra y tokens de tarjetas.
- Importación E2E: **6 aprobadas**, tres recorridos por dispositivo: carga
  completa; decisiones/carga parcial/Excel/reintento; columnas faltantes.
  Ejecutar `playwright test --config playwright.local.config.ts` con la demo
  en 8026 y el build del frontend apuntando a esa API en 5180. Esa configuración
  no reinicia bases ni produce capturas, videos o trazas.
- Flujo real de tabla, historial, confirmación de varios lotes y movimiento:
  aprobado con `scripts/carga-movimiento.browser.test.mjs`.
- Alembic: una sola cabecera, `20261107_identificacion`.

- Medición final local sin otras suites en paralelo, tres consultas por endpoint:
  mediana de tabla (50 animales) **26 ms / 14,6 KB**, mapa **283 ms**,
  dashboard **278 ms** y última sesión **21 ms**. Son tiempos de la demo SQLite,
  no una promesa de producción ni una comparación controlada con la versión previa.

Actualización de presentación: se incorporaron capturas reales de la demo a `/landing`, por pedido posterior del usuario. Ver [LANDING_PRESENTACION.md](LANDING_PRESENTACION.md). Las capturas están autorizadas; no se hizo push ni publicación.
