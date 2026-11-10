# Sesiones: ingresos y análisis de video

Detalle del comportamiento de la carga de animales y del análisis de video dentro de una sesión de evaluación. Para la visión general del sistema ver [arquitectura.md](../ARQUITECTURA.md).

## Ingresos de animales en una sesión

La página de carga usa los endpoints autenticados:

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/api/sesiones-captura/{sesion_id}/entradas` | Registrar un animal y recibir su orden asignado por el servidor |
| `GET` | `/api/sesiones-captura/{sesion_id}/entradas` | Recuperar los ingresos y sus órdenes guardados |

Ejemplo de alta pendiente:

```json
{
  "animal_id": 42,
  "valor_cc": null,
  "observaciones": "Pendiente de evaluación"
}
```

El `POST` devuelve `201` para un ingreso nuevo y `200` al reintentar un animal ya
registrado; el reintento no cambia la CC ni el orden existentes. El ordinal es
asignado en backend, no por la lista filtrada de la interfaz. `valor_cc` puede ser
`null` en estado `BORRADOR` se muestra como **Pendiente de CC**; una evaluación
`ANULADA` también puede conservar `null`. Solo `CONFIRMADA` requiere una CC entera
entre 1 y 5. Registrar esa CC confirma el borrador sin cambiar su orden. La CC
manual existente nunca se reemplaza al adjuntar imágenes.

Las evaluaciones anteriores al orden persistido conservan `orden_entrada: null` y
no se reordenan a partir de fechas o IDs. El GET indica `orden_disponible: false`
si incluye filas históricas sin ordinal. Una sesión histórica vacía puede aceptar
nuevos ingresos. El downgrade de la migración se rechaza si existen CC pendientes
u órdenes nuevas; se deben resolver explícitamente antes de volver al esquema
anterior.

## Análisis de video en una sesión

La carga está disponible en la página de evaluación de una sesión abierta. Antes
de probarla, el backend debe tener aplicada la migración de análisis de video y
el servicio IA debe estar ejecutándose en loopback según la configuración del
backend. El navegador solo se comunica con la API autenticada; no sube archivos
directamente a IA ni a R2.

1. Registrá y ordená los ingresos de los animales en la sesión.
2. Elegí un archivo MP4 o MOV de hasta 50 MiB y enviá el video.
3. La interfaz muestra el estado actual con un mensaje breve y una barra de
   progreso indeterminada; al completar, confirma que los resultados están en
   la sesión. Si la conexión se interrumpe durante el envío, volvé a seleccionar
   el mismo archivo para reintentar con la misma clave idempotente.

El backend asocia pasajes según el snapshot ordenado de ingresos. Si la cantidad
detectada difiere de los ingresos, la interfaz muestra un aviso breve; los
resultados y las CC manuales siguen disponibles en la sesión. Un error terminal
se muestra como error, no como éxito: se puede reintentar el mismo análisis
guardado o resolverlo explícitamente. Resolver es irreversible, libera el
bloqueo de la sesión y conserva los resultados y artefactos retenidos.
Si IA rechazó la admisión antes de crear un trabajo, el reintento vuelve a enviar
el mismo archivo con la clave original; los errores de importación con un trabajo
ya creado usan la acción de reintento del análisis guardado. Si se pierde
`sessionStorage` mientras el backend conserva un trabajo `ENVIANDO` sin `ia_job_id`,
el creador recupera la clave durable desde la vista completa del listado, selecciona
el archivo y lo reenvía; backend valida su SHA-256 y responde `409` si el contenido
no coincide. La clave no aparece en las proyecciones de acceso restringido.
La clave del navegador se conserva tras una respuesta incierta y solo se elimina
al recibir una respuesta de admisión confirmada, resolver explícitamente el error
retenido si la clave está vinculada a ese análisis, o descartar la clave de forma
explícita si no se pudo establecer esa relación;
los análisis históricos no alteran esa clave. Si ya se aplicó al menos un
resultado, el backend no permite otro video para esa sesión. Los errores resueltos
sin resultados aplicados no bloquean por sí solos un nuevo análisis.
Si se revoca acceso a un animal del snapshot, el propietario ve únicamente el estado
mínimo y puede resolver un error retenido o abandonar una admisión incierta `ENVIANDO`
sin `ia_job_id`; no puede reintentar ni consultar datos del snapshot, resultados o
imágenes. Resolver esa admisión no afirma que IA haya rechazado el video ni que sus
artefactos remotos se hayan borrado.
El video fuente no se archiva; las imágenes importadas se consultan mediante URL
firmada protegida por el backend.

### Prueba renderizada del flujo en Edge

Con Vite disponible en `http://127.0.0.1:5173`, una instalación existente de
`playwright-core` y Microsoft Edge, ejecutar desde PowerShell:

```powershell
$env:PLAYWRIGHT_MODULE_PATH = "C:\ruta\a\playwright-core\index.mjs"
$env:VACCA_FRONTEND_E2E_URL = "http://127.0.0.1:5173"
pnpm test:video:browser
```

La prueba crea un contexto de navegador nuevo, usa un usuario de fixture y archivos
sintéticos, e intercepta todas las solicitudes `/api/`; no contacta el backend, IA ni
R2. No agrega una dependencia de producción: `PLAYWRIGHT_MODULE_PATH` apunta a una
instalación de Playwright ya disponible en el entorno. También verifica la recuperación
de la clave tras limpiar `sessionStorage`, el error restringido y su resolución, la
limpieza de errores de polling sin borrar errores de acciones, la preservación del
diálogo manual durante un refresco y el bloqueo de una segunda carga después de aplicar
resultados.

