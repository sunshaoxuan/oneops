import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import {
  assistantInstructions,
  assistantModelInput,
  createAiAssistantOpenAiRunner,
  responseEvents,
  responsesUrl,
} from "./ai-assistant-openai.mjs";

async function collectEvents(body) {
  const values = [];
  for await (const event of responseEvents(body)) values.push(event);
  return values;
}

test("Responses Endpoint は OpenAI 互換 API Root から構成する", () => {
  assert.equal(
    responsesUrl("https://models.example.test/v1/"),
    "https://models.example.test/v1/responses",
  );
  assert.equal(
    responsesUrl("https://models.example.test/v1/responses"),
    "https://models.example.test/v1/responses",
  );
});

test("64 KiB を超える単一 GPT SSE Event を欠落なく処理する", async () => {
  const delta = "応".repeat(30_000);
  const encoded = `data: ${JSON.stringify({
    type: "response.output_text.delta",
    delta,
  })}\n\n`;
  assert.ok(Buffer.byteLength(encoded, "utf8") > 64 * 1024);

  const events = await collectEvents(Readable.from([Buffer.from(encoded)]));

  assert.equal(events.length, 1);
  assert.equal(events[0].delta, delta);
});

test("一つの Network Chunk に含まれる多数の小 Event は合計 4 MiB を超えても処理する", async () => {
  const event = `data: ${JSON.stringify({
    type: "response.output_text.delta",
    delta: "a".repeat(900),
  })}\n\n`;
  const count = Math.ceil((4 * 1024 * 1024 + 1) / Buffer.byteLength(event));
  const encoded = event.repeat(count);
  assert.ok(Buffer.byteLength(encoded) > 4 * 1024 * 1024);

  const events = await collectEvents(Readable.from([Buffer.from(encoded)]));

  assert.equal(events.length, count);
  assert.equal(events.at(-1).delta.length, 900);
});

test("4 MiB を超える単一 GPT SSE Event は安定 Error Code で拒否する", async () => {
  const encoded = `data: ${JSON.stringify({
    type: "response.output_text.delta",
    delta: "a".repeat(4 * 1024 * 1024),
  })}\n\n`;

  await assert.rejects(
    () => collectEvents(Readable.from([Buffer.from(encoded)])),
    { code: "AI_ASSISTANT_MODEL_STREAM_TOO_LARGE" },
  );
});

test("Quick Assistant 指示、Task 状態、履歴及び添付を Responses Input へ固定する", () => {
  const task = {
    prompt: "この資料を要約してください。",
    inquiryContext: { question: "障害の発生時刻はいつですか。" },
    routing: { taskClass: "SUMMARIZATION", objectiveSummary: "資料を要約する" },
  };
  const instructions = assistantInstructions(task, "三行以内で要約する。");
  assert.match(instructions, /三行以内で要約する/);
  assert.match(instructions, /SUMMARIZATION/);

  const input = assistantModelInput(
    [{
      prompt: "前の質問",
      inquiryContext: null,
      providerOutput: [{ type: "reasoning", encrypted_content: "sealed" }],
    }],
    task,
    [{
      id: "attachment-1",
      name: "資料.txt",
      contentType: "text/plain",
      data: Buffer.from("内容", "utf8"),
    }, {
      id: "attachment-2",
      name: "図.png",
      contentType: "image/png",
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    }],
  );
  assert.equal(input[0].role, "user");
  assert.equal(input[1].type, "reasoning");
  assert.equal(input.at(-1).content[1].type, "input_file");
  assert.match(input.at(-1).content[1].file_data, /^data:text\/plain;base64,/);
  assert.equal(input.at(-1).content[2].type, "input_image");
  assert.match(input.at(-1).content[2].image_url, /^data:image\/png;base64,/);
});

test("意図分析の構造化結果は固定 Schema を満たす場合だけ受け付ける", async () => {
  const { parseIntentAnalysisResponse } = await import("./ai-assistant-openai.mjs");
  assert.deepEqual(
    parseIntentAnalysisResponse({
      output_text: JSON.stringify({
        references_previous_context: true,
        context_scope: "conversation",
        intent_summary: "continue",
      }),
    }),
    {
      references_previous_context: true,
      context_scope: "conversation",
      intent_summary: "continue",
    },
  );
  assert.throws(
    () => parseIntentAnalysisResponse({ output_text: "not-json" }),
    { code: "AI_ASSISTANT_INTENT_ANALYSIS_INVALID" },
  );
});

function runnerFixture({ fetchImpl, onAppendTaskDelta = null }) {
  const calls = {
    deltas: [],
    completed: [],
    failed: [],
    historyRequests: [],
    responseIds: [],
    intents: [],
    usageStarted: [],
    usageCompleted: [],
    usageFailed: [],
  };
  const task = {
    id: "11111111-1111-4111-8111-111111111111",
    conversation_id: "22222222-2222-4222-8222-222222222222",
    status: "queued",
    prompt: "日本語で回答してください。",
    inquiryContext: null,
    attachments: [],
    routing: { taskClass: "GENERAL_ASSIST" },
    modelSettingId: "33333333-3333-4333-8333-333333333333",
    model: "gpt-example",
    reasoningEffort: "HIGH",
  };
  const repository = {
    async executionContext() {
      return {
        task,
        ownerUserId: "44444444-4444-4444-8444-444444444444",
        shortcutPromptSnapshot: "簡潔に回答する。",
      };
    },
    async markTaskRunning() {
      task.status = "running";
      return { ...task };
    },
    async modelHistory(...args) {
      calls.historyRequests.push(args);
      return [];
    },
    async setProviderResponseId(_taskId, responseId) {
      calls.responseIds.push(responseId);
    },
    async setIntentAnalysis(_taskId, analysis) {
      calls.intents.push(analysis);
      return true;
    },
    async appendTaskDelta(_taskId, delta) {
      calls.deltas.push(delta);
      const accepted = await onAppendTaskDelta?.(delta);
      return accepted ?? true;
    },
    async completeTask(...args) { calls.completed.push(args); },
    async failTask(...args) { calls.failed.push(args); },
  };
  const modelSettingsRepository = {
    async getById() {
      return {
        id: task.modelSettingId,
        enabled: true,
        provider: "OPENAI",
        endpoint: "https://models.example.test/v1",
      };
    },
    async getApiKey() { return "test-api-key"; },
  };
  const usageRepository = {
    async startCall(value) { calls.usageStarted.push(value); },
    async completeCall(...args) { calls.usageCompleted.push(args); },
    async failCall(...args) { calls.usageFailed.push(args); },
  };
  let intentRequest = null;
  let intentCompleted = false;
  const wrappedFetch = async (url, options) => {
    if (!intentCompleted) {
      intentCompleted = true;
      intentRequest = { url: String(url), options };
      return new Response(JSON.stringify({
        output_text: JSON.stringify({
          references_previous_context: true,
          context_scope: "conversation",
          intent_summary: "continue",
        }),
        usage: { input_tokens: 4, output_tokens: 2, total_tokens: 6 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return fetchImpl(url, options);
  };
  return {
    calls,
    intentRequest: () => intentRequest,
    task,
    runner: createAiAssistantOpenAiRunner({
      repository,
      modelSettingsRepository,
      usageRepository,
      attachmentStore: null,
      fetchImpl: wrappedFetch,
      executionTimeoutMs: 5_000,
    }),
  };
}

test("Responses SSE を Delta と Completed の一意な終端へ保存する", async () => {
  let request = null;
  const completedResponse = {
    id: "resp_123",
    output: [{
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "回答です。" }],
    }],
    usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
  };
  const sse = [
    { type: "response.created", response: { id: "resp_123" } },
    { type: "response.output_text.delta", delta: "回答" },
    { type: "response.output_text.delta", delta: "です。" },
    { type: "response.completed", response: completedResponse },
  ].map((value) => `data: ${JSON.stringify(value)}\n\n`).join("");
  const fixture = runnerFixture({
    fetchImpl: async (url, options) => {
      request = { url: String(url), options };
      return new Response(sse, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    },
  });

  await fixture.runner.start(fixture.task.id);

  assert.equal(request.url, "https://models.example.test/v1/responses");
  assert.equal(request.options.headers.Authorization, "Bearer test-api-key");
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "gpt-example");
  assert.equal(body.reasoning.effort, "high");
  assert.equal(body.store, false);
  assert.equal(body.stream, true);
  assert.deepEqual(fixture.calls.historyRequests, [[fixture.task.id]]);
  assert.deepEqual(fixture.calls.deltas, ["回答です。"]);
  assert.deepEqual(fixture.calls.responseIds, ["resp_123"]);
  assert.equal(fixture.calls.completed.length, 1);
  assert.equal(fixture.calls.completed[0][1], "回答です。");
  assert.deepEqual(fixture.calls.completed[0][4], completedResponse.output);
  assert.deepEqual(fixture.calls.failed, []);
  assert.deepEqual(
    fixture.calls.usageStarted.map((call) => call.phase),
    ["INTENT_ANALYSIS", "RESPONSE"],
  );
  assert.equal(fixture.calls.usageCompleted.length, 2);
  assert.deepEqual(fixture.calls.usageCompleted[0][1], {
    input_tokens: 4,
    output_tokens: 2,
    total_tokens: 6,
  });
  assert.deepEqual(fixture.calls.usageCompleted[1][1], completedResponse.usage);
  assert.deepEqual(fixture.calls.usageFailed, []);
});

test("Runner Stop は同期 Responses 接続を中断して終端処理を開始する", async () => {
  let started;
  const startedPromise = new Promise((resolve) => { started = resolve; });
  const fixture = runnerFixture({
    fetchImpl: async (_url, options) => {
      started();
      await new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        }, { once: true });
      });
    },
  });

  const running = fixture.runner.start(fixture.task.id);
  await startedPromise;
  assert.equal(fixture.runner.cancel(fixture.task.id), true);
  await running;

  assert.equal(fixture.calls.completed.length, 0);
  assert.equal(fixture.calls.failed.length, 1);
  assert.equal(fixture.calls.failed[0][1], "AI_ASSISTANT_MODEL_REQUEST_CANCELLED");
  assert.deepEqual(fixture.runner.activeTaskIds(), []);
});

test("Runner Stop は Buffer 済み Responses Event の追加処理を停止する", async () => {
  let firstDeltaStarted;
  let releaseFirstDelta;
  const firstDeltaStartedPromise = new Promise((resolve) => {
    firstDeltaStarted = resolve;
  });
  const releaseFirstDeltaPromise = new Promise((resolve) => {
    releaseFirstDelta = resolve;
  });
  const bufferedDelta = "応".repeat(171);
  const completedResponse = {
    id: "resp_buffered",
    output: [{
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: `${bufferedDelta}未保存` }],
    }],
    usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
  };
  const sse = [
    { type: "response.created", response: { id: "resp_buffered" } },
    { type: "response.output_text.delta", delta: bufferedDelta },
    { type: "response.output_text.delta", delta: "未保存" },
    { type: "response.completed", response: completedResponse },
  ].map((value) => `data: ${JSON.stringify(value)}\n\n`).join("");
  const fixture = runnerFixture({
    fetchImpl: async () => new Response(sse, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }),
    async onAppendTaskDelta() {
      firstDeltaStarted();
      await releaseFirstDeltaPromise;
    },
  });

  const running = fixture.runner.start(fixture.task.id);
  await firstDeltaStartedPromise;
  assert.equal(fixture.runner.cancel(fixture.task.id), true);
  releaseFirstDelta();
  await running;

  assert.deepEqual(fixture.calls.deltas, [bufferedDelta]);
  assert.equal(fixture.calls.completed.length, 0);
  assert.equal(fixture.calls.failed.length, 1);
  assert.equal(
    fixture.calls.failed[0][1],
    "AI_ASSISTANT_MODEL_REQUEST_CANCELLED",
  );
  assert.deepEqual(fixture.runner.activeTaskIds(), []);
});

test("Local Ledger の Cancel Marker は Signal 競合時も Buffer 処理を停止する", async () => {
  const firstDelta = "応".repeat(171);
  const sse = [
    { type: "response.output_text.delta", delta: firstDelta },
    { type: "response.output_text.delta", delta: "未保存" },
    {
      type: "response.completed",
      response: {
        id: "resp_ledger_cancelled",
        output: [],
        usage: {},
      },
    },
  ].map((value) => `data: ${JSON.stringify(value)}\n\n`).join("");
  const fixture = runnerFixture({
    fetchImpl: async () => new Response(sse, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }),
    async onAppendTaskDelta() { return false; },
  });

  await fixture.runner.start(fixture.task.id);

  assert.deepEqual(fixture.calls.deltas, [firstDelta]);
  assert.equal(fixture.calls.completed.length, 0);
  assert.equal(fixture.calls.failed.length, 1);
  assert.equal(
    fixture.calls.failed[0][1],
    "AI_ASSISTANT_MODEL_REQUEST_CANCELLED",
  );
});
