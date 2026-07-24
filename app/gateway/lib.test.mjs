import assert from "node:assert/strict";
import test from "node:test";
import { buildSnapshot, publicJson, sanitizeJob } from "./lib.mjs";

test("sanitizeJob exposes only the portal task contract", () => {
  const sanitized = sanitizeJob({
    id: "202607230001",
    status: "success",
    created_at: 1784772000,
    updated_at: 1784772060,
    request: {
      organisation_name: "検証病院",
      product_variant: "standard",
      material_number: "20260723",
      postgresql_password: "must-never-leak",
      upds_password: "must-never-leak-either",
    },
    log: ["sensitive build output"],
  });

  assert.deepEqual(Object.keys(sanitized), [
    "id",
    "status",
    "organization",
    "productVariant",
    "materialNumber",
    "createdAt",
    "updatedAt",
  ]);
  assert.equal(publicJson(sanitized).includes("must-never-leak"), false);
  assert.equal(publicJson(sanitized).includes("sensitive build output"), false);
});

test("buildSnapshot calculates operational summary and strips unknown fields", () => {
  const snapshot = buildSnapshot({
    jobsPayload: {
      jobs: [
        {
          id: "2",
          status: "running",
          updated_at: 20,
          request: { organisation_name: "A" },
        },
        {
          id: "1",
          status: "failed",
          updated_at: 10,
          request: { organisation_name: "B" },
        },
      ],
    },
    resourcesPayload: {
      cpu_count: 8,
      memory_available_bytes: 1024,
      disk_free_bytes: 2048,
      secret: "hidden",
    },
    organizationsPayload: [
      { code: "A", name: "A機関" },
      { code: "B", name: "B機関" },
    ],
    latencyMs: 12,
    upstreamError: null,
    now: new Date("2026-07-23T00:00:00Z"),
  });

  assert.equal(snapshot.summary.running, 1);
  assert.equal(snapshot.summary.failed, 1);
  assert.equal(snapshot.summary.organizations, 2);
  assert.equal(snapshot.resources.cpuCount, 8);
  assert.equal(publicJson(snapshot).includes("hidden"), false);
});
