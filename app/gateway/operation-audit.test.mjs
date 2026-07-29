import assert from "node:assert/strict";
import test from "node:test";
import { operationAuditDescription } from "./operation-audit.mjs";

const conversationId = "11111111-2222-4333-8444-555555555555";

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
  assert.deepEqual(
    operationAuditDescription(
      "GET",
      "/api/work-center/v1/inquiry-support/tickets/93200/assist-runs",
      200,
    ),
    {
      eventType: "INQUIRY_AI_RUN_HISTORY_READ",
      capability: "INQUIRY_AI_ASSIST",
      action: "READ_HISTORY",
      targetType: "INQUIRY_TICKET",
      outcome: "SUCCESS",
      resourceRef: "93200",
    },
  );
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

test("operation audit classifies AI assistant sessions and messages", () => {
  assert.deepEqual(
    operationAuditDescription(
      "POST",
      "/api/work-center/v1/ai-assistant/sessions",
      201,
    ),
    {
      eventType: "AI_ASSISTANT_SESSION_CREATED",
      capability: "AI_ASSISTANT",
      action: "CREATE_SESSION",
      targetType: "AI_ASSISTANT_SESSION",
      outcome: "SUCCESS",
      resourceRef: "",
    },
  );
  const message = operationAuditDescription(
    "POST",
    `/api/work-center/v1/ai-assistant/sessions/${conversationId}/messages`,
    202,
  );
  assert.equal(message.eventType, "AI_ASSISTANT_MESSAGE_SENT");
  assert.equal(message.capability, "AI_ASSISTANT");
  assert.equal(message.resourceRef, conversationId);
  const deleted = operationAuditDescription(
    "DELETE",
    `/api/work-center/v1/ai-assistant/sessions/${conversationId}`,
    200,
  );
  assert.equal(deleted.eventType, "AI_ASSISTANT_SESSION_DELETED");
  assert.equal(deleted.action, "DELETE_SESSION");
});
