import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAssistantTaskRouting,
  taskStateFromCagPrompt,
  taskStatePromptSection,
} from "./ai-assistant-routing.mjs";

const models = {
  simpleModelSettings: {
    id: "11111111-1111-4111-8111-111111111111",
    model: "gpt-5.6-luna",
  },
  generalModelSettings: {
    id: "22222222-2222-4222-8222-222222222222",
    model: "gpt-5.6-terra",
  },
  gatewaySettingId: "33333333-3333-4333-8333-333333333333",
};

function taskWithState(state) {
  return {
    prompt: [
      ...taskStatePromptSection(state),
      "[USER_MESSAGE]",
      "利用者入力",
    ].join("\n"),
  };
}

test("初回の翻訳作業は SIMPLE Model を選択する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "以下の文章を日本語に翻訳し、段落を維持してください。",
    ...models,
  });

  assert.equal(routing.taskClass, "TRANSLATION");
  assert.equal(routing.targetLanguage, "ja");
  assert.deepEqual(routing.constraints, ["原文の構造と書式を維持する"]);
  assert.equal(routing.tier, "SIMPLE");
  assert.equal(routing.model, "gpt-5.6-luna");
  assert.equal(routing.reasoningEffort, "low");
  assert.equal(routing.attemptNumber, 1);
  assert.equal(routing.selectionReason, "LIGHT_TASK_INITIAL_ROUTE");
});

test("後続の本文は会話内の翻訳 Task Summary を継続する", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "以下の文章を日本語に翻訳してください。",
    ...models,
  });
  const continued = resolveAssistantTaskRouting({
    prompt: "The service will restart at midnight.",
    priorTasks: [taskWithState(first)],
    ...models,
  });

  assert.equal(continued.taskClass, "TRANSLATION");
  assert.equal(continued.targetLanguage, "ja");
  assert.equal(continued.objectiveSummary, first.objectiveSummary);
  assert.equal(continued.continuationMode, "INHERITED");
  assert.equal(continued.tier, "SIMPLE");
  assert.equal(continued.model, "gpt-5.6-luna");
  assert.equal(continued.selectionReason, "SESSION_TASK_CONTINUATION");
});

test("継続翻訳の明示は既存の翻訳先と言語制約を維持する", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "日本語に翻訳し、段落を維持してください。",
    ...models,
  });
  const continued = resolveAssistantTaskRouting({
    prompt: "続けて翻訳してください。The service is available.",
    priorTasks: [taskWithState(first)],
    ...models,
  });

  assert.equal(continued.taskClass, "TRANSLATION");
  assert.equal(continued.targetLanguage, "ja");
  assert.deepEqual(continued.constraints, ["原文の構造と書式を維持する"]);
  assert.equal(continued.continuationMode, "INHERITED");
});

test("同一 Task Fingerprint の再実行は一段階だけ GENERAL へ昇格する", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    ...models,
  });
  const second = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    priorTasks: [taskWithState(first)],
    ...models,
  });
  const third = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    priorTasks: [taskWithState(first), taskWithState(second)],
    ...models,
  });

  assert.equal(second.attemptNumber, 2);
  assert.equal(second.tier, "GENERAL");
  assert.equal(second.model, "gpt-5.6-terra");
  assert.equal(second.escalationReason, "SAME_TASK_FINGERPRINT_REPEATED");
  assert.equal(third.attemptNumber, 3);
  assert.equal(third.tier, "GENERAL");
  assert.equal(third.model, "gpt-5.6-terra");
});

test("問合せ全体分析は初回から GENERAL Model を選択する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "問題点と回答方針を整理してください。",
    inquiryContext: { ticketNo: "38950" },
    ...models,
  });

  assert.equal(routing.taskClass, "INQUIRY_ANALYSIS");
  assert.equal(routing.tier, "GENERAL");
  assert.equal(routing.model, "gpt-5.6-terra");
  assert.equal(routing.selectionReason, "HEAVY_TASK_INITIAL_ROUTE");
});

test("Task State marker は Prompt から復元できる", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "短く要約してください。",
    ...models,
  });
  const prompt = taskWithState(routing).prompt;

  assert.deepEqual(taskStateFromCagPrompt(prompt), routing);
});
