import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export const builderRoutePrefix = "/api/work-center/v1/builder";

export function builderWorkerPath(pathname, search = "") {
  const suffix = pathname.slice(builderRoutePrefix.length);
  if (!suffix || suffix === "/page") return `/${search}`;
  if (suffix.startsWith("/page/")) {
    return `${suffix.slice("/page".length)}${search}`;
  }
  return `${suffix}${search}`;
}

export function rewriteBuilderText(text, prefix = builderRoutePrefix) {
  return String(text)
    .replace(
      /(["'`])\/(api|build-terminal)\//g,
      `$1${prefix}/$2/`,
    )
    .replace(/href="\/style\.css/g, `href="${prefix}/style.css`)
    .replace(/src="\/app\.js/g, `src="${prefix}/app.js`);
}

export function builderFrameUrl(organizationName, locale) {
  const query = new URLSearchParams({
    organisation_name: String(organizationName ?? ""),
    locale: String(locale ?? "ja-JP"),
  });
  return `${builderRoutePrefix}/page?${query}`;
}

export function createBuilderWorker({
  pythonExecutable,
  workerPath,
  cwd,
  env,
  log = () => {},
}) {
  let child = null;
  let readyPromise = null;
  let readyResolve = null;
  let readyReject = null;
  const pending = new Map();

  function rejectPending(error) {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  }

  function start() {
    if (child && readyPromise) return readyPromise;
    readyPromise = new Promise((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });
    child = spawn(pythonExecutable, ["-u", workerPath], {
      cwd,
      env: { ...process.env, ...env },
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = createInterface({ input: child.stdout });
    stdout.on("line", (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      if (message.event === "ready") {
        readyResolve?.(message);
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      waiter.resolve(message);
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => log(String(chunk)));
    child.on("error", (error) => {
      readyReject?.(error);
      rejectPending(error);
      child = null;
      readyPromise = null;
    });
    child.on("exit", (code, signal) => {
      const error = new Error(
        `OneOps builder worker exited (${code ?? "null"}/${signal ?? "none"})`,
      );
      readyReject?.(error);
      rejectPending(error);
      child = null;
      readyPromise = null;
    });
    return readyPromise;
  }

  async function request({ method, path, headers = {}, body = Buffer.alloc(0) }) {
    await start();
    if (!child?.stdin.writable) {
      throw new Error("OneOps builder worker is unavailable");
    }
    const id = randomUUID();
    const responsePromise = new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
    child.stdin.write(
      `${JSON.stringify({
        id,
        method,
        path,
        headers,
        bodyBase64: Buffer.from(body).toString("base64"),
      })}\n`,
    );
    return responsePromise;
  }

  function close() {
    if (child?.stdin.writable) child.stdin.end();
  }

  return { start, request, close };
}

export function sendBuilderWorkerResponse(response, workerResponse) {
  const headers = { ...(workerResponse.headers ?? {}) };
  delete headers["Set-Cookie"];
  delete headers["set-cookie"];
  if (workerResponse.filePath) {
    response.writeHead(workerResponse.status ?? 200, headers);
    createReadStream(workerResponse.filePath).pipe(response);
    return;
  }
  const body = Buffer.from(workerResponse.bodyBase64 ?? "", "base64");
  headers["Content-Length"] = String(body.length);
  response.writeHead(workerResponse.status ?? 200, headers);
  response.end(body);
}
