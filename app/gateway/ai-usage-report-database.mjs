import pg from "pg";

const { Pool } = pg;

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.trunc(number)
    : null;
}

export function normalizeProviderUsage(usage) {
  if (!usage || typeof usage !== "object") {
    return {
      reported: false,
      inputTokens: null,
      outputTokens: null,
      cachedInputTokens: null,
      reasoningTokens: null,
      totalTokens: null,
      raw: null,
    };
  }
  const inputTokens = nonNegativeInteger(
    usage.input_tokens ?? usage.inputTokens,
  );
  const outputTokens = nonNegativeInteger(
    usage.output_tokens ?? usage.outputTokens,
  );
  const cachedInputTokens = nonNegativeInteger(
    usage.input_tokens_details?.cached_tokens ??
      usage.inputTokensDetails?.cachedTokens ??
      usage.cached_tokens ??
      usage.cachedTokens,
  );
  const reasoningTokens = nonNegativeInteger(
    usage.output_tokens_details?.reasoning_tokens ??
      usage.outputTokensDetails?.reasoningTokens ??
      usage.reasoning_tokens ??
      usage.reasoningTokens,
  );
  const suppliedTotal = nonNegativeInteger(
    usage.total_tokens ?? usage.totalTokens,
  );
  const computedTotal = inputTokens !== null || outputTokens !== null
    ? (inputTokens ?? 0) + (outputTokens ?? 0)
    : null;
  const totalTokens = suppliedTotal ?? computedTotal;
  return {
    reported:
      inputTokens !== null || outputTokens !== null || totalTokens !== null,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    reasoningTokens,
    totalTokens,
    raw: usage,
  };
}

export function createAiUsageReportRepository(databaseUrl, onPoolError) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 4,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
    query_timeout: 5_500,
  });
  pool.on?.("error", (error) => onPoolError?.(error));

  return {
    async startCall({
      id,
      userId,
      sessionId = null,
      taskId = null,
      feature,
      phase,
      modelSettingId = null,
      model,
      provider = "OPENAI",
    }) {
      await pool.query(
        `INSERT INTO ai_model_usage_calls (
           id, user_id, session_id, task_id, feature, phase,
           model_setting_id, model, provider, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'STARTED')`,
        [
          id,
          userId,
          sessionId,
          taskId,
          feature,
          phase,
          modelSettingId,
          model,
          provider,
        ],
      );
    },

    async completeCall(id, usage) {
      const normalized = normalizeProviderUsage(usage);
      await pool.query(
        `UPDATE ai_model_usage_calls
         SET status = 'COMPLETED',
             usage_reported = $2,
             input_tokens = $3,
             output_tokens = $4,
             cached_input_tokens = $5,
             reasoning_tokens = $6,
             total_tokens = $7,
             provider_usage = $8,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          id,
          normalized.reported,
          normalized.inputTokens,
          normalized.outputTokens,
          normalized.cachedInputTokens,
          normalized.reasoningTokens,
          normalized.totalTokens,
          normalized.raw,
        ],
      );
    },

    async failCall(id, errorCode, cancelled = false) {
      await pool.query(
        `UPDATE ai_model_usage_calls
         SET status = $2,
             error_code = $3,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, cancelled ? "CANCELLED" : "FAILED", String(errorCode ?? "").slice(0, 120)],
      );
    },

    async rankedUsage(days = 30) {
      const boundedDays = days === null
        ? null
        : Math.min(3650, Math.max(1, Math.trunc(Number(days) || 30)));
      const result = await pool.query(
        `SELECT
           call_record.user_id,
           user_record.username,
           user_record.display_name,
           user_record.email,
           COUNT(*)::bigint AS call_count,
           COUNT(*) FILTER (WHERE call_record.usage_reported)::bigint
             AS usage_reported_count,
           COALESCE(SUM(call_record.input_tokens), 0)::bigint AS input_tokens,
           COALESCE(SUM(call_record.output_tokens), 0)::bigint AS output_tokens,
           COALESCE(SUM(call_record.cached_input_tokens), 0)::bigint
             AS cached_input_tokens,
           COALESCE(SUM(call_record.reasoning_tokens), 0)::bigint
             AS reasoning_tokens,
           COALESCE(SUM(call_record.total_tokens), 0)::bigint AS total_tokens,
           MAX(call_record.started_at) AS last_used_at
         FROM ai_model_usage_calls AS call_record
         JOIN users AS user_record ON user_record.id = call_record.user_id
         WHERE ($1::integer IS NULL OR
                call_record.started_at >= CURRENT_TIMESTAMP - make_interval(days => $1))
         GROUP BY call_record.user_id, user_record.username,
                  user_record.display_name, user_record.email
         ORDER BY total_tokens DESC, call_count DESC,
                  user_record.display_name, user_record.username`,
        [boundedDays],
      );
      return result.rows.map((row, index) => ({
        rank: index + 1,
        userId: String(row.user_id),
        username: String(row.username),
        displayName: String(row.display_name),
        email: String(row.email ?? ""),
        callCount: Number(row.call_count),
        usageReportedCount: Number(row.usage_reported_count),
        inputTokens: Number(row.input_tokens),
        outputTokens: Number(row.output_tokens),
        cachedInputTokens: Number(row.cached_input_tokens),
        reasoningTokens: Number(row.reasoning_tokens),
        totalTokens: Number(row.total_tokens),
        lastUsedAt: row.last_used_at?.toISOString?.() ?? row.last_used_at,
      }));
    },

    async close() {
      await pool.end();
    },
  };
}
