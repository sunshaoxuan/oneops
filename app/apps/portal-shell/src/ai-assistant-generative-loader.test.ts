import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const main = readFileSync(resolve(process.cwd(), "src/main.tsx"), "utf8");
const packageManifest = readFileSync(
  resolve(process.cwd(), "package.json"),
  "utf8",
);

describe("AIアシスタントの生成会話ローダー統合", () => {
  it("待機状態とストリーミング応答を共通工程インターフェースへ渡す", () => {
    expect(component).toContain('from "./GenerativeConversationLoader"');
    expect(component).toContain('reply?.status === "STREAMING"');
    expect(component).toContain("receivedText={answer}");
    expect(component).toContain('receivedText=""');
    expect(component).toContain('className="ai-assistant-thinking"');
    expect(component).not.toContain('aria-live="polite"');
    expect(component).toContain('role="alert"');
  });

  it("外部スタイルをアプリケーション起点で一度だけ読み込む", () => {
    expect(main.match(/generative-loaders\/styles\.css/g)).toHaveLength(1);
    expect(packageManifest).toContain('"generative-loaders": "0.1.1"');
  });
});
