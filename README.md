## índice

- [Comandos](#comandos)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Convención de Commits](#convención-de-commits)
- [Flujo de Ramas (Git Flow)](#flujo-de-ramas-git-flow)

## Comandos

| Comando           | Descripción                                          |
| ----------------- | ---------------------------------------------------- |
| `pnpm install`    | Instala las dependencias del proyecto                |
| `pnpm dev`        | Inicia el servidor de desarrollo en `localhost:5173` |
| `pnpm build`      | Genera el build de producción en `/dist`             |
| `pnpm preview`    | Previsualiza el build de producción localmente       |
| `pnpm lint`       | Ejecuta el linter (ESLint)                           |
| `pnpm type-check` | Verifica los tipos de TypeScript sin compilar        |
| `pnpm test:video` | Ejecuta pruebas de reglas de la integración de video |

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
ya creado usan la acción de reintento del análisis guardado.
La clave del navegador se conserva tras una respuesta incierta y solo se elimina
al recibir una respuesta de admisión confirmada, resolver explícitamente el error
retenido si la clave está vinculada a ese análisis, o descartar la clave de forma
explícita si no se pudo establecer esa relación;
los análisis históricos no alteran esa clave. Si ya se aplicó al menos un
resultado, el backend no permite otro video para esa sesión. Los errores resueltos
sin resultados aplicados no bloquean por sí solos un nuevo análisis.
El video fuente no se archiva; las imágenes importadas se consultan mediante URL
firmada protegida por el backend.

---

## Estructura de Carpetas

```
src/
├── assets/                  # Recursos estáticos (imágenes,  fuentes, íconos SVG)
│
├── components/              # Componentes reutilizables y genéricos
│   ├── ui/                  #   Componentes base: Button, Input, Modal, etc.
│   └── layout/              #   Estructuras de layout: Header, Sidebar, Footer
│
├── features/                # Módulos por funcionalidad (dominio)
│   └── [feature]/           #   Ej: auth/, dashboard/, users/
│       ├── components/      #     Componentes exclusivos de este feature
│       ├── hooks/           #     Custom hooks del feature
│       ├── services/        #     Llamadas a la API relacionadas
│       ├── store/           #     Estado local/global del feature (Zustand, Redux, etc.)
│       ├── types/           #     Tipos e interfaces del feature
│       └── index.ts         #     Barrel export del feature
│
├── hooks/                   # Custom hooks globales y reutilizables
│
├── lib/                     # Configuraciones de librerías externas (axios, i18n, etc.)
│
├── pages/                   # Páginas / Vistas de la aplicación (una por ruta)
│
├── router/                  # Configuración de React Router
│
├── services/                # Servicios globales (cliente HTTP base, helpers de API)
│
├── store/                   # Estado global de la aplicación
│
├── types/                   # Tipos e interfaces globales compartidos
│
├── utils/                   # Funciones utilitarias puras y helpers
│
├── App.tsx
└── main.tsx
```

> [Explicación del patron Barrel export en React](https://raul-alhena.medium.com/barrel-exports-en-reactjs-2ed37f30b625)

### Criterios de organización

- **`components/`** contiene solo componentes verdaderamente genéricos, sin lógica de negocio.
- **`features/`** Cada feature es autocontenida: sus componentes, hooks, tipos y servicios viven juntos. Esto facilita escalar, testear y eliminar features sin romper el resto.
- **`pages/`** son componentes delgados: su único rol es componer features y pasar props básicas. No contienen lógica compleja.
- Siempre que algo sea específico de un feature, va dentro de `features/[nombre]/`. Solo cuando es reutilizado en más de un lugar sube a las carpetas globales (`hooks/`, `utils/`, `types/`).

---

## Convención de Commits

Usamos el siguiente formato para todos los commits:

```
<tipo>[alcance]: mensaje en imperativo
```

El **alcance** es **opcional** y representa el área o módulo afectado (por ejemplo, el nombre de un feature, página o componente).

**Ejemplos:**

```
feat[Auth]: Implementar login con Google
fix[Dashboard]: Corrección de información errónea en gráfico de ventas
refactor: Reorganizar estructura de carpetas del proyecto
docs[README]: Agregar sección de convención de commits
```

### Tipos de commits disponibles

| Tipo       | Descripción                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| `feat`     | Nueva funcionalidad para el usuario                                              |
| `fix`      | Corrección de un bug                                                             |
| `refactor` | Cambio de código que no agrega funcionalidad ni corrige un bug                   |
| `style`    | Cambios de formato, espaciado, punto y coma (no afectan la lógica)               |
| `docs`     | Cambios en documentación (README, comentarios, etc.)                             |
| `test`     | Agregar o modificar tests                                                        |
| `chore`    | Tareas de mantenimiento: actualizar dependencias, configuraciones de build, etc. |
| `perf`     | Cambio que mejora el rendimiento                                                 |
| `ci`       | Cambios en la configuración de CI/CD                                             |
| `revert`   | Reversión de un commit anterior                                                  |

> El mensaje debe estar en **imperativo** y describir **qué hace** el commit, no qué hiciste vos. Ejemplo: `"Agregar validación de formulario"`, no `"Agregué validación de formulario"`.

---

## Flujo de Ramas (Git Flow)

Seguimos **Git Flow** como estrategia de branching. Referencia completa: [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/index.es_ES.html)

### Ramas principales

| Rama      | Descripción                                                              |
| --------- | ------------------------------------------------------------------------ |
| `main`    | Código en **producción**. Solo recibe merges desde `release` o `hotfix`. |
| `develop` | Rama de integración. Base para todas las features nuevas.                |

### Ramas de soporte

| Rama        | Origen    | Destino            | Nomenclatura                 |
| ----------- | --------- | ------------------ | ---------------------------- |
| `feature/*` | `develop` | `develop`          | `feature/nombre-descriptivo` |
| `release/*` | `develop` | `main` + `develop` | `release/x.x.x`              |
| `hotfix/*`  | `main`    | `main` + `develop` | `hotfix/descripcion-breve`   |

### Flujo de trabajo típico

```
1. Partís siempre desde develop
   git checkout develop && git pull

2. Creás tu rama de feature
   git checkout -b feature/mi-nueva-feature

3. Trabajás y hacés commits siguiendo la convención
   git commit -m "feat[MiFeature]: Agregar pantalla de detalle"

4. Abrís un Pull Request hacia develop
   → Code review → Merge

5. Cuando develop está listo para salir a producción,
   se crea una rama release/x.x.x para pruebas finales

6. Una vez aprobada, se mergea a main y se tagea la versión
```

> ⚠️ **Nunca** se hace commit directo sobre `main` ni `develop`. Todo cambio entra vía Pull Request.
