import pg from "pg";

const { Pool } = pg;

function text(value) {
  return String(value ?? "");
}

function shortcutFromRow(row, includePrompt) {
  const shortcut = {
    id: text(row.shortcut_id),
    categoryId: text(row.category_id),
    name: {
      ja: text(row.shortcut_name_ja),
      zh: text(row.shortcut_name_zh),
      en: text(row.shortcut_name_en),
    },
    description: {
      ja: text(row.description_ja),
      zh: text(row.description_zh),
      en: text(row.description_en),
    },
    starterPrompt: {
      ja: text(row.starter_prompt_ja),
      zh: text(row.starter_prompt_zh),
      en: text(row.starter_prompt_en),
    },
    startingModel: row.starting_model_setting_id
      ? {
          id: text(row.starting_model_setting_id),
          displayName: text(row.starting_model_display_name),
          model: text(row.starting_model),
          reasoningEffort: text(row.starting_reasoning_effort),
          speedLevel: text(row.starting_model_speed_level),
          enabled: Boolean(row.starting_model_enabled),
        }
      : null,
    sortOrder: Number(row.shortcut_sort_order),
    enabled: Boolean(row.shortcut_enabled),
    updatedAt: row.shortcut_updated_at?.toISOString?.() ?? row.shortcut_updated_at,
  };
  return includePrompt
    ? { ...shortcut, systemPrompt: text(row.system_prompt) }
    : shortcut;
}

function groupedRows(rows, includePrompt) {
  const categories = new Map();
  for (const row of rows) {
    const categoryId = text(row.category_id);
    if (!categories.has(categoryId)) {
      categories.set(categoryId, {
        id: categoryId,
        name: {
          ja: text(row.category_name_ja),
          zh: text(row.category_name_zh),
          en: text(row.category_name_en),
        },
        icon: text(row.category_icon),
        sortOrder: Number(row.category_sort_order),
        enabled: Boolean(row.category_enabled),
        shortcuts: [],
      });
    }
    if (row.shortcut_id) {
      categories.get(categoryId).shortcuts.push(
        shortcutFromRow(row, includePrompt),
      );
    }
  }
  return [...categories.values()];
}

export function createAiAssistantShortcutRepository(
  connectionString,
  onPoolError,
) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  const selectColumns = `
    category.id AS category_id,
    category.name_ja AS category_name_ja,
    category.name_zh AS category_name_zh,
    category.name_en AS category_name_en,
    category.icon AS category_icon,
    category.sort_order AS category_sort_order,
    category.enabled AS category_enabled,
    shortcut.id AS shortcut_id,
    shortcut.name_ja AS shortcut_name_ja,
    shortcut.name_zh AS shortcut_name_zh,
    shortcut.name_en AS shortcut_name_en,
    shortcut.description_ja,
    shortcut.description_zh,
    shortcut.description_en,
    shortcut.starter_prompt_ja,
    shortcut.starter_prompt_zh,
    shortcut.starter_prompt_en,
    shortcut.system_prompt,
    shortcut.starting_model_setting_id,
    shortcut.starting_reasoning_effort,
    model.display_name AS starting_model_display_name,
    model.model AS starting_model,
    model.reasoning_effort AS starting_model_reasoning_effort,
    model.speed_level AS starting_model_speed_level,
    model.enabled AS starting_model_enabled,
    shortcut.sort_order AS shortcut_sort_order,
    shortcut.enabled AS shortcut_enabled,
    shortcut.updated_at AS shortcut_updated_at`;

  async function list({ includeDisabled, includePrompt }) {
    const result = await pool.query(
      `SELECT ${selectColumns}
       FROM ai_assistant_shortcut_categories AS category
       LEFT JOIN ai_assistant_shortcuts AS shortcut
         ON shortcut.category_id = category.id
        AND ($1::boolean OR shortcut.enabled)
       LEFT JOIN ai_model_settings AS model
         ON model.id = shortcut.starting_model_setting_id
       WHERE $1::boolean OR category.enabled
         AND ($1::boolean OR (model.purpose = 'GENERAL' AND model.enabled))
       ORDER BY category.sort_order, category.id,
                shortcut.sort_order, shortcut.id`,
      [Boolean(includeDisabled)],
    );
    return groupedRows(result.rows, Boolean(includePrompt));
  }

  return {
    listPublic() {
      return list({ includeDisabled: false, includePrompt: false });
    },

    listAdmin() {
      return list({ includeDisabled: true, includePrompt: true });
    },

    async getEnabled(id) {
      const result = await pool.query(
        `SELECT ${selectColumns}
         FROM ai_assistant_shortcut_categories AS category
         JOIN ai_assistant_shortcuts AS shortcut
           ON shortcut.category_id = category.id
         JOIN ai_model_settings AS model
           ON model.id = shortcut.starting_model_setting_id
         WHERE shortcut.id = $1
           AND category.enabled
           AND shortcut.enabled
           AND model.purpose = 'GENERAL'
           AND model.enabled`,
        [id],
      );
      return result.rows[0]
        ? shortcutFromRow(result.rows[0], true)
        : null;
    },

    async create(id, code, input, userId) {
      await pool.query(
        `INSERT INTO ai_assistant_shortcuts (
           id, category_id, code,
           name_ja, name_zh, name_en,
           description_ja, description_zh, description_en,
           starter_prompt_ja, starter_prompt_zh, starter_prompt_en,
           system_prompt, starting_model_setting_id,
           starting_reasoning_effort,
           sort_order, enabled,
           created_by_user_id, updated_by_user_id
         ) VALUES (
           $1, $2, $3,
           $4, $5, $6,
           $7, $8, $9,
           $10, $11, $12,
           $13, $14, $15, $16, $17, $18, $18
         )`,
        [
          id,
          input.categoryId,
          code,
          input.name.ja,
          input.name.zh,
          input.name.en,
          input.description.ja,
          input.description.zh,
          input.description.en,
          input.starterPrompt.ja,
          input.starterPrompt.zh,
          input.starterPrompt.en,
          input.systemPrompt,
          input.startingModelSettingId,
          input.startingReasoningEffort,
          input.sortOrder,
          input.enabled,
          userId,
        ],
      );
      return id;
    },

    async update(id, input, userId) {
      const result = await pool.query(
        `UPDATE ai_assistant_shortcuts
         SET category_id = $2,
             name_ja = $3,
             name_zh = $4,
             name_en = $5,
             description_ja = $6,
             description_zh = $7,
             description_en = $8,
             starter_prompt_ja = $9,
             starter_prompt_zh = $10,
             starter_prompt_en = $11,
             system_prompt = $12,
             starting_model_setting_id = $13,
             starting_reasoning_effort = $14,
             sort_order = $15,
             enabled = $16,
             updated_by_user_id = $17,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id`,
        [
          id,
          input.categoryId,
          input.name.ja,
          input.name.zh,
          input.name.en,
          input.description.ja,
          input.description.zh,
          input.description.en,
          input.starterPrompt.ja,
          input.starterPrompt.zh,
          input.starterPrompt.en,
          input.systemPrompt,
          input.startingModelSettingId,
          input.startingReasoningEffort,
          input.sortOrder,
          input.enabled,
          userId,
        ],
      );
      return Boolean(result.rowCount);
    },

    async close() {
      await pool.end();
    },
  };
}
