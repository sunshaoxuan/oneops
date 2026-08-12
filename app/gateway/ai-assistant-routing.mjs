import { createHash } from "node:crypto";

export const routePolicyVersion = "oneops-ai-direct-gpt-v1";

const languageDefinitions = [
  { code: "ja", label: "日本語", pattern: /日本語|日文|日语|日語|japanese/i },
  { code: "zh", label: "中国語", pattern: /中国語|中文|汉语|漢語|chinese/i },
  { code: "en", label: "英語", pattern: /英語|英文|英语|英語|english/i },
  { code: "ko", label: "韓国語", pattern: /韓国語|韩语|韓語|korean/i },
  { code: "fr", label: "フランス語", pattern: /フランス語|法语|法語|french/i },
  { code: "de", label: "ドイツ語", pattern: /ドイツ語|德语|德語|german/i },
  { code: "es", label: "スペイン語", pattern: /スペイン語|西班牙语|西班牙語|spanish/i },
];

function normalizedText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function targetLanguage(prompt) {
  return languageDefinitions.find((definition) =>
    definition.pattern.test(prompt)
  ) ?? null;
}

function translationConstraints(prompt) {
  const constraints = [];
  if (/格式|書式|段落|列表|箇条書き|表格|表の|format|layout/i.test(prompt)) {
    constraints.push("原文の構造と書式を維持する");
  }
  if (/术语|術語|用語|glossary|terminology/i.test(prompt)) {
    constraints.push("指定された用語を維持する");
  }
  if (/不要解释|説明不要|翻译だけ|翻訳のみ|translation only/i.test(prompt)) {
    constraints.push("翻訳結果だけを出力する");
  }
  return constraints;
}

function classifyExplicitTask(prompt, inquiryContext) {
  if (inquiryContext) {
    return {
      taskClass: "INQUIRY_ANALYSIS",
      objectiveSummary: "問合せ全体の経緯と根拠を分析する",
      targetLanguage: null,
      constraints: ["問合せ全体の記録を判断根拠として使用する"],
    };
  }
  if (/翻訳|翻译|翻譯|译成|譯成|translate/i.test(prompt)) {
    const language = targetLanguage(prompt);
    return {
      taskClass: "TRANSLATION",
      objectiveSummary: language
        ? `後続の入力を${language.label}へ翻訳する`
        : "後続の入力を最初に指定された言語へ翻訳する",
      targetLanguage: language?.code ?? null,
      constraints: translationConstraints(prompt),
    };
  }
  if (/要約|摘要|总结|總結|summari[sz]e|summary/i.test(prompt)) {
    return {
      taskClass: "SUMMARIZATION",
      objectiveSummary: "後続の入力を簡潔に要約する",
      targetLanguage: null,
      constraints: [],
    };
  }
  if (/分類|分类|分類する|タグ付け|classif|categor/i.test(prompt)) {
    return {
      taskClass: "CLASSIFICATION",
      objectiveSummary: "後続の入力を指定された基準で分類する",
      targetLanguage: null,
      constraints: [],
    };
  }
  if (
    /調査|调查|調べ|検索|搜索|查找|実装|开发|開発|修正|修复|ファイル|文件|ブラウザ|浏览器|実行|执行|workspace|repository|リポジトリ/i.test(prompt)
  ) {
    return {
      taskClass: "AGENT_OPERATION",
      objectiveSummary: normalizedText(prompt).slice(0, 500),
      targetLanguage: null,
      constraints: [],
    };
  }
  if (/分析|解析|評価|审查|審査|review|investigat/i.test(prompt)) {
    return {
      taskClass: "COMPLEX_ANALYSIS",
      objectiveSummary: normalizedText(prompt).slice(0, 500),
      targetLanguage: null,
      constraints: [],
    };
  }
  return null;
}

function stateFingerprint(state, prompt, attachments) {
  return createHash("sha256").update(JSON.stringify({
    taskClass: state.taskClass,
    targetLanguage: state.targetLanguage,
    constraints: state.constraints,
    prompt: normalizedText(prompt).toLocaleLowerCase("und"),
    attachments: (Array.isArray(attachments) ? attachments : []).map(
      (attachment) => ({
        sha256: String(attachment?.sha256 ?? ""),
        name: String(attachment?.name ?? ""),
      }),
    ),
  })).digest("hex");
}

function configuredModel(settings, label) {
  if (
    !settings?.id ||
    !settings?.model ||
    !["XHIGH", "HIGH", "MEDIUM"].includes(settings?.reasoningEffort)
  ) {
    throw Object.assign(
      new Error(`${label} model is required for AI task routing.`),
      { code: "AI_ASSISTANT_CONFIGURATION_REQUIRED" },
    );
  }
  return {
    id: String(settings.id),
    model: String(settings.model),
    reasoningEffort: String(settings.reasoningEffort).toLowerCase(),
  };
}

export function latestTaskState(tasks) {
  const values = Array.isArray(tasks) ? tasks : tasks?.items ?? [];
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const state = values[index]?.routing;
    if (state && typeof state === "object") return state;
  }
  return null;
}

export function resolveAssistantTaskRouting({
  prompt,
  inquiryContext = null,
  priorTasks = [],
  attachments = [],
  modelSettings,
}) {
  const explicitTask = classifyExplicitTask(prompt, inquiryContext);
  const previousState = latestTaskState(priorTasks);
  const continuesSameClass = Boolean(
    explicitTask
      && previousState
      && explicitTask.taskClass === previousState.taskClass,
  );
  const inherited = Boolean(previousState) && (!explicitTask || continuesSameClass);
  const taskDefinition = explicitTask
    ? {
        ...explicitTask,
        objectiveSummary: continuesSameClass && !explicitTask.targetLanguage
          ? previousState.objectiveSummary
          : explicitTask.objectiveSummary,
        targetLanguage: explicitTask.targetLanguage
          ?? (continuesSameClass ? previousState.targetLanguage : null),
        constraints: explicitTask.constraints.length
          ? explicitTask.constraints
          : continuesSameClass && Array.isArray(previousState.constraints)
            ? previousState.constraints
            : [],
      }
    : (previousState
    ? {
        taskClass: previousState.taskClass,
        objectiveSummary: previousState.objectiveSummary,
        targetLanguage: previousState.targetLanguage ?? null,
        constraints: Array.isArray(previousState.constraints)
          ? previousState.constraints
          : [],
      }
    : {
        taskClass: "GENERAL_ASSIST",
        objectiveSummary: "利用者の入力へ簡潔に応答する",
        targetLanguage: null,
        constraints: [],
      });
  const fingerprint = stateFingerprint(taskDefinition, prompt, attachments);
  const priorStates = (Array.isArray(priorTasks) ? priorTasks : [])
    .map((task) => task?.routing)
    .filter(Boolean);
  const attemptNumber = priorStates.filter(
    (state) => state.taskFingerprint === fingerprint,
  ).length + 1;
  const selected = configuredModel(modelSettings, "SESSION");

  return {
    routePolicyVersion,
    taskClass: taskDefinition.taskClass,
    objectiveSummary: taskDefinition.objectiveSummary,
    targetLanguage: taskDefinition.targetLanguage,
    constraints: taskDefinition.constraints,
    continuationMode: inherited ? "INHERITED" : "NEW_OR_UPDATED",
    taskFingerprint: fingerprint,
    attemptNumber,
    tier: "SESSION",
    modelSettingId: selected.id,
    model: selected.model,
    reasoningEffort: selected.reasoningEffort,
    selectionReason: "SESSION_STARTING_MODEL",
    escalationReason: null,
  };
}

export function taskStateInstruction(taskState) {
  return [
    "OneOps が確定した会話内 Task 状態を次に示します。",
    JSON.stringify(taskState),
    "利用者が新しい作業を明示するまで objectiveSummary、targetLanguage、constraints を後続入力へ適用してください。内部項目名、物理 ID、Model 名及び Routing 理由は回答へ表示しないでください。",
  ].join("\n");
}
