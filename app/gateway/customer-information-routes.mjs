import {
  pagination,
  validateBacklogProjects,
  validateCustomerContract,
  validateCustomerSettings,
  validateCustomerVpn,
} from "./customer-information.mjs";

function routeError(response, sendJson, error) {
  const code = String(error?.code ?? "CUSTOMER_INFORMATION_FAILED");
  const status = code.includes("NOT_FOUND")
    ? 404
    : code.includes("REVISION_CONFLICT")
      ? 409
      : code.startsWith("BACKLOG_") || code.startsWith("INQUIRY_")
        ? 502
        : error?.code === "23505"
          ? 409
          : error?.code === "23503"
            ? 400
            : 500;
  sendJson(response, status, {
    error: {
      code: error?.code === "23505"
        ? "CUSTOMER_INFORMATION_DUPLICATE"
        : error?.code === "23503"
          ? "CUSTOMER_INFORMATION_REFERENCE_INVALID"
          : code,
      message: String(error?.message ?? "Customer information request failed.")
        .replace(/apiKey=[^&\s]+/gi, "apiKey=[REDACTED]")
        .slice(0, 1000),
      details: {},
    },
  });
}

function invalid(response, sendJson, code, errors) {
  sendJson(response, 400, {
    error: {
      code,
      message: "Customer information input is invalid.",
      details: errors,
    },
  });
}

async function activeInquirySettings(repository) {
  const settings = await repository.getSettings({ includeCredentials: true });
  if (!settings?.enabled) {
    throw Object.assign(new Error("Inquiry source is disabled."), {
      code: "INQUIRY_SOURCE_DISABLED",
    });
  }
  if (!settings.password) {
    throw Object.assign(new Error("Inquiry source credentials are not configured."), {
      code: "INQUIRY_SOURCE_CREDENTIALS_REQUIRED",
    });
  }
  return settings;
}

async function activeBacklogSettings(repository) {
  const settings = await repository.getBacklogSettings({
    includeCredentials: true,
  });
  if (!settings?.enabled) {
    throw Object.assign(new Error("Backlog source is disabled."), {
      code: "BACKLOG_SOURCE_DISABLED",
    });
  }
  if (!settings.apiKey) {
    throw Object.assign(new Error("Backlog API Key is not configured."), {
      code: "BACKLOG_API_KEY_REQUIRED",
    });
  }
  return settings;
}

export function createCustomerInformationRouteHandler({
  repository,
  inquiryRepository,
  inquirySourceClient,
  backlogSourceClient,
  hasPermission,
  sendJson,
  readJsonBody,
}) {
  const prefix = "/api/work-center/v1/customers";
  return async function handleCustomerInformation(
    request,
    response,
    url,
    currentProfile,
  ) {
    if (!url.pathname.startsWith(prefix)) return false;
    const baseMatch = url.pathname.match(
      /^\/api\/work-center\/v1\/customers\/(\d+)\/information$/,
    );
    try {
      if (request.method === "GET" && baseMatch) {
        const information = await repository.getInformation(baseMatch[1]);
        if (!information) {
          throw Object.assign(new Error("Customer was not found."), {
            code: "CUSTOMER_NOT_FOUND",
          });
        }
        sendJson(response, 200, information);
        return true;
      }

      const settingsMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/settings$/,
      );
      if (request.method === "PUT" && settingsMatch) {
        const validation = validateCustomerSettings(await readJsonBody(request));
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_SETTINGS_INVALID", validation.errors);
          return true;
        }
        sendJson(response, 200, {
          settings: await repository.saveSettings(
            settingsMatch[1],
            validation.settings,
            currentProfile.id,
          ),
        });
        return true;
      }

      const contractCollectionMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/contracts$/,
      );
      if (request.method === "POST" && contractCollectionMatch) {
        const validation = validateCustomerContract(await readJsonBody(request));
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_CONTRACT_INVALID", validation.errors);
          return true;
        }
        sendJson(response, 201, {
          contract: await repository.createContract(
            contractCollectionMatch[1],
            validation.contract,
            currentProfile.id,
          ),
        });
        return true;
      }

      const contractMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/contracts\/([0-9a-f-]+)$/i,
      );
      if (["PUT", "DELETE"].includes(request.method) && contractMatch) {
        const input = await readJsonBody(request);
        if (request.method === "DELETE") {
          const archived = await repository.archiveContract(
            contractMatch[1],
            contractMatch[2],
            Number(input?.revision),
            currentProfile.id,
          );
          if (!archived) {
            throw Object.assign(new Error("Contract was not found or changed."), {
              code: "CUSTOMER_CONTRACT_REVISION_CONFLICT",
            });
          }
          sendJson(response, 200, { archived: true });
          return true;
        }
        const validation = validateCustomerContract(input);
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_CONTRACT_INVALID", validation.errors);
          return true;
        }
        const contract = await repository.updateContract(
          contractMatch[1],
          contractMatch[2],
          validation.contract,
          currentProfile.id,
        );
        if (!contract) {
          throw Object.assign(new Error("Contract was not found or changed."), {
            code: "CUSTOMER_CONTRACT_REVISION_CONFLICT",
          });
        }
        sendJson(response, 200, { contract });
        return true;
      }

      const vpnCollectionMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/vpn-connections$/,
      );
      if (request.method === "POST" && vpnCollectionMatch) {
        const validation = validateCustomerVpn(await readJsonBody(request));
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_VPN_INVALID", validation.errors);
          return true;
        }
        sendJson(response, 201, {
          vpn: await repository.createVpn(
            vpnCollectionMatch[1],
            validation.vpn,
            currentProfile.id,
          ),
        });
        return true;
      }

      const vpnMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/vpn-connections\/([0-9a-f-]+)$/i,
      );
      if (["PUT", "DELETE"].includes(request.method) && vpnMatch) {
        const input = await readJsonBody(request);
        if (request.method === "DELETE") {
          const archived = await repository.archiveVpn(
            vpnMatch[1],
            vpnMatch[2],
            Number(input?.revision),
            currentProfile.id,
          );
          if (!archived) {
            throw Object.assign(new Error("VPN was not found or changed."), {
              code: "CUSTOMER_VPN_REVISION_CONFLICT",
            });
          }
          sendJson(response, 200, { archived: true });
          return true;
        }
        const validation = validateCustomerVpn(input);
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_VPN_INVALID", validation.errors);
          return true;
        }
        const vpn = await repository.updateVpn(
          vpnMatch[1],
          vpnMatch[2],
          validation.vpn,
          currentProfile.id,
        );
        if (!vpn) {
          throw Object.assign(new Error("VPN was not found or changed."), {
            code: "CUSTOMER_VPN_REVISION_CONFLICT",
          });
        }
        sendJson(response, 200, { vpn });
        return true;
      }

      const inquiryMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/inquiries$/,
      );
      if (request.method === "GET" && inquiryMatch) {
        if (!hasPermission(currentProfile, "inquiries.use", inquiryMatch[1])) {
          sendJson(response, 403, {
            error: {
              code: "PERMISSION_DENIED",
              message: "Permission denied.",
              details: {},
            },
          });
          return true;
        }
        const information = await repository.getInformation(inquiryMatch[1]);
        if (!information) {
          throw Object.assign(new Error("Customer was not found."), {
            code: "CUSTOMER_NOT_FOUND",
          });
        }
        const paging = pagination(Object.fromEntries(url.searchParams));
        const result = await inquirySourceClient.search(
          await activeInquirySettings(inquiryRepository),
          {
            status: "all",
            customerCode: information.settings.inquiryCustomerCode,
            customer: null,
            customerName: null,
            assignee: null,
            assigneeName: null,
            unassignedOnly: false,
            ticketNo: null,
            content: null,
            createdFrom: null,
            createdTo: null,
            requestedReplyFrom: null,
            requestedReplyTo: null,
            updatedFrom: null,
            updatedTo: null,
            subStatus: null,
            category: null,
            classificationResult: null,
            questionerName: null,
          },
        );
        sendJson(response, 200, {
          page: paging.page,
          pageSize: paging.pageSize,
          total: result.actualCount,
          sourceTruncated: result.sourceTruncated,
          tickets: result.tickets.slice(
            paging.offset,
            paging.offset + paging.pageSize,
          ),
        });
        return true;
      }

      const projectOptionsMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/backlog-project-options$/,
      );
      if (request.method === "GET" && projectOptionsMatch) {
        sendJson(response, 200, {
          projects: await backlogSourceClient.listProjects(
            await activeBacklogSettings(inquiryRepository),
          ),
        });
        return true;
      }

      const projectsMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/backlog-projects$/,
      );
      if (request.method === "PUT" && projectsMatch) {
        const validation = validateBacklogProjects(await readJsonBody(request));
        if (!validation.valid) {
          invalid(response, sendJson, "CUSTOMER_BACKLOG_PROJECTS_INVALID", validation.errors);
          return true;
        }
        const availableProjects = await backlogSourceClient.listProjects(
          await activeBacklogSettings(inquiryRepository),
        );
        const availableById = new Map(
          availableProjects.map((project) => [project.externalProjectId, project]),
        );
        if (validation.projects.some(
          (project) => !availableById.has(project.externalProjectId),
        )) {
          invalid(response, sendJson, "CUSTOMER_BACKLOG_PROJECTS_INVALID", {
            projects: "BACKLOG_PROJECT_NOT_AVAILABLE",
          });
          return true;
        }
        const canonical = validation.projects.map(
          (project) => availableById.get(project.externalProjectId),
        );
        sendJson(response, 200, {
          projects: await repository.replaceBacklogProjects(
            projectsMatch[1],
            canonical,
            currentProfile.id,
          ),
        });
        return true;
      }

      const issuesMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/customers\/(\d+)\/backlog-issues$/,
      );
      if (request.method === "GET" && issuesMatch) {
        const paging = pagination(Object.fromEntries(url.searchParams));
        const sortOrder = url.searchParams.get("sortOrder") === "desc"
          ? "desc"
          : "asc";
        const templates = typeof inquiryRepository.listBacklogSearchTemplates === "function"
          ? await inquiryRepository.listBacklogSearchTemplates()
          : [];
        const enabledTemplates = templates.filter((template) => template.enabled);
        if (!enabledTemplates.length) {
          sendJson(response, 200, {
            page: paging.page,
            pageSize: paging.pageSize,
            total: 0,
            projects: [],
            issues: [],
            templates: [],
            configurationRequired: "BACKLOG_SEARCH_TEMPLATE_REQUIRED",
          });
          return true;
        }
        const information = await repository.getInformation(issuesMatch[1]);
        if (!information) {
          throw Object.assign(new Error("Customer was not found."), {
            code: "CUSTOMER_NOT_FOUND",
          });
        }
        const result = await backlogSourceClient.listIssuesByTemplates(
          await activeBacklogSettings(inquiryRepository),
          {
            templates: enabledTemplates,
            customer: {
              code: information.settings.organizationCode,
              name: information.settings.organizationName,
              shortName: information.settings.organizationShortName,
            },
            offset: paging.offset,
            count: paging.pageSize,
            sortOrder,
          },
        );
        sendJson(response, 200, {
          page: paging.page,
          pageSize: paging.pageSize,
          total: result.total,
          projects: result.projects,
          templates: enabledTemplates,
          issues: result.issues,
        });
        return true;
      }
    } catch (error) {
      routeError(response, sendJson, error);
      return true;
    }
    return false;
  };
}
