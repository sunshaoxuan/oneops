import { agentGatewayHeaders } from "./agent-gateway-settings.mjs";

const jsonLimitBytes = 1_048_576;

async function gatewayJson(
  gateway,
  path,
  options = {},
  fetchImpl = fetch,
) {
  const response = await fetchImpl(`${gateway.endpoint}${path}`, {
    ...options,
    headers: {
      ...agentGatewayHeaders(gateway.accessToken),
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > jsonLimitBytes) {
    const error = new Error("Agent Gateway response is too large.");
    error.code = "PERSONAL_TASK_AI_RESPONSE_TOO_LARGE";
    throw error;
  }
  if (!response.ok) {
    const error = new Error(
      `Agent Gateway returned status ${response.status}.`,
    );
    error.code = "PERSONAL_TASK_AI_REQUEST_FAILED";
    throw error;
  }
  return bytes.length ? JSON.parse(bytes.toString("utf8")) : {};
}

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

export function createPersonalTaskPromptService({
  repository,
  aiAssistantRepository,
  agentGatewaySettingsRepository,
  configuredGatewayId = "",
  projectRef = "cag",
  runtimeProfile = "general-engineering",
  fetchImpl = fetch,
  logger,
}) {
  async function resolveGateway() {
    if (configuredGatewayId) {
      const gateway =
        await agentGatewaySettingsRepository.get(configuredGatewayId);
      if (gateway?.enabled) return gateway;
    }
    const enabled = (await agentGatewaySettingsRepository.list()).filter(
      (gateway) => gateway.enabled,
    );
    if (enabled.length !== 1) {
      const error = new Error(
        "Personal task AI requires one enabled Agent Gateway.",
      );
      error.code = "PERSONAL_TASK_AI_CONFIGURATION_REQUIRED";
      throw error;
    }
    return enabled[0];
  }

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
    try {
      const gateway = await resolveGateway();
      const conversation = await gatewayJson(
        gateway,
        "/conversations",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: projectRef,
            title: `タスク: ${task.title}`.slice(0, 255),
          }),
        },
        fetchImpl,
      );
      const session = await aiAssistantRepository.create({
        conversationId: conversation.id,
        ownerUserId,
        gatewaySettingId: gateway.id,
        projectRef,
        projectCode: conversation.project_code ?? "",
        runtimeProfile,
        title: conversation.title || `タスク: ${task.title}`,
      });
      const remoteTask = await gatewayJson(
        gateway,
        "/tasks",
        {
          method: "POST",
          headers: {
            "X-CAG-Source": "oneops-personal-task",
            "X-CAG-Client-ID": `oneops-${ownerUserId}`,
          },
          body: JSON.stringify({
            project_id: projectRef,
            prompt: buildPersonalTaskPrompt(task),
            conversation_id: conversation.id,
            runtime_profile: runtimeProfile,
          }),
        },
        fetchImpl,
      );
      await aiAssistantRepository.touchTask(
        conversation.id,
        ownerUserId,
        remoteTask.id,
      );
      const completed = await repository.completePromptRun(
        ownerUserId,
        run.id,
        {
          assistantSessionId: session.id,
          gatewayTaskId: String(remoteTask.id),
          message:
            "AI助手に分析を依頼しました。結果は同じ会話で確認できます。",
        },
      );
      return {
        run: completed,
        assistantSessionId: session.id,
        gatewayTaskId: String(remoteTask.id),
      };
    } catch (error) {
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
