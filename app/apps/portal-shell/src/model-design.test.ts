import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/ModelDesignPage.tsx"),
  "utf8",
);

describe("AI settings", () => {
  it("renders Model API and Agent Gateways as separate functions", () => {
    expect(source).toContain(
      'section: "model-api" | "agent-gateways"',
    );
    expect(source).toContain('section === "model-api"');
    expect(source).not.toContain("<Tabs");
    expect(source).not.toContain('className="ai-settings-tabs"');
  });

  it("offers only the OpenAI provider for the first implementation", () => {
    expect(source).toContain(
      'options={[{ value: "OPENAI", label: "OpenAI" }]}',
    );
    expect(source).not.toMatch(/ANTHROPIC|GOOGLE|AZURE_OPENAI/);
  });

  it("refills the complete API key while keeping the input visually masked", () => {
    expect(source).toContain("<Input.Password");
    expect(source).toContain('autoComplete="new-password"');
    expect(source).toContain("visibilityToggle={false}");
    expect(source).toContain("apiKey: settings.apiKey");
    expect(source).toContain('form.setFieldValue("apiKey", saved.apiKey)');
    expect(source).toContain("testAIModelConnection");
    expect(source).toContain('submit("test")');
    expect(source).not.toContain("apiKeyPlaintext");
  });

  it("supports general and simple model purposes", () => {
    expect(source).toContain('settings.purpose === "GENERAL"');
    expect(source).toContain('t("aiModelGeneral")');
    expect(source).toContain('t("aiModelSimple")');
    expect(source).toContain("saveAIModelSettings(settings.purpose");
  });

  it("shows connection and saved configuration status", () => {
    expect(source).toContain("apiKeyConfigured");
    expect(source).toContain("connectionResult.success");
    expect(source).toContain("modelConnectionSucceeded");
    expect(source).toContain("modelSettingsSaved");
  });

  it("provides multiple Agent Gateway settings with masked token refill", () => {
    expect(source).toContain("AgentGatewayCard");
    expect(source).toContain("saveAgentGatewaySettings");
    expect(source).toContain("testAgentGatewaySettings");
    expect(source).toContain("deleteAgentGatewaySettings");
    expect(source).toContain("accessToken: settings?.accessToken");
    expect(source).toContain("agentGatewaySseTitle");
  });

  it("places the secondary test action before the primary save action", () => {
    const actions = source.match(
      /<Space wrap className="model-settings-actions">([\s\S]*?)<\/Space>/,
    )?.[1];

    expect(actions).toBeDefined();
    expect(actions?.indexOf('submit("test")')).toBeLessThan(
      actions?.indexOf('submit("save")') ?? -1,
    );
    expect(actions).toMatch(
      /submit\("test"\)[\s\S]*?<Button[\s\S]*?type="primary"[\s\S]*?submit\("save"\)/,
    );
  });

});
