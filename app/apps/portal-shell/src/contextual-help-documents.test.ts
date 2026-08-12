import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const documents = [
  {
    file: "inquiry-support.html",
    title: "問合支援 操作マニュアル",
    permission: "inquiries.use",
    minimumSteps: 20,
    contracts: [
      "追加質問・回答・コメントも検索", "担当者未設定", "初期条件に戻す",
      "AI 対応履歴", "お客様の質問を分析する", "この返信の品質を分析する",
      "問合せ全体分析", "Browser Office Viewer",
    ],
  },
  {
    file: "ai-assistant.html",
    title: "AI アシスタント 操作マニュアル",
    permission: "ai.assistant.use",
    minimumSteps: 22,
    contracts: [
      "新しい話題", "クイックアシスタント", "購読した機能", "25 MiB",
      "10 件", "50 MiB", "Shift + Enter", "STREAMING",
      "回答の生成を停止", "最新の会話へ移動",
    ],
  },
  {
    file: "product-builder.html",
    title: "製品構築 操作マニュアル",
    permission: "builder.use",
    minimumSteps: 28,
    contracts: [
      "状態更新", "ビルド端末を起動", "機関封包", "標準発版", "新規構造",
      "顧客化", "資材番号", "Nginx 1.30.2", "Redis 8.8.0",
      "MinIO と RustFS", "構造を開始", "構造履歴", "成果物", "実行ログ",
      "生成してダウンロード", "再生成してダウンロード",
    ],
  },
  {
    file: "basic-master.html",
    title: "基本台帳 操作マニュアル",
    permission: "catalog.read",
    minimumSteps: 20,
    contracts: [
      "catalog.write", "organizations.read", "organizations.write",
      "組織区分を追加", "問合システム顧客 Code", "製品を追加",
      "版数を追加", "機能モジュールを追加", "自然昇順", "物理 ID",
    ],
  },
] as const;

describe("画面別操作マニュアル", () => {
  it.each(documents)(
    "$file は現行画面の操作契約を具体的に説明する",
    ({ file, title, permission, minimumSteps, contracts }) => {
      const html = readFileSync(
        resolve(process.cwd(), `public/help/${file}`),
        "utf8",
      );
      expect(html).toContain(`<h1>${title}</h1>`);
      expect(html).toContain(permission);
      expect(html).toContain('aria-label="目次"');
      expect(html).toContain("現行実装確認日 2026-08-12");
      expect(html).toContain('href="/help/help.css"');
      expect(html).toContain('class="manual-layout"');
      expect(html).toContain('class="steps"');
      expect(html).toContain('id="trouble"');
      expect(html).toContain('target="_blank" rel="noreferrer"');
      expect((html.match(/class="step"/g) ?? []).length).toBeGreaterThanOrEqual(
        minimumSteps,
      );
      for (const contract of contracts) expect(html).toContain(contract);

      expect((html.match(/<h1>/g) ?? []).length).toBe(1);
      expect((html.match(/class="manual-section"/g) ?? []).length).toBeGreaterThan(5);
      const sectionIds = new Set(
        [...html.matchAll(/<section class="manual-section" id="([^"]+)"/g)]
          .map((match) => match[1]),
      );
      const tocTargets = [...html.matchAll(/<a href="#([^"]+)">/g)]
        .map((match) => match[1]);
      expect(tocTargets.length).toBeGreaterThan(5);
      for (const target of tocTargets) expect(sectionIds.has(target)).toBe(true);
    },
  );

  it("共通 Style は onehr.jp の Design Language と操作 Manual Layout を持つ", () => {
    const css = readFileSync(
      resolve(process.cwd(), "public/help/help.css"),
      "utf8",
    );
    expect(css).toContain("background: #f7f8fa");
    expect(css).toContain('font-family: Lato, "Noto Sans JP"');
    expect(css).toContain("--orange: #fd6d26");
    expect(css).toContain("border-radius: 8px");
    expect(css).toMatch(/\.manual-layout\s*\{[\s\S]*grid-template-columns:\s*250px/);
    expect(css).toMatch(/\.manual-section\s*\{\s*min-width:\s*0/);
    expect(css).toMatch(/\.toc\s*\{[\s\S]*position:\s*sticky/);
    expect(css).toMatch(/\.steps\s*\{[\s\S]*counter-reset:\s*steps/);
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("overflow-x: auto");
  });
});
