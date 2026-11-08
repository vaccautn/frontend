import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, postFormData } from "../../../services/httpClient.ts";
import { getImagenUploadErrorMessage } from "./imagenUploadErrors.ts";

test("validation errors are not bovine detection rejections", () => {
  const message = getImagenUploadErrorMessage(new ApiError(422, "El archivo está vacío"));
  assert.match(message, /vacío/);
  assert.doesNotMatch(message, /bovino/);
});

test("structured errors distinguish confidence, detection and storage", () => {
  for (const [code, pattern] of [
    ["image_no_cow", /no detectó un bovino/],
    ["image_low_confidence", /confianza.*80/],
    ["image_detection_timeout", /tiempo/],
    ["image_detection_invalid_response", /respuesta inválida/],
    ["image_storage_unavailable", /almacenamiento/],
  ] as const) {
    const error = new ApiError(code.startsWith("image_detection") || code.includes("storage") ? 502 : 400,
      { code, message: "Safe diagnostic" });
    assert.match(getImagenUploadErrorMessage(error), pattern);
  }
});

test("connection failures do not assert CORS or that nothing was saved", () => {
  const message = getImagenUploadErrorMessage(new TypeError("Failed to fetch"), 2);
  assert.match(message, /conexión|conectar/);
  assert.doesNotMatch(message, /bovino|no se guardó ninguna|CORS/);
});

test("unknown 400 details never expose private diagnostics", () => {
  for (const detail of [
    "private-diagnostic: https://internal.invalid/private-path",
    { code: "unknown", message: "private-diagnostic" },
  ]) {
    const message = getImagenUploadErrorMessage(new ApiError(400, detail));
    assert.match(message, /solicitud|imagen/);
    assert.doesNotMatch(message, /private-diagnostic|internal\.invalid|private-path/);
  }
});

test("inherited and non-string codes cannot escape the message allowlist", () => {
  for (const code of ["constructor", "toString", "__proto__", 42, null, {}]) {
    const error = new ApiError(400, JSON.parse(JSON.stringify({ code, message: "private-diagnostic" })));
    const message = getImagenUploadErrorMessage(error);
    assert.equal(typeof message, "string");
    assert.match(message, /solicitud|imagen/);
    assert.doesNotMatch(message, /private-diagnostic|function|\[object/);
  }
});

test("502 messages tolerate malformed remote text and prioritize known codes", () => {
  for (const [code, pattern] of [
    ["image_storage_unavailable", /almacenamiento/],
    ["image_detection_timeout", /tiempo de espera/],
    ["unknown", /servidor/],
    ["constructor", /servidor/],
  ] as const) {
    for (const remoteMessage of [42, { diagnostic: "private-diagnostic" }, "private-diagnostic"]) {
      const detail = JSON.parse(JSON.stringify({ code, message: remoteMessage }));
      const message = getImagenUploadErrorMessage(new ApiError(502, detail));
      assert.equal(typeof message, "string");
      assert.match(message, pattern);
      assert.doesNotMatch(message, /private-diagnostic|\[object|function/);
    }
  }
});

test("HTTP parsing preserves safe codes and handles empty and validation responses", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [status, body, pattern] of [
      [502, JSON.stringify({ detail: { code: "image_storage_unavailable", message: "Safe" } }), /almacenamiento/],
      [422, JSON.stringify({ detail: [{ loc: ["body", "imagenes"], msg: "Field required" }] }), /solicitud|archivo/],
      [502, "", /servidor|servicio/],
      [502, "null", /servidor|servicio/],
      [401, "", /sesión/],
      [403, "", /permiso/],
      [413, "", /10 MB/],
    ] as const) {
      globalThis.fetch = async () => new Response(body, { status });
      await assert.rejects(postFormData("/evaluaciones-cc/1/imagenes", new FormData()), (error) => {
        assert.match(getImagenUploadErrorMessage(error), pattern);
        return true;
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
