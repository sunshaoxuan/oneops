import { createHash } from "node:crypto";

export const routePolicyVersion = "oneops-ai-semantic-intent-v3";

function normalizedText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function inquiryTask(inquiryContext) {
  if (inquiryContext) {
    return {
      taskClass: "INQUIRY_ANALYSIS",
      objectiveSummary: "問合せ全体の経緯と根拠を分析する",
      targetLanguage: null,
      constraints: ["問合せ全体の記録を判断根拠として使用する"],
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

export function applySemanticTaskRouting(
  routing,
  intentAnalysis,
  prompt = "",
  attachments = [],
) {
  const taskDefinition = {
    taskClass: String(intentAnalysis.task_class),
    objectiveSummary: String(intentAnalysis.objective_summary),
    targetLanguage: intentAnalysis.target_language == null
      ? null
      : String(intentAnalysis.target_language),
    constraints: Array.isArray(intentAnalysis.constraints)
      ? intentAnalysis.constraints.map(String)
      : [],
  };
  return {
    ...routing,
    ...taskDefinition,
    continuationMode: intentAnalysis.continues_previous_task
      ? "INHERITED"
      : "NEW_OR_UPDATED",
    taskFingerprint: stateFingerprint(taskDefinition, prompt, attachments),
  };
}

export function resolveAssistantTaskRouting({
  prompt,
  inquiryContext = null,
  priorTasks = [],
  attachments = [],
  modelSettings,
}) {
  const explicitTask = inquiryTask(inquiryContext);
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
