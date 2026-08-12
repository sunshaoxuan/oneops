export function createAiUsageReportRouteHandler({ repository, sendJson }) {
  return async function handleAiUsageReport(request, response, url) {
    if (
      request.method !== "GET" ||
      url.pathname !== "/api/work-center/v1/reports/ai-token-usage"
    ) {
      return false;
    }
    const daysValue = url.searchParams.get("days");
    const days = daysValue === "all" ? null : Number(daysValue ?? 30);
    if (days !== null && ![7, 30, 90].includes(days)) {
      sendJson(response, 400, {
        error: {
          code: "AI_TOKEN_USAGE_PERIOD_INVALID",
          message: "AI Token usage period is invalid.",
          details: {},
        },
      });
      return true;
    }
    try {
      const rows = await repository.rankedUsage(days);
      sendJson(response, 200, {
        generatedAt: new Date().toISOString(),
        periodDays: days,
        rows,
      });
    } catch (error) {
      sendJson(response, 500, {
        error: {
          code: "AI_TOKEN_USAGE_REPORT_FAILED",
          message: "AI Token usage report could not be loaded.",
          details: {},
        },
      });
    }
    return true;
  };
}
