import {
  normalizeExternalAccountInput,
  normalizePersonalTaskInput,
} from "./personal-task-connectors.mjs";

function routeError(response, sendJson, error) {
  const statuses = {
    PERSONAL_TASK_INPUT_INVALID: 400,
    PERSONAL_TASK_ACCOUNT_INPUT_INVALID: 400,
    PERSONAL_TASK_CREDENTIAL_REQUIRED: 400,
    PERSONAL_TASK_ACCOUNT_URL_INVALID: 400,
    PERSONAL_TASK_ACCOUNT_URL_NOT_ALLOWED: 400,
    PERSONAL_TASK_PROVIDER_NOT_SUPPORTED: 400,
    PERSONAL_TASK_NOT_FOUND: 404,
    PERSONAL_TASK_CANDIDATE_NOT_FOUND: 404,
    PERSONAL_TASK_ACCOUNT_NOT_FOUND: 404,
    PERSONAL_TASK_REVISION_CONFLICT: 409,
    PERSONAL_TASK_ACCOUNT_REVISION_CONFLICT: 409,
    PERSONAL_TASK_SYNC_ALREADY_RUNNING: 409,
    PERSONAL_TASK_AI_PERMISSION_REQUIRED: 403,
    PERSONAL_TASK_AI_CONFIGURATION_REQUIRED: 503,
  };
  sendJson(
    response,
    error?.statusCode ?? statuses[error?.code] ?? 502,
    {
      error: {
        code: error?.code ?? "PERSONAL_TASK_OPERATION_FAILED",
        message: error?.message ?? "Personal task operation failed.",
        details: error?.details ?? {},
      },
    },
    { "Cache-Control": "no-store" },
  );
}

function taskInput(input, requireRevision = false) {
  const normalized = normalizePersonalTaskInput(input);
  if (!normalized.valid || (requireRevision && normalized.value.revision < 1)) {
    const error = new Error("Personal task input is invalid.");
    error.code = "PERSONAL_TASK_INPUT_INVALID";
    error.statusCode = 400;
    error.details = {
      ...normalized.errors,
      ...(requireRevision && normalized.value.revision < 1
        ? { revision: "Revision is required." }
        : {}),
    };
    throw error;
  }
  return normalized.value;
}

function accountInput(input) {
  const normalized = normalizeExternalAccountInput(input);
  if (!normalized.valid) {
    const error = new Error("External account input is invalid.");
    error.code = "PERSONAL_TASK_ACCOUNT_INPUT_INVALID";
    error.statusCode = 400;
    error.details = normalized.errors;
    throw error;
  }
  return normalized.value;
}

export function createPersonalTaskRouteHandler({
  repository,
  connectorRegistry,
  syncService,
  promptService,
  sendJson,
  readJsonBody,
}) {
  return async function handlePersonalTasks(
    request,
    response,
    url,
    currentProfile,
  ) {
    const prefix = "/api/work-center/v1/personal-task";
    if (!url.pathname.startsWith(prefix)) return false;
    const ownerUserId = currentProfile.id;

    try {
      if (
        request.method === "GET" &&
        url.pathname === `${prefix}-summary`
      ) {
        sendJson(response, 200, {
          summary: await repository.getSummary(ownerUserId),
        });
        return true;
      }

      if (
        request.method === "GET" &&
        url.pathname === `${prefix}s`
      ) {
        sendJson(response, 200, {
          tasks: await repository.listTasks(ownerUserId, {
            includeArchived:
              url.searchParams.get("includeArchived") === "true",
          }),
        });
        return true;
      }

      if (
        request.method === "POST" &&
        url.pathname === `${prefix}s`
      ) {
        const task = await repository.createTask(
          ownerUserId,
          taskInput(await readJsonBody(request)),
        );
        request.auditContext = { personalTaskId: task.id };
        sendJson(response, 201, { task });
        return true;
      }

      if (
        request.method === "GET" &&
        url.pathname === `${prefix}-candidates`
      ) {
        sendJson(response, 200, {
          candidates: await repository.listCandidates(
            ownerUserId,
            String(url.searchParams.get("disposition") ?? "PENDING"),
          ),
        });
        return true;
      }

      if (
        request.method === "GET" &&
        url.pathname === `${prefix}-connections`
      ) {
        sendJson(
          response,
          200,
          { connections: await repository.listAccounts(ownerUserId) },
          { "Cache-Control": "no-store" },
        );
        return true;
      }

      if (
        request.method === "POST" &&
        url.pathname === `${prefix}-connections`
      ) {
        const connection = await repository.saveAccount(
          ownerUserId,
          accountInput(await readJsonBody(request)),
        );
        request.auditContext = {
          externalAccountId: connection.id,
          providerCode: connection.providerCode,
        };
        sendJson(
          response,
          201,
          { connection: { ...connection, credential: "" } },
          { "Cache-Control": "no-store" },
        );
        return true;
      }

      if (
        request.method === "GET" &&
        url.pathname === `${prefix}-sync-runs`
      ) {
        sendJson(response, 200, {
          runs: await repository.listSyncRuns(ownerUserId),
        });
        return true;
      }

      const taskMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/personal-tasks\/([0-9a-fA-F-]{36})(?:\/(events|archive|prompt-runs))?$/,
      );
      if (taskMatch) {
        const taskId = taskMatch[1];
        const action = taskMatch[2] ?? "";
        request.auditContext = { personalTaskId: taskId };
        if (request.method === "GET" && !action) {
          const task = await repository.getTask(ownerUserId, taskId);
          if (!task) {
            const error = new Error("Personal task was not found.");
            error.code = "PERSONAL_TASK_NOT_FOUND";
            throw error;
          }
          sendJson(response, 200, { task });
          return true;
        }
        if (request.method === "PUT" && !action) {
          const task = await repository.updateTask(
            ownerUserId,
            taskId,
            taskInput(await readJsonBody(request), true),
          );
          if (!task) {
            const error = new Error("Personal task was not found.");
            error.code = "PERSONAL_TASK_NOT_FOUND";
            throw error;
          }
          sendJson(response, 200, { task });
          return true;
        }
        if (request.method === "GET" && action === "events") {
          sendJson(response, 200, {
            events: await repository.listEvents(ownerUserId, taskId),
          });
          return true;
        }
        if (request.method === "POST" && action === "archive") {
          const task = await repository.archiveTask(ownerUserId, taskId);
          if (!task) {
            const error = new Error("Personal task was not found.");
            error.code = "PERSONAL_TASK_NOT_FOUND";
            throw error;
          }
          sendJson(response, 200, { task });
          return true;
        }
        if (request.method === "GET" && action === "prompt-runs") {
          sendJson(response, 200, {
            runs: await repository.listPromptRuns(ownerUserId, taskId),
          });
          return true;
        }
        if (request.method === "POST" && action === "prompt-runs") {
          if (!currentProfile.systemPermissions?.includes(
            "ai.assistant.use",
          )) {
            const error = new Error(
              "AI assistant permission is required to execute a prompt.",
            );
            error.code = "PERSONAL_TASK_AI_PERMISSION_REQUIRED";
            throw error;
          }
          const task = await repository.getTask(ownerUserId, taskId);
          if (!task) {
            const error = new Error("Personal task was not found.");
            error.code = "PERSONAL_TASK_NOT_FOUND";
            throw error;
          }
          const result = await promptService.execute(
            ownerUserId,
            task,
            "MANUAL",
          );
          request.auditContext = {
            personalTaskId: taskId,
            promptRunId: result.run.id,
            assistantSessionId: result.assistantSessionId,
            assistantTaskId: result.assistantTaskId,
          };
          sendJson(response, 202, {
            run: result.run,
            assistantSessionId: result.assistantSessionId,
            assistantTaskId: result.assistantTaskId,
          });
          return true;
        }
      }

      const candidateMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/personal-task-candidates\/([0-9a-fA-F-]{36})\/(adopt|dismiss)$/,
      );
      if (candidateMatch && request.method === "POST") {
        const candidateId = candidateMatch[1];
        const action = candidateMatch[2];
        request.auditContext = { personalTaskCandidateId: candidateId };
        if (action === "dismiss") {
          if (!(await repository.dismissCandidate(
            ownerUserId,
            candidateId,
          ))) {
            const error = new Error("Task candidate was not found.");
            error.code = "PERSONAL_TASK_CANDIDATE_NOT_FOUND";
            throw error;
          }
          sendJson(response, 200, { dismissed: true });
          return true;
        }
        const task = await repository.adoptCandidate(
          ownerUserId,
          candidateId,
          taskInput(await readJsonBody(request)),
        );
        if (!task) {
          const error = new Error("Task candidate was not found.");
          error.code = "PERSONAL_TASK_CANDIDATE_NOT_FOUND";
          throw error;
        }
        sendJson(response, 201, { task });
        return true;
      }

      const connectionMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/personal-task-connections\/([0-9a-fA-F-]{36})(?:\/(credential|test|options|sync|regenerate))?$/,
      );
      if (connectionMatch) {
        const accountId = connectionMatch[1];
        const action = connectionMatch[2] ?? "";
        request.auditContext = { externalAccountId: accountId };
        if (request.method === "GET" && action === "credential") {
          const connection = await repository.getAccount(
            ownerUserId,
            accountId,
            true,
          );
          if (!connection) {
            const error = new Error("External account was not found.");
            error.code = "PERSONAL_TASK_ACCOUNT_NOT_FOUND";
            throw error;
          }
          sendJson(
            response,
            200,
            { credential: connection.credential },
            { "Cache-Control": "no-store" },
          );
          return true;
        }
        if (request.method === "PUT" && !action) {
          const input = accountInput({
            ...(await readJsonBody(request)),
            id: accountId,
          });
          const connection = await repository.saveAccount(
            ownerUserId,
            input,
          );
          if (!connection) {
            const error = new Error("External account was not found.");
            error.code = "PERSONAL_TASK_ACCOUNT_NOT_FOUND";
            throw error;
          }
          sendJson(
            response,
            200,
            { connection: { ...connection, credential: "" } },
            { "Cache-Control": "no-store" },
          );
          return true;
        }
        if (request.method === "DELETE" && !action) {
          if (!(await repository.deleteAccount(ownerUserId, accountId))) {
            const error = new Error("External account was not found.");
            error.code = "PERSONAL_TASK_ACCOUNT_NOT_FOUND";
            throw error;
          }
          sendJson(response, 200, { deleted: true });
          return true;
        }
        if (
          request.method === "POST" &&
          ["test", "options"].includes(action)
        ) {
          const connection = await repository.getAccount(
            ownerUserId,
            accountId,
            true,
          );
          if (!connection) {
            const error = new Error("External account was not found.");
            error.code = "PERSONAL_TASK_ACCOUNT_NOT_FOUND";
            throw error;
          }
          const result = await connectorRegistry
            .get(connection.providerCode)
            [action === "test" ? "testConnection" : "options"](
              connection,
            );
          sendJson(
            response,
            200,
            { result },
            { "Cache-Control": "no-store" },
          );
          return true;
        }
        if (request.method === "POST" && ["sync", "regenerate"].includes(action)) {
          const run = await syncService.sync(
            ownerUserId,
            accountId,
            action === "regenerate" ? "REGENERATE" : "MANUAL",
          );
          sendJson(response, 200, { run });
          return true;
        }
      }

      sendJson(response, 404, {
        error: {
          code: "PERSONAL_TASK_ROUTE_NOT_FOUND",
          message: "Personal task route was not found.",
          details: {},
        },
      });
      return true;
    } catch (error) {
      routeError(response, sendJson, error);
      return true;
    }
  };
}
