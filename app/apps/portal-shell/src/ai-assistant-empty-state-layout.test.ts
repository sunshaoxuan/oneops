import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);
const emptyCopyRule = styles.match(
  /\.ai-assistant-conversation \.ant-empty p\s*\{(?<body>[^}]*)\}/,
)?.groups?.body;

describe("AI assistant empty state layout", () => {
  it("uses the available width and balances short empty-state copy", () => {
    expect(emptyCopyRule).toContain(
      "max-width: min(420px, calc(100% - 32px));",
    );
    expect(emptyCopyRule).toContain("margin-inline: auto;");
    expect(emptyCopyRule).toContain("text-wrap: balance;");
    expect(emptyCopyRule).not.toContain("max-width: 300px;");
  });
});
