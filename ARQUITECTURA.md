# Arquitectura de Vacca

Vacca es un sistema de soporte de decisiones para el manejo nutricional de rodeos de cría. El productor registra sus animales, los evalúa por **condición corporal (CC, escala 1 a 5)** con fotos o videos, y el sistema le muestra tableros, alertas y recomendaciones de manejo por lote.

Es el **proyecto final de la carrera Ingeniería en Sistemas de Información (UTN)**, desarrollado en equipo durante 2026.

Este documento describe el sistema completo. Cada repositorio tiene además su README con comandos y detalles propios.

## Repositorios

| Repositorio | Qué contiene | Stack |
| --- | --- | --- |
| [`frontend`](https://github.com/vaccautn/frontend) | Aplicación web del productor y landing del proyecto | React 19, TypeScript, Vite, Chakra UI, Recharts, OpenLayers |
| `backend` | API REST, reglas de negocio, base de datos y almacenamiento de imágenes | Python 3.12, FastAPI, SQLModel, Alembic, PostgreSQL |
| [`IA`](https://github.com/vaccautn/IA) | Servicio de visión: detección de vacas, CC estimada y análisis de video | Python 3.13, FastAPI, YOLO26n, PyTorch (ResNet18 + CORAL) |
| [`vacca-demo`](https://github.com/vaccautn/vacca-demo) | Mockup inicial de mayo 2026. No forma parte del sistema real | React, Tailwind CSS |

## Vista general

```text
                 ┌──────────────────────────────┐
  Productor ───▶ │  frontend (SPA en Vercel)    │
  y colaboradores│  React + TypeScript          │
                 └──────────────┬───────────────┘
                                │ HTTPS · JSON · JWT (Bearer)
                 ┌──────────────▼───────────────┐        ┌────────────────────┐
                 │  backend (FastAPI)           │──────▶ │  PostgreSQL        │
                 │  routers → services → models │        │  (migraciones con  │
                 │                              │        │   Alembic)         │
                 │                              │──────▶ │  Cloudflare R2     │
                 └──────────────┬───────────────┘        │  (fotos, URLs      │
                                │ HTTP en red privada    │   firmadas)        │
                 ┌──────────────▼───────────────┐        └────────────────────┘
                 │  IA · VACCA Vision (FastAPI) │
                 │  /detect · /bcs · análisis   │
                 │  de video con tracking       │
                 └──────────────────────────────┘
```

- El **frontend** solo habla con el backend. Nunca llama directo a la IA ni al almacenamiento.
- El **backend** es el único que conoce la base de datos, las credenciales de R2 y la URL del servicio de IA (`IA_SERVICE_URL`).
- La **IA** no tiene autenticación propia: se expone solo en la red privada del backend.

## Frontend

SPA con React Router. El código se organiza por funcionalidad en `src/features/`:

| Feature | Responsabilidad |
| --- | --- |
| `auth` | Registro, login y logout; guarda el JWT y protege rutas (`ProtectedRoute`, `PublicRoute`) |
| `rodeo` / `animales` | Listado, búsqueda por caravana, filtros, ficha del animal, alta individual, carga en tabla e importación CSV/XLSX |
| `lotes` | Lotes del productor y agrupación de animales |
| `mapa` | Mapa satelital (OpenLayers + Esri World Imagery), potreros importados desde KMZ y panel del lote |
| `sesiones` | Sesiones de evaluación de CC con fotos o video, tableros de la sesión y revisión de resultados |
| `servicios` | Temporada de monta: lotes participantes, resultados (preñada, vacía, parida), crías y reservicio |
| `recomendaciones` | Recomendaciones de manejo pendientes y decisiones del productor |
| `landing` | Página pública del proyecto con capturas y funciones por etapa |

Las páginas (`src/pages/`) son delgadas: componen features. Las llamadas HTTP pasan por un cliente común en `src/services/` que agrega el token y normaliza errores. Las pantallas pesadas se cargan de forma diferida (`router/LazyPages.tsx`).

**Calidad:** ESLint, `tsc` estricto, tests unitarios con Vitest + Testing Library y tests end to end con Playwright (`e2e/`).

**Deploy:** Vercel. `vercel.json` reescribe todas las rutas a `index.html` para que funcione el ruteo del lado del cliente.

## Backend

API REST con FastAPI, organizada en capas:

```text
app/
├── routers/    # endpoints HTTP por recurso (validan entrada y permisos)
├── schemas/    # contratos de entrada y salida (Pydantic)
├── services/   # reglas de negocio: estados del servicio, recomendaciones,
│               # estadísticas, importación, análisis de video, storage…
├── models/     # tablas SQLModel
├── auth/       # JWT y hash de contraseñas (bcrypt)
└── main.py     # app, CORS, hosts permitidos, límites de carga y routers
alembic/        # migraciones versionadas del esquema
```

**Dominio principal:** usuario (productor y colaboradores), campo, lote, animal, evaluación de CC, sesión de captura, video, evidencia visual, inferencia, servicio (`Servicio`, `ServicioLote`, `ResultadoServicio`), recomendación y actividad. El diagrama entidad-relación completo está en `backend/docs/schema.dbml`.

**Decisiones importantes:**

- **Aislamiento por productor:** cada consulta filtra por el campo del usuario autenticado; un productor nunca ve lotes, animales, evaluaciones ni capturas de otro. Está cubierto por tests.
- **Colaboradores:** el productor puede sumar colaboradores a su campo, que cargan videos y evaluaciones. Cada carga queda en el historial de actividad con su responsable.
- **Estados calculados:** el estado de un servicio (planificado, en curso, finalizado) se deriva de sus fechas, no se edita a mano.
- **Imágenes en Cloudflare R2:** el backend sube las fotos y entrega URLs firmadas con vencimiento.
- **Importación masiva:** CSV/XLSX con una etapa de revisión previa; las filas con errores se devuelven en un archivo aparte y la carga válida se registra como una tanda.
- **Límites de carga:** las subidas de video tienen un tope de tamaño que se controla antes de escribir el archivo a disco.

**Calidad:** Ruff, Pytest contra un PostgreSQL real y `alembic check` para detectar migraciones faltantes. GitHub Actions corre todo en cada push y pull request a `develop` y `main`.

## IA · VACCA Vision

Servicio FastAPI independiente que carga los modelos una sola vez al iniciar.

| Endpoint | Qué hace |
| --- | --- |
| `POST /detect` | Detecta vacas en una imagen con **YOLO26n** fine-tuneado (mAP50 0,974 · precisión 0,976 · recall 0,924) |
| `POST /bcs` | Estima la condición corporal (1 a 5) con **ResNet18 + CORAL** (regresión ordinal). Experimental |
| `POST /api/v1/analyses` | Recibe un video, lo muestrea, sigue a cada vaca entre frames (tracking) y evalúa cada pasada |
| `GET /health`, `/ready/bcs`, `/metrics` | Estado del servicio, disponibilidad de BCS y métricas |

Valida tipo, tamaño (10 MiB por imagen) y dimensiones antes de inferir, y separa la capacidad de `/detect` y `/bcs` para que una no bloquee a la otra. El entrenamiento evita la fuga de datos agrupando las fotos de una misma captura en una sola partición. Más detalle en `IA/docs/arquitectura.md` y `IA/docs/video-web.md`.

**Calidad:** Pytest, Ruff, tests de la interfaz de video y un control que verifica que los pesos privados no estén en el repositorio público, en GitHub Actions.

## Flujos principales

### Evaluar una vaca con una foto

1. En una sesión abierta, el productor elige el animal y sube la foto.
2. El backend valida el archivo y la envía a `/detect`. Si no detecta una vaca, o la confianza es menor al 80 %, rechaza la carga y el frontend muestra el motivo.
3. Si hay vaca, guarda la foto en R2, pide la CC estimada a `/bcs` y registra la evaluación. El productor puede confirmarla o corregirla.
4. Los tableros del rodeo, del lote y de la sesión se recalculan con la nueva evaluación.

### Analizar una sesión con video

1. El productor o un colaborador sube la grabación de la manga.
2. El backend la reenvía por partes a `/api/v1/analyses` con una clave de idempotencia, para que un reintento no genere un análisis duplicado.
3. La IA detecta y sigue a cada vaca, separa las pasadas y estima la CC de cada una.
4. El backend consulta el estado del análisis y el frontend muestra el resultado por pasada para que el productor lo asigne a cada animal.

### Temporada de servicio

1. El productor crea un servicio con fechas y lotes participantes.
2. El estado cambia solo según las fechas.
3. Al terminar carga los resultados (preñada, vacía, parida), registra las crías y puede reservir las vacas vacías.

## Desarrollo local

1. **Backend:** `docker compose up -d`, `alembic upgrade head` y `uvicorn app.main:app --reload` (puerto 8000). Ver `backend/README.md`.
2. **IA:** `python scripts/run_api.py` (puerto 8001). Ver `IA/README.md`.
3. **Frontend:** `pnpm install` y `pnpm dev` (puerto 5173), con la URL del backend en `VITE_API_BASE_URL`.

## Equipo

Proyecto final de Ingeniería en Sistemas de Información, UTN. Equipo: Fabricio Jerez, Tobías Stegmayer, Felipe Fidanza, Renzo Urturi, Yamil Apas Moselli y Eduardo Ramírez.
