import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough, Writable } from "node:stream";
import test from "node:test";
import {
  builderFrameUrl,
  builderRoutePrefix,
  builderWorkerPath,
  createBuilderWorker,
  rewriteBuilderText,
} from "./builder-worker.mjs";

test("builder iframe carries the editable OneOps organization context", () => {
  const url = new URL(builderFrameUrl("筑波大学", "ja-JP"), "https://oneops.test");
  assert.equal(url.pathname, `${builderRoutePrefix}/page`);
  assert.equal(url.searchParams.get("organisation_name"), "筑波大学");
  assert.equal(url.searchParams.get("locale"), "ja-JP");
});

test("builder worker pipe errors reject the request without ending OneOps", async () => {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.kill = () => {
    child.killed = true;
    return true;
  };
  child.stdin = new Writable({
    write(_chunk, _encoding, callback) {
      const error = Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
      callback(error);
    },
  });
  const messages = [];
  const worker = createBuilderWorker({
    pythonExecutable: "unused",
    workerPath: "unused",
    cwd: ".",
    env: {},
    log: (message) => messages.push(message),
    spawnProcess: () => {
      queueMicrotask(() => {
        child.stdout.write(`${JSON.stringify({ event: "ready" })}\n`);
      });
      return child;
    },
  });

  await assert.rejects(
    worker.request({ method: "GET", path: "/api/jobs" }),
    /write EPIPE/,
  );
  assert.equal(child.killed, true);
  assert.deepEqual(messages, ["write EPIPE"]);
});

test("builder gateway paths map back to the migrated worker contract", () => {
  assert.equal(
    builderWorkerPath(`${builderRoutePrefix}/api/jobs`, "?limit=20"),
    "/api/jobs?limit=20",
  );
  assert.equal(
    builderWorkerPath(`${builderRoutePrefix}/page`, "?organisation_name=A"),
    "/?organisation_name=A",
  );
});

test("builder assets and API requests stay on the OneOps origin", () => {
  const rewritten = rewriteBuilderText(`
    <link href="/style.css">
    <script src="/app.js"></script>
    <iframe data-src="/build-terminal/"></iframe>
    <script>fetch('/api/jobs'); fetch(\`/build-terminal/api/builds\`)</script>
  `);
  assert.match(
    rewritten,
    new RegExp(`${builderRoutePrefix}/style.css`.replaceAll("/", "\\/")),
  );
  assert.match(
    rewritten,
    new RegExp(`${builderRoutePrefix}/app.js`.replaceAll("/", "\\/")),
  );
  assert.match(
    rewritten,
    new RegExp(`${builderRoutePrefix}/build-terminal/`.replaceAll("/", "\\/")),
  );
  assert.match(
    rewritten,
    new RegExp(`${builderRoutePrefix}/api/jobs`.replaceAll("/", "\\/")),
  );
  assert.doesNotMatch(
    rewritten,
    new RegExp(
      `${builderRoutePrefix}${builderRoutePrefix}`.replaceAll("/", "\\/"),
    ),
  );
});
