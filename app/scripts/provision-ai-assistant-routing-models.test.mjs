import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { provisionAiAssistantRoutingModels } from "./provision-ai-assistant-routing-models.mjs";

const source = readFileSync(
  new URL("./provision-ai-assistant-routing-models.mjs", import.meta.url),
  "utf8",
);

test("terra を汎用、luna を軽量として秘密を表示せず冪等設定する", async () => {
  const saves = [];
  const repository = {
    async list() {
      return [
        {
          id: "terra-id",
          model: "gpt-5.6-terra",
          endpoint: "https://models.example.test/v1",
          apiKey: "secret-value",
        },
      ];
    },
    async save(settings, actorUserId, id) {
      saves.push({ settings, actorUserId, id });
      return { id: id ?? "luna-id" };
    },
  };

  const result = await provisionAiAssistantRoutingModels({
    repository,
    actorUserId: "actor-id",
  });

  assert.deepEqual(result, {
    generalModelSettingId: "terra-id",
    simpleModelSettingId: "luna-id",
  });
  assert.equal(saves[0].settings.model, "gpt-5.6-terra");
  assert.equal(saves[0].settings.speedLevel, "MEDIUM");
  assert.equal(saves[0].settings.isDefault, true);
  assert.equal(saves[1].settings.model, "gpt-5.6-luna");
  assert.equal(saves[1].settings.speedLevel, "FAST");
  assert.equal(saves[1].settings.isDefault, false);
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});

test("terra が複数存在しても監査利用者を持つ最新設定を供給者として選ぶ", () => {
  assert.match(
    source,
    /model = 'gpt-5\.6-terra'[\s\S]*updated_by_user_id IS NOT NULL[\s\S]*ORDER BY updated_at DESC/,
  );
});
