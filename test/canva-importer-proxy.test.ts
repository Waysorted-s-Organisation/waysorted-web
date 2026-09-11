import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanvaImporterTarget,
  isAllowedCanvaImporterRoute,
  resolveCanvaImporterBackend,
} from "../lib/canva-importer-proxy";

const jobId = "11111111-1111-4111-8111-111111111111";
const captureId = "22222222-2222-4222-8222-222222222222";
const pageId = "33333333-3333-4333-8333-333333333333";

test("Canva proxy only permits capture operations used by the plugin", () => {
  assert.equal(isAllowedCanvaImporterRoute("POST", "capture-jobs"), true);
  assert.equal(isAllowedCanvaImporterRoute("GET", `capture-jobs/${jobId}`), true);
  assert.equal(isAllowedCanvaImporterRoute("DELETE", `capture-jobs/${jobId}`), true);
  assert.equal(isAllowedCanvaImporterRoute("GET", `captures/${captureId}`), true);
  assert.equal(
    isAllowedCanvaImporterRoute("GET", `captures/${captureId}/pages/${pageId}/image`),
    true,
  );

  assert.equal(isAllowedCanvaImporterRoute("GET", "health"), false);
  assert.equal(isAllowedCanvaImporterRoute("POST", "canva/oauth/start"), false);
  assert.equal(isAllowedCanvaImporterRoute("GET", "captures/../../health"), false);
  assert.equal(isAllowedCanvaImporterRoute("POST", `capture-jobs/${jobId}`), false);
});

test("Canva proxy requires HTTPS in production and preserves an optional base path", () => {
  assert.equal(resolveCanvaImporterBackend("http://python.example", "production"), null);
  assert.equal(resolveCanvaImporterBackend("https://user:secret@python.example", "production"), null);
  assert.equal(resolveCanvaImporterBackend("http://localhost:3000", "development")?.origin, "http://localhost:3000");

  const backend = resolveCanvaImporterBackend(
    "https://python.example/internal/canva",
    "production",
  );
  assert.ok(backend);
  assert.equal(
    buildCanvaImporterTarget(backend, `capture-jobs/${jobId}`).toString(),
    `https://python.example/internal/canva/api/capture-jobs/${jobId}`,
  );
});
