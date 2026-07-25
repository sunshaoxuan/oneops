import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/ModelDesignPage.tsx"),
  "utf8",
);

describe("model design settings", () => {
  it("offers only the OpenAI provider for the first implementation", () => {
    expect(source).toContain(
      'options={[{ value: "OPENAI", label: "OpenAI" }]}',
    );
    expect(source).not.toMatch(/ANTHROPIC|GOOGLE|AZURE_OPENAI/);
  });

  it("keeps the API key masked and supports testing unsaved values", () => {
    expect(source).toContain("<Input.Password");
    expect(source).toContain('autoComplete="new-password"');
    expect(source).toContain("testModelConnection");
    expect(source).toContain('submit("test")');
    expect(source).toContain('apiKey: "",');
    expect(source).not.toContain("apiKeyPlaintext");
  });

  it("shows connection and saved configuration status", () => {
    expect(source).toContain("apiKeyConfigured");
    expect(source).toContain("connectionResult.success");
    expect(source).toContain("modelConnectionSucceeded");
    expect(source).toContain("modelSettingsSaved");
  });
});
