import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync(
  new URL("./customer-information-routes.mjs", import.meta.url),
  "utf8",
);

test("顧客ナレッジ操作は管理者権限へ統一する", () => {
  assert.doesNotMatch(routeSource, /customer\.knowledge\.(scan|review)/);
  assert.ok(
    routeSource.match(/customer\.knowledge\.manage/g)?.length >= 6,
    "Scan 参照と全変更操作に管理者権限が必要です。",
  );
  assert.match(routeSource, /CUSTOMER_KNOWLEDGE_MANAGEMENT_FORBIDDEN/);
});
