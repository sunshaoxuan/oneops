import assert from "node:assert/strict";
import test from "node:test";
import { operationAuditDescription } from "./operation-audit.mjs";

test("operation audit classifies inquiry actions and keeps ticket references", () => {
  assert.deepEqual(
    operationAuditDescription(
      "POST",
      "/api/work-center/v1/inquiry-support/search",
      200,
    ),
    {
      eventType: "INQUIRY_SEARCHED",
      capability: "INQUIRY_SEARCH",
      action: "SEARCH",
      targetType: "INQUIRY",
      outcome: "SUCCESS",
      resourceRef: "",
    },
  );
  const assist = operationAuditDescription(
    "POST",
    "/api/work-center/v1/inquiry-support/tickets/93200/threads/question/assist-runs",
    202,
  );
  assert.equal(assist.capability, "INQUIRY_AI_ASSIST");
  assert.equal(assist.resourceRef, "93200");
});

test("operation audit records denied outcomes and ignores background polling", () => {
  assert.equal(
    operationAuditDescription(
      "GET",
      "/api/work-center/v1/environments",
      403,
    ).outcome,
    "DENIED",
  );
  assert.equal(
    operationAuditDescription(
      "GET",
      "/api/work-center/v1/auth/session",
      200,
    ),
    null,
  );
});
