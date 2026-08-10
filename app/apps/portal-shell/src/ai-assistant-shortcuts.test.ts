import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chat = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const chatStyles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "src/AiAssistantShortcutSettingsPage.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const navigation = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(process.cwd(), "../../db/migrations/038_create_ai_assistant_shortcuts.sql"),
  "utf8",
);
const modelMigration = readFileSync(
  resolve(
    process.cwd(),
    "../../db/migrations/039_expand_general_models_and_shortcut_starting_model.sql",
  ),
  "utf8",
);

describe("AI助手クイックアシスタント", () => {
  it("新しい話題の右側へ動的なカテゴリ別入口を表示する", () => {
    expect(chat).toContain('className="ai-assistant-new-topic-row"');
    expect(chat).toContain('className="ai-assistant-shortcut-trigger"');
    expect(chat).toContain('trigger={["hover", "click"]}');
    expect(chat).toContain("children: category.shortcuts.map");
    expect(chatStyles).toContain("ai-assistant-shortcut-orbit");
    expect(chatStyles).toContain("ai-assistant-shortcut-pulse");
  });

  it("選択した助手の物理 ID で専用 Session を作成する", () => {
    expect(chat).toContain("shortcut?.id");
    expect(chat).toContain("createMutation.mutate(shortcut)");
    expect(chat).toContain("detailQuery.data?.session.shortcut");
    expect(chat).toContain("starterPrompt[localizedField]");
  });

  it("AI 設定へ独立した管理子画面を提供する", () => {
    expect(navigation).toContain('| "quick-assistants"');
    expect(app).toContain('key: "quick-assistants"');
    expect(app).toContain("<AiAssistantShortcutSettingsPage");
    expect(settings).toContain("listAiAssistantShortcutsForAdmin");
    expect(settings).toContain("saveAiAssistantShortcut");
    expect(settings).toContain('name="startingModelSettingId"');
    expect(settings).toContain("model.reasoningEffort");
    expect(settings).toContain("model.speedLevel");
    expect(settings).toContain("systemPrompt");
  });

  it("初期 4 カテゴリへ各 3 件の助手を物理 ID と外部キーで登録する", () => {
    expect(
      migration.match(/10000000-0000-4000-8000-00000000000[1-4]/g),
    ).toHaveLength(16);
    expect(
      new Set(
        migration.match(/20000000-0000-4000-8000-0000000000(?:0[1-9]|1[0-2])/g),
      ).size,
    ).toBe(12);
    expect(migration).toContain("REFERENCES ai_assistant_shortcut_categories(id)");
    expect(migration).toContain("REFERENCES ai_assistant_shortcuts(id)");
    expect(migration).toContain("shortcut_prompt_snapshot");
    expect(migration).toContain("ON CONFLICT (id) DO NOTHING");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS shortcut_id");
  });

  it("開始 Model 外部キーと再実行可能な種子有効化を定義する", () => {
    expect(migration).toContain("ALTER COLUMN enabled SET DEFAULT FALSE");
    expect(modelMigration).toContain("starting_model_setting_id UUID");
    expect(modelMigration).toContain("REFERENCES ai_model_settings(id)");
    expect(modelMigration).toContain("reasoning_effort_snapshot");
    expect(modelMigration).toContain("speed_level_snapshot");
    expect(modelMigration).toContain("ALTER COLUMN enabled SET DEFAULT TRUE");
  });
});
