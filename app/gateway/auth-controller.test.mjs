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
    allowedSsoDomains: ["onehr.jp"],
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
    allowedSsoDomains: ["onehr.jp"],
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://192.168.20.38:8999/auth_windows.jsp");
      assert.equal(options.headers["X-EnvPortal-Auth"], "envportal-token");
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            user: "sun.shaoxuan",
            displayName: "孫 少宣",
            email: "sun.shaoxuan@onehr.jp",
            department: "開発部",
            title: "Manager",
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
    subject: "ONEHR\\sun.shaoxuan",
    upn: "sun.shaoxuan@onehr.jp",
    displayName: "孫 少宣",
    email: "sun.shaoxuan@onehr.jp",
    department: "開発部",
    title: "Manager",
  });
  assert.equal(calls.sessions.length, 1);
  assert.equal(calls.audits[0].details.identitySource, "ENVPORTAL");
  assert.ok(Array.isArray(response.headers["Set-Cookie"]));
});

test("EnvPortal roles are ignored and non-onehr.jp identities are rejected", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://192.168.20.38:8999/auth_windows.jsp",
    allowedSsoDomains: ["onehr.jp"],
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
    emailPresent: true,
    emailDomainAllowed: false,
    windowsDomainPresent: false,
    windowsDomainAllowed: false,
  });
});

test("trusted EnvPortal Windows domain provisions a viewer when AD email is absent", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    envPortalSsoUrl: "http://OHR0067:8998/oneops_sso.jsp",
    envPortalProfileUrl: "http://envportal:8999/auth_windows.jsp",
    publicBaseUrl: "https://oneops.example",
    allowedSsoDomains: ["onehr.jp"],
    allowedSsoWindowsDomains: ["tokyo"],
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
    upn: "x02851@onehr.jp",
    displayName: "x02851",
    email: "x02851@onehr.jp",
    department: "",
    title: "",
  });
  assert.equal(calls.provisionWindows[0].upn, "x02851@onehr.jp");
  assert.equal(calls.audits[0].eventType, "WINDOWS_USER_PROVISIONED");
});

test("signed onehr.jp SSO provisions an active account and creates a login ticket", async () => {
  const { repository, calls } = repositoryDouble();
  const controller = createAuthController({
    repository,
    ssoSharedSecret: "secret",
    windowsSsoProxyUrl: "http://domain-proxy:8998",
    publicBaseUrl: "https://oneops.example",
    allowedSsoDomains: ["onehr.jp"],
  });
  const path = "/api/work-center/v1/auth/sso/windows/begin?returnTo=%2F";
  const timestamp = String(Date.now());
  const headers = {
    "x-oneops-remote-user": "ONEHR\\viewer.user",
    "x-oneops-remote-upn": "viewer.user@onehr.jp",
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
  assert.equal(calls.provisionWindows[0].upn, "viewer.user@onehr.jp");
  assert.equal(calls.provisionWindows[0].email, "viewer.user@onehr.jp");
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
