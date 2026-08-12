import assert from "node:assert/strict";
import test from "node:test";
import {
  applySemanticTaskRouting,
  latestTaskState,
  resolveAssistantTaskRouting,
  routePolicyVersion,
  taskStateInstruction,
} from "./ai-assistant-routing.mjs";

const sessionModel = {
  id: "11111111-1111-4111-8111-111111111111",
  model: "gpt-5.6-terra",
  reasoningEffort: "HIGH",
};

test("初回 Task は Semantic Intent 確定まで一般状態で Session Model を固定使用する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "以下の文章を日本語に翻訳し、段落を維持してください。",
    modelSettings: sessionModel,
  });

  assert.equal(routing.routePolicyVersion, routePolicyVersion);
  assert.equal(routing.taskClass, "GENERAL_ASSIST");
  assert.equal(routing.targetLanguage, null);
  assert.deepEqual(routing.constraints, []);
  assert.equal(routing.tier, "SESSION");
  assert.equal(routing.modelSettingId, sessionModel.id);
  assert.equal(routing.model, sessionModel.model);
  assert.equal(routing.reasoningEffort, "high");
  assert.equal(routing.attemptNumber, 1);
  assert.equal(routing.selectionReason, "SESSION_STARTING_MODEL");
  assert.equal(routing.escalationReason, null);
});

test("後続本文は言語や本文内の語に依存せず直前 Task 状態を継続する", () => {
  const first = applySemanticTaskRouting(resolveAssistantTaskRouting({
    prompt: "Translate the following into Japanese.",
    modelSettings: sessionModel,
  }), {
    continues_previous_task: false,
    task_class: "TRANSLATION",
    objective_summary: "後続入力を日本語へ翻訳する",
    target_language: "ja",
    constraints: ["翻訳結果だけを出力する"],
  });
  const continued = resolveAssistantTaskRouting({
    prompt: "ME 会根据 OneOps 当前用户显示名解析 UPDS 真实负责人值。本次用户对应负责人值为 113210。",
    priorTasks: [{ routing: first }],
    modelSettings: sessionModel,
  });

  assert.equal(continued.taskClass, "TRANSLATION");
  assert.equal(continued.targetLanguage, "ja");
  assert.equal(continued.objectiveSummary, first.objectiveSummary);
  assert.equal(continued.continuationMode, "INHERITED");
  assert.equal(continued.model, first.model);
  assert.equal(continued.modelSettingId, first.modelSettingId);
  assert.equal(continued.selectionReason, "SESSION_STARTING_MODEL");
});

test("Semantic Intent は明示的な Task 切替だけを新しい状態として反映する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "Please investigate the operational risk.",
    modelSettings: sessionModel,
  });
  const classified = applySemanticTaskRouting(routing, {
    continues_previous_task: false,
    task_class: "COMPLEX_ANALYSIS",
    objective_summary: "運用上の危険を分析する",
    target_language: null,
    constraints: [],
  });

  assert.equal(classified.taskClass, "COMPLEX_ANALYSIS");
  assert.equal(classified.continuationMode, "NEW_OR_UPDATED");
});

test("同一入力の再実行回数を記録し Session Model を維持する", () => {
  const first = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    modelSettings: sessionModel,
  });
  const second = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    priorTasks: [{ routing: first }],
    modelSettings: sessionModel,
  });
  const third = resolveAssistantTaskRouting({
    prompt: "Translate this sentence into Japanese: Service unavailable.",
    priorTasks: [{ routing: first }, { routing: second }],
    modelSettings: sessionModel,
  });

  assert.equal(second.attemptNumber, 2);
  assert.equal(third.attemptNumber, 3);
  assert.equal(second.tier, "SESSION");
  assert.equal(third.tier, "SESSION");
  assert.equal(second.model, sessionModel.model);
  assert.equal(third.model, sessionModel.model);
});

test("問合せ Context は専用 Task 分類となり Session Model を使用する", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "この問合せへの回答案を作成してください。",
    inquiryContext: { question: "接続できません。" },
    modelSettings: sessionModel,
  });

  assert.equal(routing.taskClass, "INQUIRY_ANALYSIS");
  assert.equal(routing.model, sessionModel.model);
  assert.equal(routing.reasoningEffort, "high");
});

test("保存済み Routing JSON から最新 Task 状態を取得する", () => {
  const older = { taskClass: "SUMMARIZATION" };
  const latest = { taskClass: "CLASSIFICATION" };
  assert.equal(
    latestTaskState([{ routing: older }, { routing: latest }]),
    latest,
  );
  assert.equal(latestTaskState([]), null);
});

test("Task 状態 Instruction は内部状態を固定 Prompt として渡す", () => {
  const routing = resolveAssistantTaskRouting({
    prompt: "短く要約してください。",
    modelSettings: sessionModel,
  });
  const instruction = taskStateInstruction(routing);

  assert.match(instruction, /OneOps が確定した会話内 Task 状態/);
  assert.match(instruction, /GENERAL_ASSIST/);
  assert.match(instruction, /内部項目名/);
});

test("Session 起始 Model が無効な場合は安定 Error Code を返す", () => {
  assert.throws(
    () => resolveAssistantTaskRouting({
      prompt: "回答してください。",
      modelSettings: { ...sessionModel, reasoningEffort: "LOW" },
    }),
    { code: "AI_ASSISTANT_CONFIGURATION_REQUIRED" },
  );
});
