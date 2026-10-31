import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAccessToken,
  saveSession,
} from "../../auth/store/authSession.ts";
import {
  listarAnalisisVideo,
  reintentarAnalisisVideo,
  resolverAnalisisVideo,
  subirAnalisisVideo,
} from "./analisisVideoService.ts";
import { getJson, postJson } from "../../../services/httpClient.ts";
import {
  aplicarEntradasVideoRefrescadas,
  crearAnalisisVideoRecovery,
} from "./analisisVideoRecovery.ts";
import {
  analisisActivo,
  asociarClaveReintentoAnalisis,
  confirmarClaveReintentoAceptada,
  crearCargaVideo,
  descartarClaveReintento,
  esMismoArchivoReintento,
  hayResultadosVideoAplicados,
  hayClaveReintento,
  mensajeEstadoAnalisis,
  obtenerClaveReintento,
  puedeIniciarCarga,
  puedeResolverAnalisis,
  puedeReintentarAnalisis,
  seleccionarAnalisisVisible,
  validarArchivoVideo,
} from "./analisisVideoUtils.ts";
import type {
  AnalisisVideo,
  AnalisisVideoCompleto,
  AnalisisVideoList,
} from "../types/analisisVideo.ts";
import type { EntradasSesionRead, EvaluacionCC } from "../../animales/types/animales.ts";

function crearStorage(): Storage {
  const valores = new Map<string, string>();
  return {
    get length() { return valores.size; },
    clear: () => valores.clear(),
    getItem: (key) => valores.get(key) ?? null,
    key: (index) => [...valores.keys()][index] ?? null,
    removeItem: (key) => valores.delete(key),
    setItem: (key, value) => valores.set(key, String(value)),
  };
}

function crearArchivo(
  name = "corrales.mp4",
  options: FilePropertyBag = { type: "video/mp4", lastModified: 100 },
  content = "video-bytes",
): File {
  return new File([content], name, options);
}

function analisis(overrides: Partial<AnalisisVideoCompleto> = {}): AnalisisVideoCompleto {
  return {
    id: "analysis-1",
    sesion_id: 7,
    estado: "ENVIANDO",
    entradas_count: 2,
    pasajes_count: null,
    unresolved_count: 0,
    aplicados_count: 0,
    discrepancia: null,
    animales_sin_pasaje: [],
    pasajes_sin_asignar: [],
    advertencias: [],
    error_code: null,
    limpieza: "PENDIENTE",
    error_limpieza: null,
    resultados: [],
    ...overrides,
  };
}

function list(items: AnalisisVideo[]): AnalisisVideoList {
  return { items };
}

test("video status presentation prefers active work and keeps compact Spanish messages", () => {
  const completed = analisis({ id: "done", estado: "COMPLETADO", limpieza: "RESUELTA" });
  const processing = analisis({ id: "active", estado: "PROCESANDO" });
  assert.equal(seleccionarAnalisisVisible([]), undefined);
  assert.equal(seleccionarAnalisisVisible([completed, processing]), processing);
  assert.equal(seleccionarAnalisisVisible([completed]), completed);
  assert.equal(mensajeEstadoAnalisis(analisis({ estado: "EN_COLA" })), "Esperando procesamiento…");
  assert.equal(mensajeEstadoAnalisis(processing), "Analizando video…");
  assert.equal(
    mensajeEstadoAnalisis(completed),
    "Análisis completado. Resultados disponibles en la sesión.",
  );
  assert.equal(
    mensajeEstadoAnalisis(analisis({ estado: "IMPORTANDO", error_code: "storage_error" })),
    "No se pudo guardar un resultado. El análisis sigue en curso.",
  );
  assert.doesNotMatch(mensajeEstadoAnalisis(analisis({ estado: "ERROR", error_code: "private_code" })), /private_code/);
});

function evaluacion(overrides: Partial<EvaluacionCC> = {}): EvaluacionCC {
  return {
    id: 10,
    sesion_id: 7,
    animal_id: 1,
    animal_rfid: null,
    usuario_id: 12,
    fecha: "2026-10-30T12:00:00",
    valor_cc: null,
    orden_entrada: 1,
    escala_min: 1,
    escala_max: 5,
    observaciones: "",
    estado: "BORRADOR",
    creado_en: "2026-10-30T12:00:00",
    actualizado_en: "2026-10-30T12:00:00",
    ...overrides,
  };
}

function timerHarness() {
  let callback: (() => void) | undefined;
  let cleared = false;
  let scheduledSignal: (() => void) | undefined;
  return {
    schedule: (next: () => void) => {
      callback = next;
      scheduledSignal?.();
      scheduledSignal = undefined;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    },
    cancel: () => { cleared = true; callback = undefined; },
    get pending() { return callback !== undefined; },
    waitUntilScheduled: () => callback
      ? Promise.resolve()
      : new Promise<void>((resolve) => { scheduledSignal = resolve; }),
    tick: () => {
      const current = callback;
      callback = undefined;
      current?.();
    },
    get cleared() { return cleared; },
  };
}

function installLocalStorage(storage: Storage) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

function installSessionStorage(storage: Storage) {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage,
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("validates format, MIME and the backend's exact 50 MiB video limit", () => {
  assert.equal(validarArchivoVideo(crearArchivo()), null);
  assert.equal(validarArchivoVideo(crearArchivo("corrales.mov", { type: "video/quicktime" })), null);
  assert.match(validarArchivoVideo(crearArchivo("photo.jpg")) ?? "", /MP4 o MOV/);
  assert.match(validarArchivoVideo(crearArchivo("corrales.mp4", { type: "video/quicktime" })) ?? "", /no coincide/);
  const tooLarge = new File([new Uint8Array(50 * 1024 * 1024 + 1)], "large.mp4", { type: "video/mp4" });
  assert.match(validarArchivoVideo(tooLarge) ?? "", /50 MiB/);
});

test("uses one scoped metadata predicate for exact-file idempotency and never rotates silently", () => {
  const storage = crearStorage();
  const file = crearArchivo();
  let uuid = 0;
  const createUuid = () => `key-${++uuid}`;
  const key = obtenerClaveReintento(7, 12, file, storage, createUuid);
  assert.equal(esMismoArchivoReintento(7, 12, crearArchivo(), storage), true);
  assert.equal(obtenerClaveReintento(7, 12, crearArchivo(), storage, createUuid), key);
  assert.throws(
    () => obtenerClaveReintento(7, 12, crearArchivo("different.mp4"), storage, createUuid),
    /Confirmá su descarte/,
  );
  assert.equal(obtenerClaveReintento(7, 12, file, storage, createUuid), key);
  assert.equal(hayClaveReintento(7, 12, storage), true);
  assert.equal(confirmarClaveReintentoAceptada(7, 12, "stale-key", storage), false);
  assert.equal(hayClaveReintento(7, 12, storage), true);
  assert.equal(confirmarClaveReintentoAceptada(7, 12, key, storage), true);
  assert.equal(hayClaveReintento(7, 12, storage), false);
  const explicitKey = obtenerClaveReintento(7, 12, file, storage, createUuid);
  descartarClaveReintento(7, 12, storage);
  assert.equal(hayClaveReintento(7, 12, storage), false);
  assert.notEqual(explicitKey, key);
  assert.equal(esMismoArchivoReintento(7, 13, file, storage), false);
  assert.notEqual(obtenerClaveReintento(7, 13, file, storage, createUuid), key);
});

test("multipart creation keeps the backend field name and idempotency header", () => {
  const file = crearArchivo();
  const request = crearCargaVideo(file, "key-1");
  assert.equal(request.body.get("file"), file);
  assert.deepEqual(request.headers, { "Idempotency-Key": "key-1" });
});

test("the actual video service uses authenticated backend endpoints and propagates HTTP errors", async () => {
  const local = crearStorage();
  installLocalStorage(local);
  saveSession("test-token", "Bearer", { id: 12, nombre: "Test", apellido: "User", email: "test@example.invalid", rol: "USUARIO" });
  assert.equal(getAccessToken(), "test-token");
  const session = crearStorage();
  installSessionStorage(session);
  const resolveKey = obtenerClaveReintento(7, 12, crearArchivo(), session, () => "resolve-key");
  asociarClaveReintentoAnalisis(7, 12, resolveKey, "analysis-1", session);

  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; options: RequestInit }> = [];
  globalThis.fetch = async (input, options = {}) => {
    calls.push({ url: String(input), options });
    if (calls.length === 1) {
      return new Response(JSON.stringify(analisis({ estado: "EN_COLA" })), { status: 202 });
    }
    if (calls.length === 2) return new Response(JSON.stringify(list([])), { status: 200 });
    if (calls.length === 3) return new Response(JSON.stringify(analisis({ estado: "PROCESANDO" })), { status: 202 });
    if (calls.length === 4) return new Response(null, { status: 204 });
    return new Response(JSON.stringify({ detail: "conflicto de prueba" }), { status: 409 });
  };

  try {
    const file = crearArchivo();
    const accepted = await subirAnalisisVideo(7, file, "key-1");
    assert.equal(accepted.estado, "EN_COLA");
    const uploads = calls[0];
    assert.match(uploads.url, /\/api\/sesiones-captura\/7\/analisis-video$/);
    assert.equal(uploads.options.method, "POST");
    assert.equal((uploads.options.headers as Record<string, string>).Authorization, "Bearer test-token");
    assert.equal((uploads.options.headers as Record<string, string>)["Idempotency-Key"], "key-1");
    assert.equal("Content-Type" in (uploads.options.headers as Record<string, string>), false);
    assert.equal((uploads.options.body as FormData).get("file"), file);

    await listarAnalisisVideo(7);
    await reintentarAnalisisVideo(7, "analysis-1");
    await resolverAnalisisVideo(7, "analysis-1");
    assert.equal(hayClaveReintento(7, 12, session), false);
    assert.match(calls[1].url, /\/sesiones-captura\/7\/analisis-video$/);
    assert.match(calls[2].url, /\/sesiones-captura\/7\/analisis-video\/analysis-1\/retry$/);
    assert.match(calls[3].url, /\/sesiones-captura\/7\/analisis-video\/analysis-1\/resolve$/);
    for (const call of calls.slice(1, 4)) {
      assert.equal((call.options.headers as Record<string, string>).Authorization, "Bearer test-token");
    }

    await assert.rejects(
      subirAnalisisVideo(7, file, "key-1"),
      (error: unknown) => error instanceof Error && "status" in error && error.status === 409,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("resolve captures user/key before await and preserves a newer same-user key plus another account key", async () => {
  const local = crearStorage();
  const session = crearStorage();
  installLocalStorage(local);
  installSessionStorage(session);
  saveSession("account-a-token", "Bearer", { id: 12, nombre: "A", apellido: "User", email: "a@example.invalid", rol: "USUARIO" });
  const oldKey = obtenerClaveReintento(7, 12, crearArchivo("old.mp4"), session, () => "a-old-key");
  asociarClaveReintentoAnalisis(7, 12, oldKey, "analysis-a", session);

  const originalFetch = globalThis.fetch;
  const capturedRequest = deferred<RequestInit>();
  const finishResponse = deferred<Response>();
  globalThis.fetch = async (_input, options = {}) => {
    capturedRequest.resolve(options);
    return finishResponse.promise;
  };

  try {
    const resolution = resolverAnalisisVideo(7, "analysis-a");
    const request = await capturedRequest.promise;
    assert.equal((request.headers as Record<string, string>).Authorization, "Bearer account-a-token");

    descartarClaveReintento(7, 12, session);
    const newAKey = obtenerClaveReintento(7, 12, crearArchivo("new-a.mp4"), session, () => "a-new-key");
    saveSession("account-b-token", "Bearer", { id: 22, nombre: "B", apellido: "User", email: "b@example.invalid", rol: "USUARIO" });
    const bKey = obtenerClaveReintento(7, 22, crearArchivo("b.mp4"), session, () => "b-key");

    finishResponse.resolve(new Response(null, { status: 204 }));
    await resolution;

    assert.equal(obtenerClaveReintento(7, 12, crearArchivo("new-a.mp4"), session, () => "wrong-a-key"), newAKey);
    assert.equal(obtenerClaveReintento(7, 22, crearArchivo("b.mp4"), session, () => "wrong-b-key"), bKey);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("resolve does not clear a pending key already bound to a different analysis", async () => {
  const local = crearStorage();
  const session = crearStorage();
  installLocalStorage(local);
  installSessionStorage(session);
  saveSession("test-token", "Bearer", { id: 12, nombre: "Test", apellido: "User", email: "test@example.invalid", rol: "USUARIO" });
  const key = obtenerClaveReintento(7, 12, crearArchivo(), session, () => "bound-key");
  asociarClaveReintentoAnalisis(7, 12, key, "other-analysis", session);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });
  try {
    await resolverAnalisisVideo(7, "resolved-analysis");
    assert.equal(obtenerClaveReintento(7, 12, crearArchivo(), session, () => "wrong-key"), key);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("resolved historical work cannot erase the pending key for a newer lost-response attempt across reload", async () => {
  const local = crearStorage();
  const session = crearStorage();
  installLocalStorage(local);
  installSessionStorage(session);
  saveSession("test-token", "Bearer", { id: 12, nombre: "Test", apellido: "User", email: "test@example.invalid", rol: "USUARIO" });
  const file = crearArchivo("new-attempt.mp4");
  const key = obtenerClaveReintento(7, 12, file, session, () => "current-key");
  const oldResolved = analisis({
    id: "old-resolved",
    estado: "ERROR",
    limpieza: "RESUELTA",
    error_code: "analisis_ia_fallido",
  });
  const newUncertain = analisis({ id: "current-job", estado: "ENVIANDO" });
  const clock = timerHarness();
  const originalFetch = globalThis.fetch;
  const requests: RequestInit[] = [];
  globalThis.fetch = async (_input, options = {}) => {
    requests.push(options);
    if (options.method === "POST") throw new TypeError("simulated lost response");
    return new Response(JSON.stringify(list([oldResolved, newUncertain])), { status: 200 });
  };

  try {
    await assert.rejects(subirAnalisisVideo(7, file, key), /simulated lost response/);
    const deliveredItems = deferred<AnalisisVideo[]>();
    const recovery = crearAnalisisVideoRecovery({
      load: () => listarAnalisisVideo(7),
      refreshEntries: async () => {},
      onItems: (items) => deliveredItems.resolve(items),
      onError: () => assert.fail("list must load"),
      onRefreshFailure: () => {},
      onRefreshSuccess: () => {},
      intervalMs: 4000,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    const recoveredItems = await deliveredItems.promise;
    await clock.waitUntilScheduled();
    assert.deepEqual(recoveredItems.map((item) => item.id), ["old-resolved", "current-job"]);
    recovery.stop();
    assert.equal(hayClaveReintento(7, 12, session), true);
    assert.equal(obtenerClaveReintento(7, 12, crearArchivo("new-attempt.mp4"), session, () => "wrong-new-key"), key);

    await assert.rejects(subirAnalisisVideo(7, crearArchivo("new-attempt.mp4"), key), /simulated lost response/);
    assert.equal((requests[0].headers as Record<string, string>)["Idempotency-Key"], key);
    assert.equal((requests[2].headers as Record<string, string>)["Idempotency-Key"], key);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("resolve is allowed for every retained error; job retry excludes only admission rejection", () => {
  const rejected = analisis({ estado: "ERROR", error_code: "ia_admision_rechazada", limpieza: "RETENIDA" });
  const processingFailure = analisis({ estado: "ERROR", error_code: "analisis_ia_fallido", limpieza: "RETENIDA" });
  assert.equal(puedeResolverAnalisis(rejected), true);
  assert.equal(analisisActivo([rejected]), rejected);
  assert.equal(puedeResolverAnalisis(processingFailure), true);
  const restrictedAdmission = {
    estado: "ENVIANDO",
    limpieza: "PENDIENTE",
    acceso_restringido: true,
  };
  assert.equal(puedeResolverAnalisis(restrictedAdmission), true);
  assert.equal(puedeReintentarAnalisis(restrictedAdmission), false);
  assert.equal(puedeReintentarAnalisis(rejected), false);
  assert.equal(puedeReintentarAnalisis(processingFailure), true);
  const noKey = crearStorage();
  assert.equal(hayClaveReintento(7, 12, noKey), false);
  const key = obtenerClaveReintento(7, 12, crearArchivo(), noKey, () => "key");
  assert.equal(key, "key");
  assert.equal(puedeResolverAnalisis(rejected), true);
});

test("uploads are disabled once any video result was applied, but empty resolved failures permit a new upload", () => {
  const base = {
    archivoValido: true,
    sesionAbierta: true,
    ordenDisponible: true,
    entradasCount: 2,
    mismoArchivoPendiente: false,
    clavePendiente: false,
    estadoRecuperado: true,
    enviando: false,
  };
  const completed = analisis({ estado: "COMPLETADO", limpieza: "RESUELTA", aplicados_count: 1 });
  const resolvedPartial = analisis({ estado: "ERROR", limpieza: "RESUELTA", aplicados_count: 1 });
  const resolvedEmpty = analisis({ estado: "ERROR", limpieza: "RESUELTA", aplicados_count: 0 });
  assert.equal(hayResultadosVideoAplicados([completed]), true);
  assert.equal(hayResultadosVideoAplicados([resolvedPartial]), true);
  assert.equal(hayResultadosVideoAplicados([resolvedEmpty]), false);
  assert.equal(puedeIniciarCarga({ ...base, resultadosYaAplicados: true }), false);
  assert.equal(puedeIniciarCarga({ ...base, resultadosYaAplicados: false }), true);
  assert.equal(puedeIniciarCarga({ ...base, estadoRecuperado: false, resultadosYaAplicados: false }), false);
});

test("refresh remains dirty and retries on the next identical completed snapshot", async () => {
  const clock = timerHarness();
  let refreshCount = 0;
  let itemsSeen = 0;
  let refreshFailures = 0;
  const initialItems = deferred<void>();
  const firstFailure = deferred<void>();
  const retrySucceeded = deferred<void>();
  const completed = analisis({ id: "completed", estado: "COMPLETADO", aplicados_count: 1 });
  const recovery = crearAnalisisVideoRecovery({
    load: async () => list([completed]),
    refreshEntries: async () => {
      refreshCount += 1;
      if (refreshCount === 1) throw new Error("temporary entries failure");
    },
    onItems: () => {
      itemsSeen += 1;
      if (itemsSeen === 1) initialItems.resolve();
    },
    onError: () => assert.fail("list must load"),
    onRefreshFailure: () => {
      refreshFailures += 1;
      firstFailure.resolve();
    },
    onRefreshSuccess: () => retrySucceeded.resolve(),
    intervalMs: 4000,
    schedule: clock.schedule,
    cancel: clock.cancel,
  });

  await initialItems.promise;
  await firstFailure.promise;
  await clock.waitUntilScheduled();
  clock.tick();
  await retrySucceeded.promise;
  await clock.waitUntilScheduled();
  recovery.stop();
  assert.equal(refreshCount, 2);
  assert.equal(refreshFailures, 1);
  assert.equal(itemsSeen, 2);
  assert.equal(clock.cleared, true);
});

test("refresh updates the ordered snapshot but preserves the manual evaluation map while its dialog is open", () => {
  type Evaluation = { animal_id: number; value_cc: number | null };
  const existing = new Map<number, Evaluation>([[1, { animal_id: 1, value_cc: 3 }]]);
  let current = existing;
  let savedSnapshot = false;
  const snapshot = {
    orden_disponible: true,
    items: [{ animal_id: 1, value_cc: null }],
  };

  aplicarEntradasVideoRefrescadas<Evaluation, typeof snapshot>(
    snapshot,
    true,
    () => { savedSnapshot = true; },
    (next) => { current = next; },
  );
  assert.equal(savedSnapshot, true);
  assert.equal(current, existing);
  assert.equal(current.get(1)?.value_cc, 3);

  aplicarEntradasVideoRefrescadas<Evaluation, typeof snapshot>(
    snapshot,
    false,
    () => {},
    (next) => { current = next; },
  );
  assert.notEqual(current, existing);
  assert.equal(current.get(1)?.value_cc, null);
});

test("a successful entry POST followed by a failed entries GET stays pending and recovers with no video jobs", async () => {
  const local = crearStorage();
  installLocalStorage(local);
  saveSession("test-token", "Bearer", { id: 12, nombre: "Test", apellido: "User", email: "test@example.invalid", rol: "USUARIO" });
  const clock = timerHarness();
  const initialItems = deferred<void>();
  const refreshFailure = deferred<void>();
  const snapshotRecovered = deferred<void>();
  const recoverySucceeded = deferred<void>();
  const priorManualEvaluation = evaluacion({ id: 9, valor_cc: 3 });
  let evaluationMap = new Map<number, EvaluacionCC>([[1, priorManualEvaluation]]);
  const recoveredSnapshot = deferred<EntradasSesionRead>();
  let itemsCount = 0;
  const newEntry = evaluacion({ id: 10, valor_cc: null });
  const originalFetch = globalThis.fetch;
  let call = 0;
  globalThis.fetch = async (input, options = {}) => {
    call += 1;
    if (call === 1) return new Response(JSON.stringify(list([])), { status: 200 });
    if (call === 2) {
      assert.match(String(input), /\/sesiones-captura\/7\/entradas$/);
      assert.equal(options.method, "POST");
      return new Response(JSON.stringify(newEntry), { status: 201 });
    }
    if (call === 3) {
      assert.match(String(input), /\/sesiones-captura\/7\/entradas$/);
      return new Response(JSON.stringify({ detail: "temporal" }), { status: 503 });
    }
    if (call === 4) return new Response(JSON.stringify(list([])), { status: 200 });
    if (call === 5) {
      assert.match(String(input), /\/sesiones-captura\/7\/entradas$/);
      return new Response(JSON.stringify({ orden_disponible: true, items: [newEntry] }), { status: 200 });
    }
    throw new Error(`unexpected request ${call}`);
  };

  const recovery = crearAnalisisVideoRecovery({
    load: () => listarAnalisisVideo(7),
    refreshEntries: async () => {
      const snapshot = await getJson<EntradasSesionRead>(
        "/sesiones-captura/7/entradas",
        getAccessToken(),
      );
      aplicarEntradasVideoRefrescadas<EvaluacionCC, EntradasSesionRead>(
        snapshot,
        true,
        (value) => {
          recoveredSnapshot.resolve(value);
          snapshotRecovered.resolve();
        },
        (value) => { evaluationMap = value; },
      );
    },
    onItems: () => {
      itemsCount += 1;
      if (itemsCount === 1) initialItems.resolve();
    },
    onError: () => assert.fail("empty analysis list should remain readable"),
    onRefreshFailure: () => refreshFailure.resolve(),
    onRefreshSuccess: () => recoverySucceeded.resolve(),
    intervalMs: 4000,
    schedule: clock.schedule,
    cancel: clock.cancel,
  });

  try {
    await initialItems.promise;
    await clock.waitUntilScheduled();
    const posted = await postJson<EvaluacionCC, { animal_id: number; valor_cc: null }>(
      "/sesiones-captura/7/entradas",
      { animal_id: 1, valor_cc: null },
      getAccessToken(),
    );
    assert.equal(posted.id, newEntry.id);
    await assert.rejects(recovery.requestEntriesRefresh());
    await refreshFailure.promise;
    clock.tick();
    await snapshotRecovered.promise;
    await recoverySucceeded.promise;
    await clock.waitUntilScheduled();

    assert.deepEqual((await recoveredSnapshot.promise).items.map((item) => item.id), [10]);
    assert.equal(itemsCount, 2);
    assert.equal(evaluationMap.get(1), priorManualEvaluation);
    assert.equal(evaluationMap.get(1)?.valor_cc, 3);
  } finally {
    recovery.stop();
    globalThis.fetch = originalFetch;
  }
});

test("recovery polling is sequential and ignores late results after unmount/session change", async () => {
  let finishLoad!: (value: ReturnType<typeof list>) => void;
  let delivered = 0;
  const loadCompleted = deferred<void>();
  const clock = timerHarness();
  const recovery = crearAnalisisVideoRecovery({
    load: () => new Promise((resolve) => {
      finishLoad = (value) => {
        resolve(value);
        loadCompleted.resolve();
      };
    }),
    refreshEntries: async () => {},
    onItems: () => { delivered += 1; },
    onError: () => assert.fail("no error expected"),
    onRefreshFailure: () => {},
    onRefreshSuccess: () => {},
    intervalMs: 4000,
    schedule: clock.schedule,
    cancel: clock.cancel,
  });
  recovery.stop();
  finishLoad(list([]));
  await loadCompleted.promise;
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(delivered, 0);
  assert.equal(clock.pending, false);
});
