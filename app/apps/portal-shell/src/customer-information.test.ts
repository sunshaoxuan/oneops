import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  safeExternalHttpUrl,
  selectedBacklogProjects,
} from "./customer-information-utils";

const page = readFileSync(
  resolve(process.cwd(), "src/CustomerInformationPage.tsx"),
  "utf8",
);
const masterPage = readFileSync(
  resolve(process.cwd(), "src/App.tsx"),
  "utf8",
);
const api = readFileSync(
  resolve(process.cwd(), "../../packages/api-client/src/index.ts"),
  "utf8",
);
const navigation = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);
const styles = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);

describe("顧客情報", () => {
  it("七頁と旧環境台帳を一つの顧客画面へ配置する", () => {
    for (const key of ["basic", "customization", "contracts", "services", "network", "inquiries", "tasks"]) {
      expect(page).toContain(`key: "${key}"`);
    }
    expect(page).toContain('customization: "カスタマイズ情報"');
    expect(page).toContain('customization: "客户化信息"');
    expect(page).toContain('customization: "Customization information"');
    expect(page).toContain("customizationEmpty");
    expect(page).toContain("<EnvironmentPage");
    expect(page).toContain("embedded />");
  });

  it("問合と Backlog に独立したページ番号を使用する", () => {
    expect(page).toContain("setInquiryPage");
    expect(page).toContain("setIssuePage");
    expect(api).toContain("fetchCustomerInquiryPage");
    expect(api).toContain("fetchCustomerBacklogIssuePage");
  });

  it("正式 URL と旧 URL の互換を保持する", () => {
    expect(navigation).toContain('environments: "/customers"');
    expect(navigation).toContain('normalized === "/environments"');
  });

  it("固定側欄の横で頁内容を縮小し横方向の画面溢れを防ぐ", () => {
    expect(styles).toMatch(/\.customer-information-page\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
    expect(styles).toMatch(/\.customer-information-tabs[\s\S]*min-width:\s*0/);
  });

  it("Backlog プロジェクトは外部物理 ID で対応付ける", () => {
    const options = [
      { externalProjectId: "7", projectKey: "OPS", projectName: "Operations" },
      { externalProjectId: "8", projectKey: "DEV", projectName: "Development" },
    ];
    expect(selectedBacklogProjects(["8"], options)).toEqual([options[1]]);
  });

  it("問合システム顧客 Code は組織機関台帳だけで編集する", () => {
    expect(masterPage).toContain('name="inquiryCustomerCode"');
    expect(masterPage).toContain('t("organizationInquiryCustomerCode")');
    expect(page).not.toContain("customer-setting-row");
    expect(page).not.toContain("saveCustomerInformationSettings");
    expect(api).not.toContain("saveCustomerInformationSettings");
  });

  it("問合と Backlog の全表示列を共通ルールで並べ替え、列幅を調整できる", () => {
    expect(page).toContain('useState<CustomerInquirySortField>("title")');
    expect(page).toContain('useState<CustomerBacklogIssueSortField>("summary")');
    expect(page).toContain('inquirySortOrderFor("title")');
    expect(page).toContain('issueSortOrderFor("summary")');
    expect(page.match(/sorter: true/g)).toHaveLength(14);
    expect(page).toContain("handleInquiryTableChange");
    expect(page).toContain("handleIssueTableChange");
    expect(page).toContain("CustomerResizableHeaderCell");
    expect(page).toContain("onHeaderCell: inquiryHeaderCell");
    expect(page).toContain("onHeaderCell: issueHeaderCell");
    expect(page).toContain('sortDirections={["ascend", "descend"]}');
    expect(api).toContain("sortField=${sortField}");
    expect(api).toContain("sortOrder=${sortOrder}");
  });

  it("学習済みナレッジを非同期スキャンし根拠付き候補だけを台帳へ反映する", () => {
    expect(page).toContain("startCustomerKnowledgeScan");
    expect(page).toContain("fetchLatestCustomerKnowledgeScan");
    expect(page).toContain("reviewCustomerKnowledgeScanCandidate");
    expect(page).toContain("candidate.evidenceRefs.map");
    expect(page).toContain("scanLearningGap");
    expect(page).toContain("scanFailureHelp");
    expect(page).toContain("message={knowledgeScan.errorCode}");
    expect(page).not.toContain("knowledgeScan.errorMessage ||");
    expect(api).toContain("interface CustomerKnowledgeScan");
    expect(api).toContain("interface CustomerKnowledgeScanCandidate");
    expect(styles).toContain(".customer-knowledge-candidate-grid");
  });

  it("外部リンクは HTTP と HTTPS だけを許可する", () => {
    expect(safeExternalHttpUrl("https://example.backlog.com/view/OPS-1")).toBe(
      "https://example.backlog.com/view/OPS-1",
    );
    expect(safeExternalHttpUrl("javascript:alert(1)")).toBeNull();
  });
});
