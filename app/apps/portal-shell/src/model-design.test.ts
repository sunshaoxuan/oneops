import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/ModelDesignPage.tsx"),
  "utf8",
);
const styles = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);
const secretInput = readFileSync(
  resolve(process.cwd(), "src/SecretInput.tsx"),
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

  it("refills the complete API key with reveal and copy controls", () => {
    expect(source).toContain("<SecretInput");
    expect(source).toContain('autoComplete="new-password"');
    expect(source).toContain('copyLabel={t("copySecret")}');
    expect(secretInput).toContain("<Input.Password");
    expect(secretInput).toContain("navigator.clipboard.writeText(secret)");
    expect(secretInput).not.toContain("visibilityToggle={false}");
    expect(source).toContain("apiKey: settings.apiKey");
    expect(source).toContain('form.setFieldValue("apiKey", saved.apiKey)');
    expect(source).toContain("testAIModelConnection");
    expect(source).toContain("discoverAIModels");
    expect(source).toContain('t("loadModelList")');
    expect(source).toContain("options={availableModels.map");
    expect(source).not.toContain('placeholder="gpt-5.6-sol"');
    expect(source).toContain('submit("test")');
    expect(source).not.toContain("apiKeyPlaintext");
  });

  it("supports multiple general models and one inquiry default model", () => {
    expect(source).toContain('settings.purpose === "GENERAL"');
    expect(source).toContain('t("aiModelGeneralNew")');
    expect(source).toContain('t("aiModelInquiry")');
    expect(source).toContain("saveAIModelSettings(settings.id");
    expect(source).toContain("deleteAIModelSettings");
    expect(source).toContain('name="reasoningEffort"');
    expect(source).toContain('name="speedLevel"');
    expect(source).not.toContain('t("aiModelSimple")');
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

  it("keeps long Agent Gateway connection fields in the wide column", () => {
    const gatewayCard = source.match(
      /function AgentGatewayCard\([\s\S]*?export function ModelDesignPage/,
    )?.[0];

    expect(gatewayCard).toBeDefined();
    expect(gatewayCard).toContain(
      'className="model-settings-form agent-gateway-form"',
    );
    expect(gatewayCard?.indexOf('className="agent-gateway-enabled"')).toBeLessThan(
      gatewayCard?.indexOf('className="agent-gateway-token"') ?? -1,
    );
    expect(styles).toMatch(
      /\.agent-gateway-endpoint\s*\{[\s\S]*?grid-column:\s*2;/,
    );
    expect(styles).toMatch(
      /\.agent-gateway-fallback-endpoints\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2;/,
    );
    expect(styles).toMatch(
      /\.agent-gateway-token\s*\{[\s\S]*?grid-column:\s*2;/,
    );
    expect(styles).toMatch(
      /@media \(max-width: 900px\)[\s\S]*?\.agent-gateway-token[\s\S]*?grid-column:\s*1;/,
    );
  });

  it("places the secondary test action before the primary save action", () => {
    const actions = source.match(
      /<Space wrap className="management-card-actions">([\s\S]*?)<\/Space>/,
    )?.[1];

    expect(actions).toBeDefined();
    expect(actions?.indexOf('submit("test")')).toBeLessThan(
      actions?.indexOf('submit("save")') ?? -1,
    );
    expect(actions).toMatch(
      /submit\("test"\)[\s\S]*?<Button[\s\S]*?type="primary"[\s\S]*?submit\("save"\)/,
    );
  });

  it("keeps update metadata and actions in one shared footer", () => {
    const modelCard = source.match(
      /function ModelSettingsCard\([\s\S]*?function AgentGatewayCard/,
    )?.[0];
    const gatewayCard = source.match(
      /function AgentGatewayCard\([\s\S]*?export function ModelDesignPage/,
    )?.[0];

    expect(modelCard).toMatch(
      /className="management-card-footer"[\s\S]*?model-settings-updated[\s\S]*?management-card-actions/,
    );
    expect(gatewayCard).toMatch(
      /className="management-card-footer"[\s\S]*?model-settings-updated[\s\S]*?management-card-actions/,
    );
    expect(source).not.toContain('className="model-settings-actions"');
  });

});
