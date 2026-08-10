import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const japaneseText = /[ぁ-んァ-ヶ]/;
const simplifiedMarkers =
  /网站|文档|用户|创建|任务|订阅|审批|页面|结果|失败|运行|显示|权限|下载|响应|查询|变更|错误|处理|建议|接收|完整|数据库/;

const primaryDocuments = [
  "AGENTS.md",
  "README.md",
  "CHANGELOG.md",
  "app/README.md",
  "docs/README.md",
  "docs/PROJECT_RULES.md",
  "docs/VERSIONING.md",
  "docs/investigations/github-master-initial-import-20260727/investigation_report.md",
  "docs/investigations/github-master-initial-import-20260727/evidence_index.md",
  "docs/investigations/github-master-initial-import-20260727/commands.md",
  "docs/investigations/github-master-initial-import-20260727/test_results.md",
  "docs/investigations/github-master-initial-import-20260727/FINAL_RECEIPT.md",
  "docs/investigations/project-language-ja-20260727/investigation_report.md",
  "docs/investigations/project-language-ja-20260727/evidence_index.md",
  "docs/investigations/project-language-ja-20260727/commands.md",
  "docs/investigations/project-language-ja-20260727/test_results.md",
  "docs/investigations/project-language-ja-20260727/FINAL_RECEIPT.md",
];

const excludedDirectories = new Set([
  ".standalone-template",
  "addons",
  "builder-data",
  "coverage",
  "dist",
  "node_modules",
  "third-party",
]);

function sourceFiles(root) {
  const results = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...sourceFiles(path));
    } else if (
      [".js", ".mjs", ".ts", ".tsx", ".py", ".ps1"].includes(
        extname(entry.name),
      )
    ) {
      results.push(path);
    }
  }
  return results;
}

function proseComments(path) {
  const extension = extname(path);
  const pattern =
    extension === ".py" || extension === ".ps1"
      ? /^\s*#\s+(.+)$/
      : extension === ".sql"
        ? /^\s*--\s+(.+)$/
        : /^\s*\/\/\s+(.+)$/;
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .flatMap((line, index) => {
      const match = line.match(pattern);
      return match ? [{ line: index + 1, text: match[1] }] : [];
    });
}

test("主要文書は日本語を第一言語として使用する", () => {
  for (const relativePath of primaryDocuments) {
    const path = join(projectRoot, relativePath);
    assert.equal(existsSync(path), true, relativePath);
    const text = readFileSync(path, "utf8");
    assert.match(text, japaneseText, relativePath);
    assert.doesNotMatch(text, simplifiedMarkers, relativePath);
  }
  assert.equal(
    existsSync(join(projectRoot, "docs/Web層Agent Gateway技術仕様書.docx")),
    true,
  );
});

test("公開対象のプロジェクトバージョンはルート VERSION と一致する", () => {
  const version = readFileSync(join(projectRoot, "VERSION"), "utf8").trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);

  for (const relativePath of [
    "app/package.json",
    "app/apps/portal-shell/package.json",
  ]) {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, relativePath), "utf8"),
    );
    assert.equal(packageJson.version, version, relativePath);
  }

  const versionMarkers = [
    ["README.md", `現行バージョン: \`${version}\``],
    ["CHANGELOG.md", `## ${version} - `],
    ["app/README.md", `現行バージョンは \`${version}\``],
    ["app/apps/portal-shell/src/App.tsx", `OneOps v${version}`],
    ["app/backend/pom.xml", `<version>${version}</version>`],
    [
      "app/backend/src/main/resources/application.yaml",
      `version: \${ONEOPS_VERSION:${version}}`,
    ],
    [
      "app/backend/src/main/java/jp/onehr/oneops/platform/web/HealthController.java",
      `@Value("\${oneops.version:${version}}")`,
    ],
  ];

  for (const [relativePath, marker] of versionMarkers) {
    const text = readFileSync(join(projectRoot, relativePath), "utf8");
    assert.equal(text.includes(marker), true, relativePath);
  }
});

test("ソースコードの説明コメントは日本語を使用する", () => {
  const violations = [];
  for (const path of sourceFiles(join(projectRoot, "app"))) {
    for (const comment of proseComments(path)) {
      if (!japaneseText.test(comment.text)) {
        violations.push(
          `${path.slice(projectRoot.length + 1)}:${comment.line} ${comment.text}`,
        );
      }
    }
  }
  assert.equal(
    violations.length,
    0,
    violations.slice(0, 20).join("\n"),
  );
});

test("第三者上流 snapshot は説明コメント検査から分離する", () => {
  const animationPackage = join(
    projectRoot,
    "app/packages/animated-loading-buttons/src",
  );
  assert.equal(
    sourceFiles(animationPackage).some((path) =>
      path.includes(`${join("src", "third-party")}`)
    ),
    false,
  );
});
