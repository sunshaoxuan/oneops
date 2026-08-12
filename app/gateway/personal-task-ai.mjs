import { randomUUID } from "node:crypto";
import { resolveAssistantTaskRouting } from "./ai-assistant-routing.mjs";

export function buildPersonalTaskPrompt(task) {
  return [
    "以下は OneOps の個人タスクです。",
    "利用者の記述を根拠として、現状の要約、次に行う具体的な作業、確認すべきリスク、必要に応じたサブタスク案を日本語で提示してください。",
    "提案は利用者が確認するまで OneOps のタスクを変更しません。",
    "",
    `タスク名: ${task.title}`,
    `種別: ${task.taskType}`,
    `状態: ${task.status}`,
    task.description ? `説明:\n${task.description}` : "",
    task.automationPrompt
      ? `利用者が指定した Prompt:\n${task.automationPrompt}`
      : "",
    task.sourceLink
      ? `外部参照: ${task.sourceLink.providerCode} ${task.sourceLink.externalKey} / 状態 ${task.sourceLink.externalStatus}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function configurationError(message) {
  return Object.assign(new Error(message), {
    code: "PERSONAL_TASK_AI_CONFIGURATION_REQUIRED",
  });
}

function availableStartingModel(setting) {
  return Boolean(
    setting?.id &&
    setting.purpose === "GENERAL" &&
    setting.provider === "OPENAI" &&
    setting.enabled &&
    setting.model &&
    ["XHIGH", "HIGH", "MEDIUM"].includes(setting.reasoningEffort) &&
    ["FAST", "MEDIUM", "SLOW"].includes(setting.speedLevel),
  );
}

export function createPersonalTaskPromptService({
  repository,
  aiAssistantRepository,
  modelSettingsRepository,
  taskRunner,
  idFactory = randomUUID,
  logger,
}) {
  async function execute(ownerUserId, task, triggerType) {
    const run = await repository.createPromptRun(
      ownerUserId,
      task.id,
      triggerType,
    );
    if (!run) {
      const error = new Error("Personal task was not found.");
      error.code = "PERSONAL_TASK_NOT_FOUND";
      throw error;
    }
    let assistantSessionId = null;
    let assistantTaskId = null;
    try {
      if (!taskRunner?.start) {
        throw configurationError("Personal task GPT runner is unavailable.");
      }
      const startingModel = await modelSettingsRepository
        ?.getDefaultAssistantModel();
      if (!availableStartingModel(startingModel)) {
        throw configurationError(
          "Personal task AI requires one enabled default GPT model.",
        );
      }

      const conversationId = idFactory();
      const title = `タスク: ${String(task.title ?? "").trim() || "個人タスク"}`
        .slice(0, 255);
      const session = await aiAssistantRepository.create({
        conversationId,
        ownerUserId,
        title,
        modelSettingId: startingModel.id,
        modelSnapshot: startingModel.model,
        reasoningEffortSnapshot: startingModel.reasoningEffort,
        speedLevelSnapshot: startingModel.speedLevel,
      });
      assistantSessionId = session.id;
      const prompt = buildPersonalTaskPrompt(task);
      const routing = resolveAssistantTaskRouting({
        prompt,
        priorTasks: [],
        attachments: [],
        modelSettings: startingModel,
      });
      const assistantTask = await aiAssistantRepository.createTask({
        id: idFactory(),
        conversationId: session.id,
        ownerUserId,
        prompt,
        routing,
        requestId: `personal-task:${run.id}`,
      });
      assistantTaskId = assistantTask.id;
      const completed = await repository.completePromptRun(
        ownerUserId,
        run.id,
        {
          assistantSessionId: session.id,
          assistantTaskId: assistantTask.id,
          message:
            "AIアシスタントに分析を依頼しました。結果は同じ会話で確認できます。",
        },
      );
      void taskRunner.start(assistantTask.id);
      return {
        run: completed,
        assistantSessionId: session.id,
        assistantTaskId: assistantTask.id,
      };
    } catch (error) {
      if (assistantTaskId) {
        await aiAssistantRepository.failTask(
          assistantTaskId,
          error?.code ?? "PERSONAL_TASK_AI_START_FAILED",
          "Personal task AI request could not start.",
        ).catch(async (finalizationError) => {
          await logger?.("error", "personal task AI task finalization failed", {
            taskId: assistantTaskId,
            code: finalizationError?.code ?? "PERSONAL_TASK_AI_FINALIZATION_FAILED",
          });
        });
      } else if (assistantSessionId && aiAssistantRepository.remove) {
        await aiAssistantRepository.remove(
          assistantSessionId,
          ownerUserId,
        ).catch(async (cleanupError) => {
          await logger?.("warn", "empty personal task AI session cleanup failed", {
            sessionId: assistantSessionId,
            code: cleanupError?.code ?? "PERSONAL_TASK_AI_SESSION_CLEANUP_FAILED",
          });
        });
      }
      await repository.failPromptRun(ownerUserId, run.id, error);
      throw error;
    }
  }

  return {
    execute,
    async executeDuePrompts() {
      const due = await repository.listDuePromptTasks();
      for (const item of due) {
        try {
          await execute(item.ownerUserId, item.task, "SCHEDULED");
        } catch (error) {
          await logger?.("warn", "scheduled personal task prompt failed", {
            taskId: item.task.id,
            code: error?.code ?? "PERSONAL_TASK_PROMPT_FAILED",
          });
        }
      }
    },
  };
}
