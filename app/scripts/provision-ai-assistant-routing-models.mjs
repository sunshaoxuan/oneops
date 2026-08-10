import { pathToFileURL } from "node:url";
import pg from "pg";
import { createModelSettingsRepository } from "../gateway/model-settings-database.mjs";

const { Pool } = pg;

export async function provisionAiAssistantRoutingModels({
  repository,
  actorUserId,
}) {
  const settings = await repository.list();
  const terra = settings.find((setting) => setting.model === "gpt-5.6-terra");
  if (!terra?.id || !terra.apiKey) {
    throw new Error("gpt-5.6-terra の有効な接続設定が必要です。");
  }
  const luna = settings.find((setting) => setting.model === "gpt-5.6-luna");
  const common = {
    purpose: "GENERAL",
    provider: "OPENAI",
    endpoint: terra.endpoint,
    reasoningEffort: "MEDIUM",
    enabled: true,
  };

  const savedTerra = await repository.save(
    {
      ...common,
      displayName: "gpt-5.6-terra",
      model: "gpt-5.6-terra",
      apiKey: terra.apiKey,
      speedLevel: "MEDIUM",
      sortOrder: 20,
      isDefault: true,
    },
    actorUserId,
    terra.id,
  );
  const savedLuna = await repository.save(
    {
      ...common,
      displayName: "gpt-5.6-luna",
      model: "gpt-5.6-luna",
      apiKey: luna?.apiKey || terra.apiKey,
      speedLevel: "FAST",
      sortOrder: 10,
      isDefault: false,
    },
    actorUserId,
    luna?.id ?? null,
  );
  return {
    generalModelSettingId: savedTerra.id,
    simpleModelSettingId: savedLuna.id,
  };
}

async function main() {
  const connectionString = process.env.OPS_DATABASE_URL;
  if (!connectionString) {
    throw new Error("OPS_DATABASE_URL が必要です。");
  }
  const pool = new Pool({ connectionString, max: 1 });
  const repository = createModelSettingsRepository(connectionString);
  try {
    const actor = await pool.query(
      `SELECT updated_by_user_id
       FROM ai_model_settings
       WHERE model = 'gpt-5.6-terra'
       LIMIT 1`,
    );
    const actorUserId = actor.rows[0]?.updated_by_user_id;
    if (!actorUserId) {
      throw new Error("Model 設定の更新者を特定できません。");
    }
    const result = await provisionAiAssistantRoutingModels({
      repository,
      actorUserId,
    });
    console.log(JSON.stringify(result));
  } finally {
    await repository.close();
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
