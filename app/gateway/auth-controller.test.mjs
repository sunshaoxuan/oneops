import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { createAuthController } from "./auth-controller.mjs";
import { sha256, signSsoRequest } from "./auth.mjs";

function responseRecorder() {
  return {
    status: null,
    headers: {},
    body: "",
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body = "") {
      this.body = String(body);
    },
  };
}

function requestFor(url, headers = {}) {
  return {
    method: "GET",
    url,
    headers: {
      host: "oneops.example",
      "user-agent": "test",
      ...headers,
    },
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function jsonRequest(method, url, body, headers = {}) {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.method = method;
  request.url = url;
  request.headers = {
    host: "oneops.example",
    "user-agent": "test",
    "content-type": "application/json",
    ...headers,
  };
  request.socket = { remoteAddress: "127.0.0.1" };
  return request;
}

function formRequest(method, url, body, headers = {}) {
  const request = Readable.from([Buffer.from(new URLSearchParams(body).toString())]);
  request.method = method;
  request.url = url;
  request.headers = {
    host: "oneops.example",
    "user-agent": "test",
    "content-type": "application/x-www-form-urlencoded",
    ...headers,
  };
  request.socket = { remoteAddress: "127.0.0.1" };
  return request;
}

function repositoryDouble() {
  const calls = {
    provisionWindows: [],
    tickets: [],
    sessions: [],
    audits: [],
  };
  return {
    calls,
    repository: {
      async bootstrapState() {
        return { required: false };
      },
      async resolveSession() {
        return null;
      },
      async provisionWindows(input) {
        calls.provisionWindows.push(input);
        return {
          user: {
            id: "10000000-0000-4000-8000-000000000001",
            status: "ACTIVE",
          },
          created: true,
          bootstrap: false,
        };
      },
      async createLoginTicket(input) {
        calls.tickets.push(input);
      },
      async createSession(input) {
        calls.sessions.push(input);
      },
      async audit(input) {
        calls.audits.push(input);
      },
    },
  };
}

test("auth config advertises automatic Windows SSO only when fully configured", async () => {
  const { repository } = repositoryDouble();
  const controller = createAuthController({
    repository,
    ssoSharedSecret: "secret",
    windowsSsoProxyUrl: "http://domain-proxy:8998",
    allowedSsoDomains: ["tokyo.scientia.co.jp"],
    autoWindowsSso: true,
  });
  const request = requestFor("/api/work-center/v1/auth/config");
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );
  assert.equal(response.status, 200);
  const payload = JSON.parse(response.body);
  assert.equal(payload.windowsSsoEnabled, true);
  assert.equal(payload.windowsSsoAutoLogin, true);
});

test("self-registration is temporarily disabled without creating a user", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({ repository });
  const request = jsonRequest(
    "POST",
    "/api/work-center/v1/auth/register",
    { username: "new.user", displayName: "新規利用者", password: "Strong-password-123!" },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.equal(response.status, 403);
  assert.deepEqual(JSON.parse(response.body).error, {
    code: "REGISTRATION_DISABLED",
    message: "Self-registration is temporarily disabled",
    details: {},
  });
  assert.equal(calls.audits.length, 0);
});

test("auth config advertises EnvPortal SSO without a second domain proxy", async () => {
  const { repository } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://192.168.20.38:8999/auth_windows.jsp",
    autoWindowsSso: true,
  });
  const request = requestFor("/api/work-center/v1/auth/config");
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.deepEqual(JSON.parse(response.body), {
    bootstrapRequired: false,
    windowsSsoEnabled: true,
    windowsSsoAutoLogin: true,
    windowsSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
  });
});

test("verified EnvPortal identity provisions a viewer and starts a OneOps session", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://192.168.20.38:8999/auth_windows.jsp",
    allowedSsoDomains: ["tokyo.scientia.co.jp"],
    allowedSsoEmailDomains: ["onehr.jp"],
    allowedSsoWindowsDomains: ["tokyo"],
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://192.168.20.38:8999/auth_windows.jsp");
      assert.equal(options.headers["X-EnvPortal-Auth"], "envportal-token");
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            user: "x02851",
            upn: "x02851@tokyo.scientia.co.jp",
            displayName: "孫 少宣",
            email: "sun.shaoxuan@onehr.jp",
            department: "開発部",
            title: "Manager",
            windowsDomain: "tokyo",
            role: "admin",
          };
        },
      };
    },
  });
  const request = formRequest(
    "POST",
    "/api/work-center/v1/auth/sso/envportal/callback",
    { token: "envportal-token", returnTo: "/environments" },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.Location, "/environments");
  assert.equal(calls.provisionWindows.length, 1);
  assert.deepEqual(calls.provisionWindows[0], {
    subject: "TOKYO\\x02851",
    upn: "x02851@tokyo.scientia.co.jp",
    displayName: "孫 少宣",
    email: "sun.shaoxuan@onehr.jp",
    department: "開発部",
    title: "Manager",
  });
  assert.equal(calls.sessions.length, 1);
  assert.equal(calls.audits[0].details.identitySource, "ENVPORTAL");
  assert.ok(Array.isArray(response.headers["Set-Cookie"]));
});

test("EnvPortal roles are ignored and identities outside the allowed UPN domain are rejected", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://192.168.20.38:8999/auth_windows.jsp",
    allowedSsoDomains: ["tokyo.scientia.co.jp"],
    allowedSsoEmailDomains: ["onehr.jp"],
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          user: "outside.user",
          email: "outside.user@example.com",
          role: "admin",
        };
      },
    }),
  });
  const request = formRequest(
    "POST",
    "/api/work-center/v1/auth/sso/envportal/callback",
    { token: "envportal-token", returnTo: "/" },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.equal(response.status, 403);
  assert.equal(calls.provisionWindows.length, 0);
  assert.equal(
    JSON.parse(response.body).error.code,
    "ENVPORTAL_IDENTITY_REJECTED",
  );
  assert.deepEqual(JSON.parse(response.body).error.details, {
    profileAccepted: true,
    subjectPresent: true,
    machineAccount: false,
    upnPresent: false,
    upnDomainAllowed: false,
    emailPresent: true,
    emailDomainAllowed: false,
    windowsDomainPresent: false,
    windowsDomainAllowed: false,
    accountLinkConfigured: false,
    accountLinkEmailAllowed: false,
  });
});

test("trusted EnvPortal Windows domain links the configured corporate mailbox when AD email is absent", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://envportal:8999/auth_windows.jsp",
    publicBaseUrl: "https://oneops.example",
    allowedSsoDomains: ["tokyo.scientia.co.jp"],
    allowedSsoEmailDomains: ["onehr.jp"],
    allowedSsoWindowsDomains: ["tokyo"],
    ssoWindowsUpnSuffixes: {
      tokyo: "tokyo.scientia.co.jp",
    },
    ssoAccountLinks: {
      "x02851@tokyo.scientia.co.jp": "sun.shaoxuan@onehr.jp",
    },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          user: "x02851",
          displayName: "x02851",
          email: "",
          windowsDomain: "tokyo",
          role: "admin",
        };
      },
    }),
  });
  const request = formRequest(
    "POST",
    "/api/work-center/v1/auth/sso/envportal/callback",
    { token: "envportal-token", returnTo: "/" },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.equal(response.status, 303);
  assert.equal(calls.provisionWindows.length, 1);
  assert.deepEqual(calls.provisionWindows[0], {
    subject: "TOKYO\\x02851",
    upn: "x02851@tokyo.scientia.co.jp",
    displayName: "x02851",
    email: "sun.shaoxuan@onehr.jp",
    department: "",
    title: "",
  });
  assert.equal(
    calls.provisionWindows[0].upn,
    "x02851@tokyo.scientia.co.jp",
  );
  assert.equal(calls.audits[0].eventType, "WINDOWS_USER_PROVISIONED");
});

test("signed tokyo.scientia.co.jp SSO provisions an active account and creates a login ticket", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    ssoSharedSecret: "secret",
    windowsSsoProxyUrl: "http://domain-proxy:8998",
    publicBaseUrl: "https://oneops.example",
    allowedSsoDomains: ["tokyo.scientia.co.jp"],
  });
  const path = "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F";
  const timestamp = String(Date.now());
  const headers = {
    "x-oneops-remote-user": "TOKYO\\viewer.user",
    "x-oneops-remote-upn": "viewer.user@tokyo.scientia.co.jp",
    "x-oneops-remote-display-name": encodeURIComponent("Viewer User"),
    "x-oneops-auth-timestamp": timestamp,
    "x-oneops-auth-nonce": "controller-test-nonce",
  };
  headers["x-oneops-auth-signature"] = signSsoRequest(
    "secret",
    "GET",
    path,
    headers["x-oneops-remote-user"],
    headers["x-oneops-remote-upn"],
    timestamp,
    headers["x-oneops-auth-nonce"],
  );
  const request = requestFor(path, headers);
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );
  assert.equal(response.status, 200);
  assert.equal(calls.provisionWindows.length, 1);
  assert.equal(
    calls.provisionWindows[0].upn,
    "viewer.user@tokyo.scientia.co.jp",
  );
  assert.equal(calls.tickets.length, 1);
  assert.equal(calls.tickets[0].returnPath, "/");
  assert.match(response.body, /method="post"/);
  assert.match(response.body, /https:\/\/oneops\.example\/api\/work-center/);
  assert.equal(calls.audits[0].eventType, "WINDOWS_USER_PROVISIONED");
});

test("authenticated users can update their own display name with CSRF protection", async () => {
  const calls = { profiles: [], audits: [] };
  const repository = {
    async resolveSession(token) {
      assert.equal(token, "session-token");
      return {
        id: "10000000-0000-4000-8000-000000000001",
        username: "sun.shaoxuan",
        email: "sun.shaoxuan@onehr.jp",
        displayName: "Sun Shaoxuan",
        locale: "ja-JP",
        status: "ACTIVE",
        sessionId: "20000000-0000-4000-8000-000000000001",
        csrfHash: sha256("csrf-token"),
        systemPermissions: [],
        organizationPermissions: {},
      };
    },
    async updateProfile(userId, profile) {
      calls.profiles.push({ userId, profile });
      return {
        id: userId,
        username: "sun.shaoxuan",
        email: "sun.shaoxuan@onehr.jp",
        displayName: profile.displayName,
        locale: "ja-JP",
        status: "ACTIVE",
      };
    },
    async audit(input) {
      calls.audits.push(input);
    },
  };
  const controller = createAuthController({ repository });
  const request = jsonRequest(
    "PUT",
    "/api/work-center/v1/auth/profile",
    { displayName: "  孫 少宣  " },
    {
      cookie:
        "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "http://oneops.example"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls.profiles, [
    {
      userId: "10000000-0000-4000-8000-000000000001",
      profile: { displayName: "孫 少宣" },
    },
  ]);
  assert.equal(JSON.parse(response.body).user.displayName, "孫 少宣");
  assert.equal(calls.audits[0].eventType, "PROFILE_UPDATED");
  assert.deepEqual(calls.audits[0].details, {
    fields: ["displayName"],
  });
});

function windowsIdentityAdminRepository(calls, options = {}) {
  const admin = {
    id: "10000000-0000-4000-8000-000000000001",
    username: "admin.user",
    displayName: "管理者",
    email: "admin@onehr.jp",
    status: "ACTIVE",
    sessionId: "20000000-0000-4000-8000-000000000001",
    csrfHash: sha256("csrf-token"),
    systemPermissions: options.permissions ?? ["identity.users.write"],
    organizationPermissions: {},
  };
  return {
    async resolveSession() {
      return admin;
    },
    async bindWindowsIdentity(userId, identity) {
      calls.bindings.push({ userId, identity });
      if (options.conflict) {
        throw Object.assign(new Error("conflict"), {
          code: "WINDOWS_IDENTITY_CONFLICT",
        });
      }
      return {
        provider: "WINDOWS",
        subject: identity.subject,
        windowsDomain: "TOKYO",
        domainUsername: "x03056",
        upn: identity.upn,
      };
    },
    async unbindWindowsIdentity(userId) {
      calls.unbindings.push(userId);
      return {
        provider: "WINDOWS",
        subject: "TOKYO\\x03056",
        windowsDomain: "TOKYO",
        domainUsername: "x03056",
        upn: "x03056@tokyo.scientia.co.jp",
      };
    },
    async audit(input) {
      calls.audits.push(input);
    },
  };
}

test("administrators can bind an allowed Windows identity to a physical user", async () => {
  const calls = { bindings: [], unbindings: [], audits: [] };
  const controller = createAuthController({
    repository: windowsIdentityAdminRepository(calls),
  });
  const userId = "10000000-0000-4000-8000-000000000056";
  const request = jsonRequest(
    "PUT",
    `/api/work-center/v1/auth/users/${userId}/windows-identity`,
    {
      subject: "tokyo\\X03056",
      upn: "X03056@tokyo.scientia.co.jp",
    },
    {
      cookie: "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls.bindings, [{
    userId,
    identity: {
      subject: "TOKYO\\x03056",
      upn: "x03056@tokyo.scientia.co.jp",
    },
  }]);
  assert.equal(calls.audits[0].eventType, "WINDOWS_IDENTITY_ADMIN_LINKED");
  assert.equal(calls.audits[0].targetId, userId);
});

test("administrator Windows identity binding reports validation and ownership conflicts", async () => {
  const calls = { bindings: [], unbindings: [], audits: [] };
  const controller = createAuthController({
    repository: windowsIdentityAdminRepository(calls, { conflict: true }),
  });
  const userId = "10000000-0000-4000-8000-000000000056";
  const invalidRequest = jsonRequest(
    "PUT",
    `/api/work-center/v1/auth/users/${userId}/windows-identity`,
    { subject: "OTHER\\x03056", upn: "other@example.com" },
    {
      cookie: "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const invalidResponse = responseRecorder();
  await controller.handle(
    invalidRequest,
    invalidResponse,
    new URL(invalidRequest.url, "https://oneops.example"),
  );
  assert.equal(invalidResponse.status, 400);
  assert.equal(
    JSON.parse(invalidResponse.body).error.code,
    "WINDOWS_IDENTITY_VALIDATION_FAILED",
  );
  assert.equal(calls.bindings.length, 0);

  const conflictRequest = jsonRequest(
    "PUT",
    `/api/work-center/v1/auth/users/${userId}/windows-identity`,
    { subject: "TOKYO\\x03056", upn: "x03056@tokyo.scientia.co.jp" },
    {
      cookie: "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const conflictResponse = responseRecorder();
  await controller.handle(
    conflictRequest,
    conflictResponse,
    new URL(conflictRequest.url, "https://oneops.example"),
  );
  assert.equal(conflictResponse.status, 409);
  assert.equal(
    JSON.parse(conflictResponse.body).error.code,
    "WINDOWS_IDENTITY_CONFLICT",
  );
});

test("administrators can unlink a Windows identity with an audit event", async () => {
  const calls = { bindings: [], unbindings: [], audits: [] };
  const controller = createAuthController({
    repository: windowsIdentityAdminRepository(calls),
  });
  const userId = "10000000-0000-4000-8000-000000000056";
  const request = jsonRequest(
    "DELETE",
    `/api/work-center/v1/auth/users/${userId}/windows-identity`,
    {},
    {
      cookie: "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(calls.unbindings, [userId]);
  assert.equal(calls.audits[0].eventType, "WINDOWS_IDENTITY_ADMIN_UNLINKED");
});

test("Windows identity administration requires identity.users.write", async () => {
  const calls = { bindings: [], unbindings: [], audits: [] };
  const controller = createAuthController({
    repository: windowsIdentityAdminRepository(calls, { permissions: [] }),
  });
  const request = jsonRequest(
    "PUT",
    "/api/work-center/v1/auth/users/10000000-0000-4000-8000-000000000056/windows-identity",
    { subject: "TOKYO\\x03056", upn: "x03056@tokyo.scientia.co.jp" },
    {
      cookie: "oneops_session=session-token; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();
  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );
  assert.equal(response.status, 403);
  assert.equal(calls.bindings.length, 0);
  assert.equal(calls.audits.length, 0);
});

function impersonationRepository(profile, target, calls) {
  return {
    async resolveSession(token) {
      assert.equal(
        token,
        profile.impersonatorUserId ? "target-session" : "admin-session",
      );
      return profile;
    },
    async findActiveUser(userId) {
      calls.lookups.push(userId);
      if (userId === target.id) return target;
      if (userId === profile.impersonatorUserId) return target;
      throw Object.assign(new Error("User is not active"), {
        code: "USER_NOT_ACTIVE",
      });
    },
    async createSession(input) {
      calls.sessions.push(input);
    },
    async revokeSession(sessionId) {
      calls.revoked.push(sessionId);
    },
    async audit(input) {
      calls.audits.push(input);
    },
  };
}

test("system administrators can start an audited impersonation session", async () => {
  const calls = { lookups: [], sessions: [], revoked: [], audits: [] };
  const admin = {
    id: "10000000-0000-4000-8000-000000000001",
    username: "admin.user",
    displayName: "管理者",
    email: "admin@onehr.jp",
    status: "ACTIVE",
    sessionId: "20000000-0000-4000-8000-000000000001",
    csrfHash: sha256("csrf-token"),
    systemPermissions: ["identity.users.impersonate"],
    organizationPermissions: {},
  };
  const target = {
    id: "10000000-0000-4000-8000-000000000002",
    username: "target.user",
    displayName: "対象者",
    email: "target@onehr.jp",
    status: "ACTIVE",
  };
  const controller = createAuthController({
    repository: impersonationRepository(admin, target, calls),
  });
  const request = jsonRequest(
    "POST",
    `/api/work-center/v1/auth/impersonation/${target.id}`,
    {},
    {
      cookie: "oneops_session=admin-session; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );

  assert.equal(response.status, 200);
  assert.equal(calls.lookups[0], target.id);
  assert.equal(calls.sessions[0].userId, target.id);
  assert.equal(calls.sessions[0].impersonatorUserId, admin.id);
  assert.equal(calls.audits[0].eventType, "IMPERSONATION_STARTED");
  assert.equal(calls.audits[0].actorUserId, admin.id);
  assert.equal(calls.audits[0].targetId, target.id);
  assert.ok(Array.isArray(response.headers["Set-Cookie"]));
});

test("impersonation requires the dedicated administrator permission", async () => {
  const calls = { lookups: [], sessions: [], revoked: [], audits: [] };
  const viewer = {
    id: "10000000-0000-4000-8000-000000000003",
    username: "viewer.user",
    displayName: "閲覧者",
    email: "viewer@onehr.jp",
    status: "ACTIVE",
    sessionId: "20000000-0000-4000-8000-000000000003",
    csrfHash: sha256("csrf-token"),
    systemPermissions: [],
    organizationPermissions: {},
  };
  const target = {
    id: "10000000-0000-4000-8000-000000000004",
    username: "target.user",
    displayName: "対象者",
    email: "target@onehr.jp",
    status: "ACTIVE",
  };
  const controller = createAuthController({
    repository: impersonationRepository(viewer, target, calls),
  });
  const request = jsonRequest(
    "POST",
    `/api/work-center/v1/auth/impersonation/${target.id}`,
    {},
    {
      cookie: "oneops_session=admin-session; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );

  assert.equal(response.status, 403);
  assert.equal(calls.lookups.length, 0);
  assert.equal(calls.sessions.length, 0);
});

test("session response identifies the administrator behind an impersonated user", async () => {
  const target = {
    id: "10000000-0000-4000-8000-000000000002",
    username: "target.user",
    displayName: "対象者",
    email: "target@onehr.jp",
    status: "ACTIVE",
    sessionId: "20000000-0000-4000-8000-000000000002",
    csrfHash: sha256("csrf-token"),
    impersonatorUserId: "10000000-0000-4000-8000-000000000001",
    impersonator: {
      id: "10000000-0000-4000-8000-000000000001",
      username: "admin.user",
      displayName: "管理者",
      email: "admin@onehr.jp",
    },
    identities: [],
    systemPermissions: [],
    organizationPermissions: {},
  };
  const controller = createAuthController({
    repository: {
      async resolveSession() {
        return target;
      },
      async audit() {},
    },
  });
  const request = requestFor(
    "/api/work-center/v1/auth/session",
    { cookie: "oneops_session=target-session" },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );

  assert.equal(response.status, 200);
  assert.equal(
    JSON.parse(response.body).impersonation.actor.username,
    "admin.user",
  );
});

test("impersonated sessions can return to the active administrator", async () => {
  const calls = { lookups: [], sessions: [], revoked: [], audits: [] };
  const actor = {
    id: "10000000-0000-4000-8000-000000000001",
    username: "admin.user",
    displayName: "管理者",
    email: "admin@onehr.jp",
    status: "ACTIVE",
  };
  const target = {
    id: "10000000-0000-4000-8000-000000000002",
    username: "target.user",
    displayName: "対象者",
    email: "target@onehr.jp",
    status: "ACTIVE",
  };
  const current = {
    ...target,
    sessionId: "20000000-0000-4000-8000-000000000002",
    csrfHash: sha256("csrf-token"),
    impersonatorUserId: actor.id,
    impersonator: actor,
    systemPermissions: [],
    organizationPermissions: {},
  };
  const controller = createAuthController({
    repository: impersonationRepository(current, actor, calls),
  });
  const request = jsonRequest(
    "POST",
    "/api/work-center/v1/auth/impersonation/stop",
    {},
    {
      cookie: "oneops_session=target-session; oneops_csrf=csrf-token",
      "x-oneops-csrf": "csrf-token",
    },
  );
  const response = responseRecorder();

  await controller.handle(
    request,
    response,
    new URL(request.url, "https://oneops.example"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls.revoked, [current.sessionId]);
  assert.equal(calls.sessions[0].userId, actor.id);
  assert.equal(calls.sessions[0].impersonatorUserId, null);
  assert.equal(calls.audits[0].eventType, "IMPERSONATION_STOPPED");
  assert.equal(calls.audits[0].actorUserId, actor.id);
  assert.equal(calls.audits[0].targetId, target.id);
});
