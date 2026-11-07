# VACCA: mejoras locales y revisión

Trabajo en `feat/mejoras-consulta-presentacion` (frontend) y
`feat/integracion-mejoras-vacca` (backend e IA). Sin push ni publicación.
Las capturas están aplazadas por pedido del usuario.

## Qué revisar

| Tarea | Implementación y alcance |
|---|---|
| Base integrada | Importación `feat/carga`, backend de mapa/reproducción y ramas de integración de video. Migración con una sola cabecera. |
| Rendimiento | Páginas de 50 animales con CC incluida; panel general paginado; tablas de carga acotadas; historial del animal paginado en servidor y tarjetas de sesión de a 24; última CC seleccionada en SQL; promedios mensuales agregados en SQL; Inicio consulta una sola sesión; páginas cargadas por demanda. |
| Importación | CSV/XLSX, revisión, confirmación parcial, corrección/descarga de errores, nuevas tandas con responsable. Sólo se exigen columnas caravana y lote; categoría ausente se deduce del animal existente o del lote. Si se crea un lote sin ninguna categoría conocida, hay que informarla. |
| Alta mínima | Caravana y lote; categoría heredada del lote, sexo deducido y fecha/raza opcionales. El alta individual rechaza lotes inactivos; el importador conserva la confirmación explícita para reactivarlos. |
| Tabla de alta | `/rodeo/carga-tabla`, hasta 50 filas, validación completa antes de guardar y una tanda por productor. Borrador conservado en la pestaña. |
| Campo compartido | `/campo`: un campo por propietario, colaboradores con cuentas existentes y revocación de acceso. Colaboradores pueden gestionar el rodeo; sólo el propietario administra miembros. Selector de campo activo y estado de interfaz aislado por cuenta/campo. |
| Historial | `/actividad`: alta individual, tabla, planillas, movimientos y nacimientos; responsable, fecha y resultados. No reconstruye retrospectivamente cargas anteriores al cambio. |
| Movimientos | Selección en la tabla principal, destino activo, advertencia/confirmación si hay varios lotes de origen, validación de permisos y registro de actividad. No permite transferencias entre productores. |
| Nacimientos | Desde la ficha de la madre con resultado preñada/parida: alta y asociación de cría, servicio y lote en una transacción; evita duplicar el nacimiento. |
| Destete | Aceptar una recomendación genera seguimiento a 30 días (precoz) o 14 (temporario). Inicio ofrece reevaluar; completar requiere una evaluación confirmada registrada después de la medida. El indicador vigente se recalcula desde la última CC y el semáforo mensual, sin alterar las recomendaciones decididas. |
| Celular | Recorrido en Chrome con 390×844 y escritorio 1440×1000. Tablas desplazables horizontalmente; controles y filtros adaptados. No sustituye una prueba en un teléfono real/Safari. |
| Consulta | Filtros por fecha/CC, paginación, estado de rodeo/servicios/sesiones y scroll conservados; 404 y recuperación general de errores. |
| Ficha | Portada de la última evaluación confirmada, ampliación, historial reproductivo y acceso a crías/servicios. |
| Video | Ramas de frontend, backend e IA integradas. Pruebas de contrato con detectores sintéticos; CC automática mantiene el estado experimental. |
| Visuales | Conserva los arreglos ya existentes de hover, botones con +, colores neutros, leyendas sin ceros y recorte del scroll. Elimina “Todo el rodeo” del panel lateral. Nombre visible: VACCA. |
| Landing | `/landing`, pública y accesible desde login; propuesta del proyecto, funciones, recorrido de tres pasos, evolución, tecnología y acceso. Sin capturas; CC automática identificada como experimental. |

## Validación reproducible

Última pasada: **713 pruebas de backend aprobadas (1 omitida)**,
**52 de frontend**, **14 de recuperación de video** y **308 de IA**
(45 de API y 263 de tracking/pasadas; 2 omitidas por dependencias opcionales).
Build y tipos del frontend aprobados. Navegación de 28 vistas y flujo de
alta en tabla/historial/movimientos comprobados en navegador, sin capturas.

- Backend: `python -m pytest -q`; suite de negocio, permisos y video. Nuevos casos en `tests/test_mejoras_gestion.py`.
- Frontend: `npm run build`, `npm test` y `npm run test:video` con un Node compatible (se usó 24.11 local).
- IA: `pytest tests/test_video_api_integration.py tests/test_video_tracking.py tests/test_video_passages_api.py`; contratos y tracking con fixtures, sin inferencia real.
- `scripts/gestion.browser.test.mjs`: 28 vistas, filtros, escritorio/celular, errores JS/API y desbordes. No genera capturas.
- `scripts/carga-movimiento.browser.test.mjs`: guarda una tanda en una base de demo, consulta el historial y confirma un movimiento entre distintos lotes.
- `scripts/performance-preview.mjs`: mide respuestas de la demo aislada de 3.000 vacas y 125 toros. Medianas iniciales locales: tabla 22 ms/14,6 KB, mapa 261 ms, dashboard 242 ms y última sesión 17 ms. No son tiempos de producción ni una comparación controlada con la versión anterior.
- Backend `scripts/preview_local.py`: base SQLite separada en `.local/preview`, sin usar datos ni credenciales productivas. Las cuentas de demostración son exclusivas de esa base.
- Migración PostgreSQL: se compiló el upgrade desde `c9d0e1f2a3b4` al nuevo head `20261106_actividad_campos`. No se aplicó a una base productiva. Las migraciones anteriores incluyen comprobaciones de datos que deben ejecutarse sobre la base destino.

## Límites que requieren revisión

- Pesos/datasets, exactitud de la CC automática y aprobación del modelo: no quedan validados por pruebas con fixtures. No se entrenó ni se declaró aprobado el modelo experimental.
- Pendiente de Diego: edad/dentición, criterio definitivo de identificación, estados iniciales, reglas de reservicio sobre polígonos y valoración de NDVI/inundaciones. Se conservan las reglas existentes, con categoría heredada del lote para el alta mínima.
- El lint de frontend heredó avisos/errores de los componentes existentes con las reglas nuevas de React sobre efectos y Fast Refresh. Build, tipos, tests y navegador se verifican por separado; no se desactivaron reglas para ocultarlos.
- No se hicieron capturas, push, despliegue ni cambios sobre bases de datos reales.
