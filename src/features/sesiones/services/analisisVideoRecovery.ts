import type { AnalisisVideoList } from "../types/analisisVideo.ts";
import { iniciarPollingSecuencial } from "./analisisVideoUtils.ts";

type RecoveryOptions = {
  load: () => Promise<AnalisisVideoList>;
  refreshEntries: () => Promise<void>;
  onItems: (items: AnalisisVideoList["items"]) => void;
  onError: (error: unknown) => void;
  onRefreshFailure: (error: unknown) => void;
  onRefreshSuccess: () => void;
  intervalMs: number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
};

export type AnalisisVideoRecovery = {
  stop: () => void;
  requestEntriesRefresh: () => Promise<void>;
};

export function aplicarEntradasVideoRefrescadas<
  T extends { animal_id: number },
  TSnapshot extends { items: T[]; orden_disponible: boolean },
>(
  snapshot: TSnapshot,
  dialogoManualAbierto: boolean,
  guardarSnapshot: (value: TSnapshot) => void,
  guardarEvaluaciones: (value: Map<number, T>) => void,
): void {
  guardarSnapshot(snapshot);
  if (!dialogoManualAbierto) {
    guardarEvaluaciones(new Map(snapshot.items.map((item) => [item.animal_id, item])));
  }
}

export function crearAnalisisVideoRecovery({
  load,
  refreshEntries,
  onItems,
  onError,
  onRefreshFailure,
  onRefreshSuccess,
  intervalMs,
  schedule = setTimeout,
  cancel = clearTimeout,
}: RecoveryOptions): AnalisisVideoRecovery {
  let lastSnapshot = "";
  let refreshDirty = false;
  let refreshVersion = 0;
  let refreshPromise: Promise<void> | null = null;
  let stopped = false;

  const markRefreshDirty = () => {
    refreshDirty = true;
    refreshVersion += 1;
  };

  const flushRefresh = async (): Promise<void> => {
    if (!refreshDirty) return;
    if (refreshPromise) {
      await refreshPromise;
      if (refreshDirty) await flushRefresh();
      return;
    }

    const version = refreshVersion;
    const request = (async () => {
      try {
        await refreshEntries();
        if (refreshVersion === version) refreshDirty = false;
        if (!stopped) onRefreshSuccess();
      } catch (error) {
        if (!stopped) onRefreshFailure(error);
        throw error;
      }
    })();
    refreshPromise = request;
    try {
      await request;
    } finally {
      if (refreshPromise === request) refreshPromise = null;
    }
  };

  const requestEntriesRefresh = async () => {
    if (stopped) return;
    markRefreshDirty();
    await flushRefresh();
  };

  const stopPolling = iniciarPollingSecuencial(
    load,
    async ({ items }) => {
      onItems(items);
      const snapshot = items
        .map((item) =>
          `${item.id}:${item.estado}:${item.limpieza}:${item.acceso_restringido ? item.resultados_aplicados : item.aplicados_count}`,
        )
        .join("|");
      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        if (
          items.some(
            (item) =>
              ["IMPORTANDO", "COMPLETADO"].includes(item.estado) ||
              (item.acceso_restringido
                ? item.resultados_aplicados
                : item.aplicados_count > 0),
          )
        ) {
          markRefreshDirty();
        }
      }

      if (refreshDirty) {
        try {
          await flushRefresh();
        } catch {
          // Preserve the dirty marker for the next status poll or explicit retry.
        }
      }
    },
    onError,
    intervalMs,
    schedule,
    cancel,
  );

  const stop = () => {
    stopped = true;
    stopPolling();
  };

  return { stop, requestEntriesRefresh };
}
