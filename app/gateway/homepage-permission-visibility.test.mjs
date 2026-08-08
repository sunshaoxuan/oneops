import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SSE 接続は利用者セッションを再解決して権限変更へ追従する", async () => {
  const source = await readFile(new URL("./server.mjs", import.meta.url), "utf8");

  assert.match(source, /parseCookies\(request\.headers\.cookie\)/);
  assert.match(source, /sseProfileRefreshIntervalMs = 5000/);
  assert.match(source, /identityRepository\s*\.resolveSession\(state\.sessionToken\)/);
  assert.match(source, /await broadcast\(latestSnapshot\)/);
  assert.match(source, /filterSnapshotForProfile\(\s*snapshot,\s*state\.profile/s);
});
