# Tests end-to-end (Playwright)

Corren contra el stack real: el Postgres del `docker-compose` del backend, el backend con una
base propia y Vite apuntando a ese backend.

## Requisitos

- Postgres levantado: `docker compose up -d` desde `backend/`.
- El entorno de Python del backend con sus dependencias instaladas (`backend/.venv`). Si usás
  otro intérprete, indicalo con `E2E_PYTHON=/ruta/a/python`.
- El navegador de Playwright, una sola vez: `pnpm exec playwright install chromium`.

## Correr

```bash
pnpm test:e2e                              # escritorio y celular
pnpm test:e2e --project=escritorio         # solo escritorio
pnpm exec playwright show-report           # reporte de la última corrida
```

Playwright levanta todo solo (ver `playwright.config.ts`):

1. `backend/scripts/e2e_preparar_base.py` borra y recrea la base `vacca_e2e` y le aplica las
   migraciones. Por seguridad, solo acepta bases cuyo nombre termine en `_e2e`: nunca toca la
   base de desarrollo.
2. El backend en el puerto `8010` y Vite en el `5174`. El CORS se configura por variable de
   entorno, sin depender del `.env` local.

Cada test registra un productor nuevo por la API y entra ya logueado. Las caravanas usan un CUIG
al azar, porque son únicas en todo el sistema.
