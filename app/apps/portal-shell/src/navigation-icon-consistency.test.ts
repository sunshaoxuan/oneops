import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const customerInformation = readFileSync(
  resolve(process.cwd(), "src/CustomerInformationPage.tsx"),
  "utf8",
);
const inquirySupport = readFileSync(
  resolve(process.cwd(), "src/InquirySupportPage.tsx"),
  "utf8",
);
const aiAssistant = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const personalTasks = readFileSync(
  resolve(process.cwd(), "src/PersonalTasksPage.tsx"),
  "utf8",
);

function primaryNavigationIcons() {
  const navigationSource = app.match(
    /const navigation: NavigationItem\[\] = \[([\s\S]*?)\n\];/,
  )?.[1];
  expect(navigationSource).toBeDefined();
  return Object.fromEntries(
    [...navigationSource!.matchAll(
      /\{\s+key: "([^"]+)",\s+icon: <([A-Za-z]+Outlined) \/>/g,
    )].map((match) => [match[1], match[2]]),
  );
}

describe("第1階層ナビゲーションの機能アイコン", () => {
  it("全ノードを業務別の一意なアイコンへ割り当てる", () => {
    const icons = primaryNavigationIcons();

    expect(icons).toEqual({
      workbench: "HomeOutlined",
      personalTasks: "CheckSquareOutlined",
      environments: "SolutionOutlined",
      consulting: "MessageOutlined",
      builder: "BuildOutlined",
      aiAssistant: "RobotOutlined",
      knowledge: "BookOutlined",
      codeInsight: "CodeOutlined",
      reports: "BarChartOutlined",
      masterData: "DatabaseOutlined",
      admin: "SettingOutlined",
    });
    expect(new Set(Object.values(icons)).size).toBe(Object.keys(icons).length);
  });

  it("主ナビゲーションと第1階層見出しの意味を一致させる", () => {
    expect(customerInformation).toContain(
      'className="portal-page-hero-icon"><SolutionOutlined />',
    );
    expect(inquirySupport).toContain(
      'className="module-icon"><MessageOutlined /></span>',
    );
    expect(aiAssistant).toContain(
      'className="ai-assistant-mark"><RobotOutlined /></span>',
    );
    expect(personalTasks).toContain(
      'className="portal-page-hero-icon"><CheckSquareOutlined /></span>',
    );
    expect(app).toContain("<DatabaseOutlined />");
    expect(app).toContain("<SettingOutlined />");
  });
});
