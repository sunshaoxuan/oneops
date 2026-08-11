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
const settingsStyles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant-shortcut-settings.css"),
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
const modelOptionsMigration = readFileSync(
  resolve(
    process.cwd(),
    "../../db/migrations/040_expand_shortcut_starting_model_options.sql",
  ),
  "utf8",
);

describe("AIアシスタントクイックアシスタント", () => {
  it("左側の新しい話題へ統合した二重矢印からカテゴリを表示する", () => {
    expect(chat).toContain('className="ai-assistant-new-topic-row"');
    expect(chat).toContain('className="ai-assistant-shortcut-trigger"');
    expect(chat).toContain("<DoubleRightOutlined />");
    expect(chat).toContain('trigger={["hover", "click"]}');
    expect(chat).toContain("open={shortcutMenuOpen}");
    expect(chat).toContain("onOpenChange={setShortcutMenuOpen}");
    expect(chat).toContain(
      "getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}",
    );
    expect(chat).toContain('["Enter", " ", "ArrowDown"]');
    expect(chat).toContain('event.key === "Escape"');
    expect(chat.match(/\{shortcutTrigger\}/g)).toHaveLength(1);
    expect(chat).toContain("children: category.shortcuts.map");
    expect(chatStyles).toContain("ai-assistant-shortcut-glint");
    expect(chatStyles).not.toContain("ai-assistant-shortcut-orbit");
    expect(chatStyles).not.toContain("ai-assistant-shortcut-pulse");
    expect(
      chat.match(/className="ai-assistant-new-topic-trigger"/g),
    ).toHaveLength(1);
    expect(chat).not.toContain("<ThunderboltOutlined />");
    expect(chatStyles).toContain(".ai-assistant-new-topic-row:hover");
    expect(chatStyles).toContain(".ai-assistant-new-topic-row:focus-within");
    expect(chatStyles).toMatch(
      /\.ai-assistant-shortcut-trigger\.ant-btn \.anticon \{\s*opacity: 0\.82;/,
    );
    expect(chatStyles).toContain("prefers-reduced-motion: reduce");
    expect(chatStyles).toContain(
      ".ai-assistant-new-topic-row:focus-within",
    );
    expect(chatStyles).toContain("border-radius: 20px 0 0 20px;");
    expect(chatStyles).toContain("border-radius: 0 20px 20px 0;");
    expect(chatStyles).toMatch(
      /\.ai-assistant-new-topic-row \{[\s\S]*?position: relative;/,
    );
    expect(chatStyles).toContain(
      "inset: calc(100% + 8px) 0 auto auto !important;",
    );
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
    expect(settings).toContain('name="startingReasoningEffort"');
    expect(settings).toContain("model.reasoningEffort");
    expect(settings).toContain("shortcut.startingModel.speedLevel");
    expect(settings).toContain("systemPrompt");
  });

  it("開始 Model を三項目の階層設定メニューとして編集する", () => {
    expect(settings).toContain("<Dropdown");
    expect(settings).toContain('key: "model"');
    expect(settings).toContain('key: "reasoning"');
    expect(settings).not.toContain('key: "speed"');
    expect(settings).toContain('reasoning: "推理强度"');
    expect(settings).toContain("<CheckOutlined />");
    expect(settings).not.toContain("<RightOutlined />");
    expect(settings).toContain("model.reasoningEffort");
    expect(settings).toContain("shortcut.startingModel.speedLevel");
    expect(settings).not.toContain("const modelOptions");
    expect(settingsStyles).toContain("quick-assistant-model-picker-popup");
    expect(settingsStyles).toContain("quick-assistant-model-picker-summary");
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
    expect(modelOptionsMigration).toContain("starting_reasoning_effort");
    expect(modelOptionsMigration).toContain("DROP COLUMN IF EXISTS starting_speed_level");
    expect(modelOptionsMigration).toContain(
      "ai_assistant_shortcuts_enabled_model_config_check",
    );
  });
});
