import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAssistantTaskRouting,
  taskStateFromCagPrompt,
  taskStatePromptSection,
} from "./ai-assistant-routing.mjs";

const sessionModel = {
  startingModel: {
    id: "22222222-2222-4222-8222-222222222222",
    model: "gpt-5.6-terra",
    reasoningEffort: "HIGH",
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

test("初回の翻訳作業は会話の開始 Model を選択する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "以下の文章を日本語に翻訳し、段落を維持してください。",
    ...sessionModel,
  });

  assert.equal(routing.taskClass, "TRANSLATION");
  assert.equal(routing.targetLanguage, "ja");
  assert.deepEqual(routing.constraints, ["原文の構造と書式を維持する"]);
  assert.equal(routing.model, "gpt-5.6-terra");
  assert.equal(routing.reasoningEffort, "high");
  assert.equal(routing.attemptNumber, 1);
  assert.equal(routing.selectionReason, "SESSION_STARTING_MODEL");
});

test("後続の本文は翻訳状態と会話の開始 Model を継続する", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "以下の文章を日本語に翻訳してください。",
    ...sessionModel,
  });
  const continued = resolveAssistantTaskRouting({
    prompt: "The service will restart at midnight.",
    priorTasks: [taskWithState(first)],
    ...sessionModel,
  });

  assert.equal(continued.taskClass, "TRANSLATION");
  assert.equal(continued.targetLanguage, "ja");
  assert.equal(continued.objectiveSummary, first.objectiveSummary);
  assert.equal(continued.continuationMode, "INHERITED");
  assert.equal(continued.model, first.model);
  assert.equal(continued.modelSettingId, first.modelSettingId);
  assert.equal(continued.selectionReason, "SESSION_TASK_CONTINUATION");
});

test("同一入力の再実行でも開始 Model を変更しない", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    ...sessionModel,
  });
  const second = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    priorTasks: [taskWithState(first)],
    ...sessionModel,
  });

  assert.equal(second.attemptNumber, 2);
  assert.equal(second.model, first.model);
  assert.equal(second.modelSettingId, first.modelSettingId);
  assert.equal("tier" in second, false);
  assert.equal("escalationReason" in second, false);
});

test("Task State marker は Prompt から復元できる", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "短く要約してください。",
    ...sessionModel,
  });
  const prompt = taskWithState(routing).prompt;

  assert.deepEqual(taskStateFromCagPrompt(prompt), routing);
});
