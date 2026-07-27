import { describe, expect, it } from "vitest";
import { messages, type LocaleKey, type MessageKey } from "./i18n";

const locales = Object.keys(messages) as LocaleKey[];

describe("portal i18n contract", () => {
  it("keeps the same non-empty keys in every locale", () => {
    const expectedKeys = Object.keys(messages["ja-JP"]).sort();

    for (const locale of locales) {
      expect(Object.keys(messages[locale]).sort()).toEqual(expectedKeys);
      for (const key of expectedKeys as MessageKey[]) {
        expect(messages[locale][key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("localizes visible operational labels for every locale", () => {
    const localeSpecificKeys: MessageKey[] = [
      "brandSubtitle",
      "globalContext",
      "dataFlowLabel",
      "degraded",
      "live",
      "roadmap",
      "roleSubtitle",
      "domainLabel",
      "capabilitiesLabel",
      "organizationDirectoryLabel",
      "organizationCode",
      "organizationName",
      "organizationMaintenanceStatus",
      "organizationDatabaseTitle",
      "systemManagement",
      "basicMasterManagement",
      "userManagement",
      "rolePermissionManagement",
      "authenticationAudit",
      "modelDesign",
      "modelProvider",
      "testModelConnection",
      "profileDisplayName",
      "profileSave",
      "organizationClassificationMaster",
      "masterCode",
      "integratingTitle",
      "statusFailed",
    ];

    for (const key of localeSpecificKeys) {
      expect(
        new Set(locales.map((locale) => messages[locale][key])).size,
        key,
      ).toBe(locales.length);
    }
  });

  it("keeps AI child function names consistent across locales", () => {
    for (const locale of locales) {
      expect(messages[locale].modelApiSettings).toBe("Model API");
      expect(messages[locale].agentGatewaySettings).toBe("Agent Gateways");
    }
  });

  it("does not use English section labels in the Japanese locale", () => {
    expect(messages["ja-JP"].brandSubtitle).toBe("導入・保守・支援");
    expect(messages["ja-JP"].globalContext).toBe("共通コンテキスト");
    expect(messages["ja-JP"].live).toBe("稼働中");
    expect(messages["ja-JP"].roadmap).toBe("計画中");
    expect(messages["ja-JP"].online).toBe("正常");
    expect(messages["ja-JP"].organizationCode).toBe("機関コード");
    expect(messages["ja-JP"].organizationName).toBe("機関名");
    expect(messages["ja-JP"].organizationClassification).toBe("区分");
    expect(messages["ja-JP"].organizationShortName).toBe("略称");
    expect(messages["ja-JP"].environments).toBe("環境情報");
    expect(messages["ja-JP"].consulting).toBe("問合支援");
    expect(messages["ja-JP"].consultingAssistant).toBe("問合支援");
    expect(messages["zh-CN"].environments).toBe("环境信息");
    expect(messages["en-US"].environments).toBe("Environment information");
  });

  it("keeps implementation technology out of the organization title", () => {
    expect(messages["zh-CN"].organizationCode).toBe("机关代码");
    expect(messages["zh-CN"].organizationName).toBe("机关名");
    expect(messages["zh-CN"].organizationClassification).toBe("区分");
    expect(messages["zh-CN"].organizationShortName).toBe("略称");

    for (const locale of locales) {
      expect(messages[locale].organizationDatabaseTitle).not.toMatch(
        /PostgreSQL/i,
      );
    }
  });

  it("uses the same system management name in navigation and page titles", () => {
    for (const locale of locales) {
      expect(messages[locale].admin).toBe(messages[locale].systemManagement);
    }
  });

  it("separates master data wording from system management", () => {
    expect(messages["ja-JP"].basicMasterManagement).toBe("基本台帳管理");
    expect(messages["zh-CN"].basicMasterManagement).toBe("基本台账管理");
    expect(messages["en-US"].basicMasterManagement).toBe(
      "Master data management",
    );
    expect(messages["ja-JP"].basicMasterManagementDescription).toContain(
      "組織機関",
    );
    expect(messages["zh-CN"].basicMasterManagementDescription).toContain(
      "组织机构",
    );
    for (const locale of locales) {
      expect(messages[locale].systemManagementDescription).not.toContain(
        messages[locale].basicMasterManagement,
      );
    }
  });

  it("describes product maintenance in business terms", () => {
    expect(messages["ja-JP"].productVersionMasterDescription).toBe(
      "共通製品、版数、機能モジュールを管理します。",
    );
    expect(messages["zh-CN"].productVersionMasterDescription).toBe(
      "管理公共产品、版本和功能模块。",
    );
    for (const locale of locales) {
      expect(messages[locale].productVersionMasterDescription).not.toMatch(
        /親・子・孫|主子孙|child|hierarchy/i,
      );
    }
  });
});
