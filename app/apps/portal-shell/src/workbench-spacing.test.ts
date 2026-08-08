import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("ワークベンチの縦方向余白", () => {
  it("Hero と個人タスク概要の間隔をカード間隔へ揃える", () => {
    expect(styles).toMatch(
      /\.workbench-personal-task-summary\s*\{[\s\S]*?margin-top:\s*18px;/,
    );
    expect(app).toContain('className="hero-panel"');
    expect(app).toContain('className="personal-task-summary workbench-personal-task-summary"');
  });
});
