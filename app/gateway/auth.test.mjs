import assert from "node:assert/strict";
import test from "node:test";
import {
  SsoNonceStore,
  hasPermission,
  hashPassword,
  isAllowedSsoPrincipal,
  isWindowsMachineAccount,
  parseCookies,
  requiredPermission,
  safeReturnPath,
  sessionCookies,
  signSsoRequest,
  validateProfileInput,
  validateRegistration,
  verifyPassword,
  verifySsoRequest,
} from "./auth.mjs";

test("profile validation trims Unicode display names", () => {
  const result = validateProfileInput({
    displayName: "  孫 少宣  ",
  });
  assert.equal(result.valid, true);
  assert.equal(result.profile.displayName, "孫 少宣");
});

test("profile validation rejects empty and oversized display names", () => {
  assert.equal(validateProfileInput({ displayName: "   " }).valid, false);
  assert.equal(validateProfileInput({ displayName: "名".repeat(121) }).valid, false);
});

test("registration validation normalizes valid input", () => {
  const result = validateRegistration({
    username: "  Test.User ",
    email: " Test@Example.com ",
    displayName: "Test User",
    password: "Strong-pass-2026!",
  });
  assert.equal(result.valid, true);
  assert.equal(result.registration.username, "test.user");
  assert.equal(result.registration.email, "test@example.com");
});

test("registration validation rejects weak credentials", () => {
  const result = validateRegistration({
    username: "x",
    displayName: "",
    password: "short",
  });
  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "displayName",
    "password",
    "username",
  ]);
});

test("scrypt password hashes verify without exposing the password", async () => {
  const encoded = await hashPassword("Strong-pass-2026!");
  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes("Strong-pass-2026!"), false);
  assert.equal(await verifyPassword("Strong-pass-2026!", encoded), true);
  assert.equal(await verifyPassword("wrong-password", encoded), false);
});

test("session cookies use secure session and readable csrf separation", () => {
  const cookies = sessionCookies("session-token", "csrf-token", 3600);
  assert.match(cookies[0], /HttpOnly/);
  assert.match(cookies[0], /Secure/);
  assert.doesNotMatch(cookies[1], /HttpOnly/);
  assert.equal(
    parseCookies("oneops_session=session-token; oneops_csrf=csrf-token")
      .oneops_csrf,
    "csrf-token",
  );
});

test("signed SSO requests accept once and reject replay", () => {
  const timestamp = Date.now();
  const headers = {
    "x-oneops-remote-user": "EXAMPLE\\x12345",
    "x-oneops-remote-upn": "x12345@tokyo.scientia.co.jp",
    "x-oneops-auth-timestamp": String(timestamp),
    "x-oneops-auth-nonce": "nonce-1",
  };
  headers["x-oneops-auth-signature"] = signSsoRequest(
    "secret",
    "GET",
    "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F",
    headers["x-oneops-remote-user"],
    headers["x-oneops-remote-upn"],
    headers["x-oneops-auth-timestamp"],
    headers["x-oneops-auth-nonce"],
  );
  const nonceStore = new SsoNonceStore();
  const first = verifySsoRequest({
    secret: "secret",
    method: "GET",
    pathAndQuery:
      "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F",
    headers,
    nonceStore,
    now: timestamp,
  });
  assert.equal(first.valid, true);
  const replay = verifySsoRequest({
    secret: "secret",
    method: "GET",
    pathAndQuery:
      "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F",
    headers,
    nonceStore,
    now: timestamp,
  });
  assert.equal(replay.valid, false);
  assert.equal(replay.code, "SSO_ASSERTION_REPLAYED");
});

test("SSO assertions reject machine accounts", () => {
  const old = Date.now() - 300_000;
  const headers = {
    "x-oneops-remote-user": "EXAMPLE\\computer$",
    "x-oneops-remote-upn": "computer$@tokyo.scientia.co.jp",
    "x-oneops-auth-timestamp": String(old),
    "x-oneops-auth-nonce": "nonce-2",
    "x-oneops-auth-signature": "invalid",
  };
  const result = verifySsoRequest({
    secret: "secret",
    method: "GET",
    pathAndQuery: "/sso",
    headers,
    nonceStore: new SsoNonceStore(),
  });
  assert.equal(isWindowsMachineAccount(headers["x-oneops-remote-user"]), true);
  assert.equal(result.code, "SSO_MACHINE_ACCOUNT_REJECTED");
});

test("SSO assertions only accept signed tokyo.scientia.co.jp principals", () => {
  const timestamp = Date.now();
  const path = "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F";
  const headers = {
    "x-oneops-remote-user": "EXAMPLE\\external",
    "x-oneops-remote-upn": "external@example.jp",
    "x-oneops-auth-timestamp": String(timestamp),
    "x-oneops-auth-nonce": "nonce-domain",
  };
  headers["x-oneops-auth-signature"] = signSsoRequest(
    "secret",
    "GET",
    path,
    headers["x-oneops-remote-user"],
    headers["x-oneops-remote-upn"],
    headers["x-oneops-auth-timestamp"],
    headers["x-oneops-auth-nonce"],
  );
  const result = verifySsoRequest({
    secret: "secret",
    method: "GET",
    pathAndQuery: path,
    headers,
    nonceStore: new SsoNonceStore(),
    now: timestamp,
    allowedDomains: ["tokyo.scientia.co.jp"],
  });
  assert.equal(
    isAllowedSsoPrincipal(
      "user@tokyo.scientia.co.jp",
      ["tokyo.scientia.co.jp"],
    ),
    true,
  );
  assert.equal(
    isAllowedSsoPrincipal(
      "user@sub.tokyo.scientia.co.jp",
      ["tokyo.scientia.co.jp"],
    ),
    false,
  );
  assert.equal(result.valid, false);
  assert.equal(result.code, "SSO_DOMAIN_NOT_ALLOWED");
});

test("permission mapping and scoped checks enforce the backend boundary", () => {
  assert.equal(
    requiredPermission("POST", "/api/work-center/v1/organizations"),
    "organizations.write",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/organizations/1/environment-inventory",
    ),
    "environments.read",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/environment-endpoint-credentials/12",
    ),
    "environments.credentials.read",
  );
  assert.equal(
    requiredPermission("PUT", "/api/work-center/v1/products/3"),
    "catalog.write",
  );
  assert.equal(
    requiredPermission(
      "PUT",
      "/api/work-center/v1/product-version-modules/18",
    ),
    "catalog.write",
  );
  assert.equal(
    requiredPermission("POST", "/api/work-center/v1/builder/api/jobs"),
    "builder.use",
  );
  assert.equal(
    requiredPermission("GET", "/api/work-center/v1/builder/page"),
    "builder.use",
  );
  assert.equal(
    requiredPermission("GET", "/api/work-center/v1/ai-settings"),
    "models.settings.read",
  );
  assert.equal(
    requiredPermission(
      "POST",
      "/api/work-center/v1/ai-settings/agent-gateways/test",
    ),
    "models.settings.write",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/agent-gateways/id/tasks/task/events",
    ),
    "models.settings.read",
  );
  assert.equal(
    requiredPermission(
      "POST",
      "/api/work-center/v1/ai-assistant/sessions/id/messages",
    ),
    "ai.assistant.use",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/ai-assistant/shortcuts/admin",
    ),
    "models.settings.read",
  );
  assert.equal(
    requiredPermission(
      "PUT",
      "/api/work-center/v1/ai-assistant/shortcuts/admin/20000000-0000-4000-8000-000000000001",
    ),
    "models.settings.write",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/ai-assistant/shortcuts",
    ),
    "ai.assistant.use",
  );
  assert.equal(
    requiredPermission(
      "GET",
      "/api/work-center/v1/reports/ai-token-usage",
    ),
    "reports.ai-token-usage.read",
  );
  for (const [method, path] of [
    ["GET", "/api/work-center/v1/customers/12/knowledge-scans/latest"],
    ["POST", "/api/work-center/v1/customers/12/knowledge-scans"],
    ["POST", "/api/work-center/v1/customers/12/knowledge-scans/id/reanalyze"],
    ["POST", "/api/work-center/v1/customers/12/knowledge-scans/id/reingest"],
    ["POST", "/api/work-center/v1/customers/12/knowledge-scans/id/candidates/id/apply"],
  ]) {
    assert.equal(
      requiredPermission(method, path),
      "customer.knowledge.manage",
    );
  }
  const profile = {
    status: "ACTIVE",
    systemPermissions: ["dashboard.read"],
    organizationPermissions: { "12": ["environments.read"] },
  };
  assert.equal(hasPermission(profile, "dashboard.read"), true);
  assert.equal(hasPermission(profile, "environments.read", "12"), true);
  assert.equal(hasPermission(profile, "environments.write", "12"), false);
});

test("return paths stay on the OneOps origin", () => {
  assert.equal(safeReturnPath("/admin?tab=users"), "/admin?tab=users");
  assert.equal(safeReturnPath("https://example.test/steal"), "/");
  assert.equal(safeReturnPath("//example.test/steal"), "/");
  assert.equal(safeReturnPath("/\\example.test"), "/");
});
