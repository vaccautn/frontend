# Frontend VACCA

Aplicación web para la gestión de animales, lotes, evaluaciones de condición corporal y sesiones de captura.

## Índice

- [Requisitos y puesta en marcha](#requisitos-y-puesta-en-marcha)
- [Comandos](#comandos)
- [Configuración de la API](#configuración-de-la-api)
- [Capacidades actuales](#capacidades-actuales)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Convenciones objetivo de organización](#convenciones-objetivo-de-organización)
- [Convención de commits](#convención-de-commits)
- [Política recomendada de ramas](#política-recomendada-de-ramas)

## Requisitos y puesta en marcha

- Node.js compatible con Vite y ESLint: `^20.19.0 || ^22.13.0 || >=24`.
- pnpm.
- Acceso a la API configurada mediante `VITE_API_BASE_URL`.

```bash
pnpm install
pnpm dev
```

El servidor de desarrollo queda disponible, por defecto, en `http://localhost:5173`.

## Comandos

| Comando        | Descripción                                                   |
| -------------- | ------------------------------------------------------------- |
| `pnpm install` | Instala las dependencias del proyecto                         |
| `pnpm dev`     | Inicia el servidor de desarrollo                              |
| `pnpm build`   | Ejecuta `tsc -b` y luego genera el build con Vite en `dist/` |
| `pnpm preview` | Previsualiza localmente el build de producción                 |
| `pnpm lint`    | Ejecuta ESLint                                                |

## Configuración de la API

La variable `VITE_API_BASE_URL` define la URL base utilizada por el cliente HTTP.

- El archivo `.env` versionado actualmente establece `VITE_API_BASE_URL=http://localhost:8000/api` para el desarrollo local.
- Si la variable no está definida, `src/services/httpClient.ts` utiliza `http://127.0.0.1:8000/api` como fallback.

## Capacidades actuales

- **Autenticación:** inicio de sesión, persistencia de sesión, protección de rutas y cierre de sesión.
- **Animales:** listado plano con filtros por caravana, sexo, raza y estado; alta, detalle, edición y baja de animales activos.
- **Indicadores:** dashboards de animales y de cada animal, con métricas, distribución y evolución.
- **Sesiones de evaluación:** listado filtrable y paginado, inicio de sesión de captura, carga de evaluaciones de condición corporal, finalización, eliminación y revisión de sesiones cerradas o canceladas.
- **Evaluaciones:** edición y baja lógica en sesiones cerradas, con actualización del resumen; carga, consulta y eliminación de imágenes de evidencia.

El registro de productores no está activo: aunque existen código y una página asociados, la ruta `/register` está comentada en el router. El dashboard general tampoco tiene navegación activa: `/dashboard` existe como ruta, pero su página actual es un placeholder y la entrada correspondiente está deshabilitada en el menú lateral.

## Rutas de la aplicación

Las rutas públicas permiten el acceso a `/login`. Las demás rutas de negocio requieren una sesión autenticada.

| Ruta                     | Estado / comportamiento actual                              |
| ------------------------ | ----------------------------------------------------------- |
| `/login`                 | Inicio de sesión                                            |
| `/dashboard`             | Ruta definida; placeholder sin navegación activa            |
| `/animales`              | Listado, filtros, indicadores y acceso a alta               |
| `/animales/nuevo`        | Alta de un animal                                           |
| `/animales/:id`          | Detalle, edición, baja e historial de evaluaciones          |
| `/sesiones`              | Listado filtrable e inicio de una sesión de evaluación     |
| `/sesiones/:id`          | Detalle de evaluaciones de sesiones cerradas o canceladas   |
| `/sesiones/:id/cargar`   | Carga y finalización de evaluaciones de una sesión abierta  |
| `/` y rutas desconocidas | Redirección a `/animales`                                   |

El menú lateral activo expone únicamente `/animales` y `/sesiones`.

## Estructura de carpetas

La siguiente vista refleja los directorios presentes actualmente en `src/`:

```
src/
├── components/
│   ├── layout/
│   └── ui/
├── features/
│   ├── animales/
│   │   ├── components/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── lotes/
│   │   └── services/
│   └── sesiones/
│       ├── components/
│       │   └── dashboard/
│       ├── hooks/
│       ├── services/
│       └── types/
├── lib/
│   └── chakra/
├── pages/                    # Páginas de ruta actualmente planas
├── router/
├── services/
├── utils/
├── App.css
├── App.tsx
├── index.css
└── main.tsx
```

## Convenciones objetivo de organización

Estas reglas describen la dirección de organización del código, no una afirmación de que todas las páginas ya sean delgadas:

- **`components/`**: componentes genéricos de UI y layout, sin lógica de negocio específica.
- **`features/`**: lógica reutilizable de dominio, incluidos servicios, hooks, tipos, utilidades y componentes propios de cada funcionalidad.
- **`pages/`**: coordinan la pantalla, el estado del flujo y la navegación. Actualmente algunas páginas concentran una parte importante de esa coordinación.
- La lógica de dominio reutilizable debe permanecer en `features/`; solo las piezas realmente compartidas entre funcionalidades deben ubicarse en carpetas globales como `services/` o `utils/`.

## Convención de commits

El formato esperado para los commits es:

```
<tipo>[alcance]: mensaje en imperativo
```

El **alcance** es opcional y representa el área o módulo afectado.

**Ejemplos:**

```
feat[Auth]: Implementar login con Google
fix[Dashboard]: Corregir información errónea en un gráfico
refactor: Reorganizar la estructura de carpetas
docs[README]: Actualizar la documentación
```

El mensaje debe describir qué hace el commit, por ejemplo `"Agregar validación de formulario"`.

## Política recomendada de ramas

Para el trabajo nuevo, la política actual de contribución recomienda crear una rama dedicada y abrir un Pull Request hacia `develop`. Esta recomendación describe el flujo vigente, no todo el historial del repositorio.

### Ramas de trabajo

| Tipo de cambio | Nomenclatura                 | Destino recomendado |
| -------------- | ---------------------------- | ------------------- |
| Funcionalidad  | `feature/nombre-descriptivo` | `develop`           |
| Corrección     | `fix/descripcion-breve`      | `develop`           |
| Documentación  | `docs/descripcion-breve`     | `develop`           |

### Flujo de trabajo recomendado

```text
1. Partir de develop
   git checkout develop && git pull

2. Crear una rama dedicada al cambio
   git checkout -b feature/mi-nueva-feature

3. Trabajar y realizar commits según la convención
   git commit -m "feat[MiFeature]: Agregar pantalla de detalle"

4. Abrir un Pull Request hacia develop
   → Revisión de código → Merge

5. Integrar el Pull Request aprobado en develop
```

> **Importante:** no realizar commits directos sobre `develop`; el trabajo nuevo debe ingresar mediante una rama `feature/*`, `fix/*` o `docs/*` y su Pull Request correspondiente.
