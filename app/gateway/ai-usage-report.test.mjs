import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProviderUsage } from "./ai-usage-report-database.mjs";
import { createAiUsageReportRouteHandler } from "./ai-usage-report-routes.mjs";

test("Provider Usage は詳細 Token を正規化する", () => {
  assert.deepEqual(
    normalizeProviderUsage({
      input_tokens: 120,
      output_tokens: 30,
      total_tokens: 150,
      input_tokens_details: { cached_tokens: 80 },
      output_tokens_details: { reasoning_tokens: 12 },
    }),
    {
      reported: true,
      inputTokens: 120,
      outputTokens: 30,
      cachedInputTokens: 80,
      reasoningTokens: 12,
      totalTokens: 150,
      raw: {
        input_tokens: 120,
        output_tokens: 30,
        total_tokens: 150,
        input_tokens_details: { cached_tokens: 80 },
        output_tokens_details: { reasoning_tokens: 12 },
      },
    },
  );
});

test("Provider が Usage を返さない場合も未報告として保持する", () => {
  assert.equal(normalizeProviderUsage(null).reported, false);
});

test("AI Token 使用量 API は期間を限定して順位を返す", async () => {
  const calls = [];
  const handler = createAiUsageReportRouteHandler({
    repository: {
      async rankedUsage(days) {
        calls.push(days);
        return [{ rank: 1, displayName: "管理者", totalTokens: 500 }];
      },
    },
    sendJson(_response, status, payload) {
      calls.push({ status, payload });
    },
  });
  const handled = await handler(
    { method: "GET" },
    {},
    new URL("http://localhost/api/work-center/v1/reports/ai-token-usage?days=30"),
  );
  assert.equal(handled, true);
  assert.equal(calls[0], 30);
  assert.equal(calls[1].status, 200);
  assert.equal(calls[1].payload.rows[0].rank, 1);
});

test("AI Token 使用量 API は未許可の期間を拒否する", async () => {
  let status = null;
  const handler = createAiUsageReportRouteHandler({
    repository: { async rankedUsage() { throw new Error("not called"); } },
    sendJson(_response, nextStatus) { status = nextStatus; },
  });
  await handler(
    { method: "GET" },
    {},
    new URL("http://localhost/api/work-center/v1/reports/ai-token-usage?days=1"),
  );
  assert.equal(status, 400);
});
