import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  buildFigmaPatCorsHeaders,
  isOpaqueFigmaPluginRequest,
} from "../lib/figma-plugin-cors";

test("Figma PAT endpoint permits the plugin's opaque origin without credentials", () => {
  const request = new NextRequest("https://www.waysorted.com/api/auth/figma/pat", {
    method: "OPTIONS",
    headers: { origin: "null" },
  });

  const headers = buildFigmaPatCorsHeaders(request);
  assert.ok(headers);
  assert.equal(headers["Access-Control-Allow-Origin"], "*");
  assert.match(headers["Access-Control-Allow-Headers"], /Authorization/);
  assert.equal("Access-Control-Allow-Credentials" in headers, false);
  assert.equal(isOpaqueFigmaPluginRequest(request), true);
});

test("Figma PAT endpoint still rejects unrelated web origins", () => {
  const request = new NextRequest("https://www.waysorted.com/api/auth/figma/pat", {
    method: "OPTIONS",
    headers: { origin: "https://attacker.example" },
  });

  assert.equal(buildFigmaPatCorsHeaders(request), null);
});
