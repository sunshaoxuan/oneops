import {
  decodeIdentityHeader,
  expiredSessionCookies,
  hasPermission,
  hashPassword,
  isAllowedSsoPrincipal,
  isWindowsMachineAccount,
  normalizeUsername,
  parseCookies,
  randomToken,
  safeReturnPath,
  sessionCookies,
  sha256,
  SsoNonceStore,
  validateRegistration,
  validateWindowsIdentityBinding,
  validateProfileInput,
  validateRoleInput,
  verifyPassword,
  verifySsoRequest,
} from "./auth.mjs";

function json(response, status, value, headers = {}) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(body);
}

function redirect(response, location, cookies = []) {
  response.writeHead(303, {
    Location: location,
    "Cache-Control": "no-store",
    ...(cookies.length ? { "Set-Cookie": cookies } : {}),
  });
  response.end();
}

function html(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action https: http:",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) throw new Error("REQUEST_BODY_TOO_LARGE");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  if (
    String(request.headers["content-type"] ?? "")
      .toLowerCase()
      .includes("application/x-www-form-urlencoded")
  ) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  return JSON.parse(text);
}

function requestIp(request) {
  return String(
    request.headers["x-real-ip"] ??
      request.headers["x-forwarded-for"]?.split(",", 1)[0] ??
      request.socket.remoteAddress ??
      "",
  ).slice(0, 100);
}

function requestMeta(request) {
  return {
    requestIp: requestIp(request),
    userAgent: String(request.headers["user-agent"] ?? "").slice(0, 500),
  };
}

function publicOrigin(request, configuredOrigin) {
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  const scheme = String(request.headers["x-forwarded-proto"] ?? "https")
    .split(",", 1)[0]
    .trim();
  const host = String(request.headers["x-forwarded-host"] ?? request.headers.host);
  return `${scheme}://${host}`.replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loginTicketForm(action, ticket) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex"></head>
<body onload="document.forms[0].submit()">
<form method="post" action="${escapeHtml(action)}">
<input type="hidden" name="ticket" value="${escapeHtml(ticket)}">
<noscript><button type="submit">Continue</button></noscript>
</form>
</body>
</html>`;
}

function authError(response, status, code, message, details = {}) {
  json(response, status, {
    error: { code, message, details },
  });
}

export function createAuthController({
  repository,
  ssoSharedSecret,
  windowsSsoProxyUrl = "",
  envPortalSsoUrl = "",
  envPortalProfileUrl = "",
  publicBaseUrl = "",
  sessionTtlSeconds = 8 * 60 * 60,
  allowedSsoDomains = ["tokyo.scientia.co.jp"],
  allowedSsoEmailDomains = ["onehr.jp"],
  allowedSsoWindowsDomains = ["tokyo"],
  ssoWindowsUpnSuffixes = { tokyo: "tokyo.scientia.co.jp" },
  ssoAccountLinks = {},
  autoWindowsSso = true,
  fetchImpl = globalThis.fetch,
}) {
  const nonceStore = new SsoNonceStore();
  const requestProfiles = new WeakMap();
  const attempts = new Map();

  function rateLimited(key, maxAttempts = 10, windowMs = 5 * 60_000) {
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.expiresAt <= now) {
      attempts.set(key, { count: 1, expiresAt: now + windowMs });
      return false;
    }
    current.count += 1;
    return current.count > maxAttempts;
  }

  async function profile(request) {
    if (requestProfiles.has(request)) return requestProfiles.get(request);
    const token = parseCookies(request.headers.cookie).oneops_session;
    const resolved = token ? await repository.resolveSession(token) : null;
    requestProfiles.set(request, resolved);
    return resolved;
  }

  async function auditSafely(event) {
    await repository.audit(event).catch(() => {});
  }

  async function issueSession(request, userId, impersonatorUserId = null) {
    const sessionToken = randomToken();
    const csrfToken = randomToken();
    const expiresAt = new Date(Date.now() + sessionTtlSeconds * 1000);
    await repository.createSession({
      userId,
      impersonatorUserId,
      token: sessionToken,
      csrfToken,
      expiresAt,
      clientIp: requestIp(request),
      userAgent: request.headers["user-agent"] ?? "",
    });
    return sessionCookies(sessionToken, csrfToken, sessionTtlSeconds);
  }

  async function requirePermission(
    request,
    response,
    permission,
    organizationId = null,
  ) {
    const current = await profile(request);
    if (!current) {
      authError(response, 401, "AUTHENTICATION_REQUIRED", "Authentication required");
      return null;
    }
    if (!hasPermission(current, permission, organizationId)) {
      authError(response, 403, "PERMISSION_DENIED", "Permission denied");
      return null;
    }
    return current;
  }

  function validCsrf(request, currentProfile) {
    const header = String(request.headers["x-oneops-csrf"] ?? "");
    const cookie = parseCookies(request.headers.cookie).oneops_csrf ?? "";
    return Boolean(
      header &&
        cookie &&
        header === cookie &&
        sha256(header) === currentProfile?.csrfHash,
    );
  }

  async function handle(request, response, url) {
    const base = "/api/work-center/v1/auth";
    if (!url.pathname.startsWith(base)) return false;
    const meta = requestMeta(request);

    if (request.method === "GET" && url.pathname === `${base}/config`) {
      const bootstrap = await repository.bootstrapState();
      const envPortalSsoEnabled = Boolean(
        envPortalSsoUrl && envPortalProfileUrl,
      );
      const signedProxySsoEnabled = Boolean(
        windowsSsoProxyUrl && ssoSharedSecret,
      );
      const windowsSsoEnabled =
        envPortalSsoEnabled || signedProxySsoEnabled;
      json(response, 200, {
        bootstrapRequired: bootstrap.required,
        windowsSsoEnabled,
        windowsSsoAutoLogin: Boolean(
          autoWindowsSso && windowsSsoEnabled,
        ),
        windowsSsoUrl: envPortalSsoEnabled
          ? envPortalSsoUrl
          : windowsSsoProxyUrl
            ? `${windowsSsoProxyUrl.replace(/\/$/, "")}${base}/sso/windows/begin`
            : "",
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === `${base}/session`) {
      const current = await profile(request);
      json(response, 200, current
        ? {
            authenticated: true,
            user: {
              id: current.id,
              username: current.username,
              displayName: current.displayName,
              email: current.email,
              locale: current.locale,
              identities: current.identities ?? [],
            },
            permissions: current.systemPermissions,
            impersonation: current.impersonator
              ? { actor: current.impersonator }
              : null,
          }
        : {
            authenticated: false,
            user: null,
            permissions: [],
            impersonation: null,
          });
      return true;
    }

    if (request.method === "POST" && url.pathname === `${base}/register`) {
      authError(
        response,
        403,
        "REGISTRATION_DISABLED",
        "Self-registration is temporarily disabled",
      );
      return true;
    }

    if (request.method === "POST" && url.pathname === `${base}/login`) {
      if (rateLimited(`login:${meta.requestIp}`)) {
        authError(response, 429, "RATE_LIMITED", "Try again later");
        return true;
      }
      const body = await readBody(request).catch(() => ({}));
      const credential = await repository.localCredential(body.login);
      const valid = credential
        ? await verifyPassword(body.password, credential.passwordHash)
        : false;
      if (!credential || !valid || credential.user.status !== "ACTIVE") {
        await auditSafely({
          actorUserId: credential?.user.id ?? null,
          eventType: "LOCAL_LOGIN_FAILED",
          targetType: credential ? "USER" : "",
          targetId: credential?.user.id ?? null,
          ...meta,
          details: { login: normalizeUsername(body.login).slice(0, 128) },
        });
        authError(response, 401, "LOGIN_FAILED", "Login failed");
        return true;
      }
      await repository.markLogin(credential.user.id, credential.identityId);
      const cookies = await issueSession(request, credential.user.id);
      await auditSafely({
        actorUserId: credential.user.id,
        eventType: "LOCAL_LOGIN_SUCCEEDED",
        targetType: "USER",
        targetId: credential.user.id,
        ...meta,
      });
      json(
        response,
        200,
        { authenticated: true, user: credential.user },
        { "Set-Cookie": cookies },
      );
      return true;
    }

    if (
      request.method === "POST" &&
      url.pathname === `${base}/sso/envportal/callback`
    ) {
      const body = await readBody(request).catch(() => ({}));
      const token = String(body.token ?? "").trim();
      if (!token || token.length > 8_192 || !envPortalProfileUrl) {
        await auditSafely({
          eventType: "WINDOWS_SSO_FAILED",
          ...meta,
          details: { code: "ENVPORTAL_TOKEN_MISSING" },
        });
        authError(
          response,
          403,
          "ENVPORTAL_TOKEN_MISSING",
          "EnvPortal SSO token is missing",
        );
        return true;
      }

      let envPortalProfile;
      try {
        const profileResponse = await fetchImpl(envPortalProfileUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-EnvPortal-Auth": token,
          },
          redirect: "error",
          signal: AbortSignal.timeout(5_000),
        });
        if (!profileResponse.ok) {
          throw new Error(`ENVPORTAL_HTTP_${profileResponse.status}`);
        }
        envPortalProfile = await profileResponse.json();
      } catch {
        await auditSafely({
          eventType: "WINDOWS_SSO_FAILED",
          ...meta,
          details: { code: "ENVPORTAL_VALIDATION_FAILED" },
        });
        authError(
          response,
          502,
          "ENVPORTAL_VALIDATION_FAILED",
          "EnvPortal could not validate the SSO token",
        );
        return true;
      }

      const subjectName = String(envPortalProfile?.user ?? "")
        .trim()
        .toLowerCase();
      const profileEmail = String(envPortalProfile?.email ?? "")
        .trim()
        .toLowerCase();
      const profileUpn = String(envPortalProfile?.upn ?? "")
        .trim()
        .toLowerCase();
      const windowsDomain = String(envPortalProfile?.windowsDomain ?? "")
        .trim()
        .toLowerCase();
      const emailDomainAllowed = isAllowedSsoPrincipal(
        profileEmail,
        allowedSsoEmailDomains,
      );
      const windowsDomainAllowed =
        Boolean(windowsDomain) &&
        allowedSsoWindowsDomains.includes(windowsDomain);
      const mappedUpnSuffix = String(
        ssoWindowsUpnSuffixes[windowsDomain] ?? "",
      ).trim().toLowerCase();
      const upn = profileUpn ||
        (windowsDomainAllowed && mappedUpnSuffix
          ? `${subjectName}@${mappedUpnSuffix}`
          : "");
      const upnDomainAllowed = isAllowedSsoPrincipal(
        upn,
        allowedSsoDomains,
      );
      const configuredLinkEmail = String(
        ssoAccountLinks[upn] ?? "",
      ).trim().toLowerCase();
      const accountLinkEmailAllowed =
        Boolean(configuredLinkEmail) &&
        isAllowedSsoPrincipal(
          configuredLinkEmail,
          allowedSsoEmailDomains,
        );
      const resolvedEmail = accountLinkEmailAllowed
        ? configuredLinkEmail
        : emailDomainAllowed
          ? profileEmail
          : "";
      const rejectionDetails = {
        profileAccepted: Boolean(envPortalProfile?.ok),
        subjectPresent: Boolean(subjectName),
        machineAccount: isWindowsMachineAccount(subjectName),
        upnPresent: Boolean(upn),
        upnDomainAllowed,
        emailPresent: Boolean(profileEmail),
        emailDomainAllowed,
        windowsDomainPresent: Boolean(windowsDomain),
        windowsDomainAllowed,
        accountLinkConfigured: Boolean(configuredLinkEmail),
        accountLinkEmailAllowed,
      };
      if (
        !envPortalProfile?.ok ||
        !subjectName ||
        isWindowsMachineAccount(subjectName) ||
        !upnDomainAllowed ||
        (Boolean(configuredLinkEmail) && !accountLinkEmailAllowed)
      ) {
        await auditSafely({
          eventType: "WINDOWS_SSO_FAILED",
          ...meta,
          details: {
            code: "ENVPORTAL_IDENTITY_REJECTED",
            ...rejectionDetails,
          },
        });
        authError(
          response,
          403,
          "ENVPORTAL_IDENTITY_REJECTED",
          "EnvPortal identity is not an allowed OneOps user",
          rejectionDetails,
        );
        return true;
      }

      const result = await repository.provisionWindows({
        subject: `${(windowsDomain || "onehr").toUpperCase()}\\${subjectName}`,
        upn,
        displayName: String(envPortalProfile.displayName ?? "").trim(),
        email: resolvedEmail,
        department: String(envPortalProfile.department ?? "").trim(),
        title: String(envPortalProfile.title ?? "").trim(),
      });
      if (result.user.status !== "ACTIVE") {
        authError(response, 403, "ACCOUNT_INACTIVE", "Account is inactive");
        return true;
      }
      const cookies = await issueSession(request, result.user.id);
      await auditSafely({
        actorUserId: result.user.id,
        eventType: result.created
          ? "WINDOWS_USER_PROVISIONED"
          : result.identityLinked
            ? "WINDOWS_IDENTITY_LINKED"
            : "WINDOWS_SSO_SUCCEEDED",
        targetType: "USER",
        targetId: result.user.id,
        ...meta,
        details: {
          bootstrap: result.bootstrap,
          identitySource: "ENVPORTAL",
        },
      });
      redirect(response, safeReturnPath(body.returnTo), cookies);
      return true;
    }

    if (
      request.method === "GET" &&
      url.pathname === `${base}/sso/windows/begin`
    ) {
      const verified = verifySsoRequest({
        secret: ssoSharedSecret,
        method: request.method,
        pathAndQuery: `${url.pathname}${url.search}`,
        headers: request.headers,
        nonceStore,
        allowedDomains: allowedSsoDomains,
      });
      if (!verified.valid) {
        await auditSafely({
          eventType: "WINDOWS_SSO_FAILED",
          ...meta,
          details: { code: verified.code },
        });
        authError(response, 403, verified.code, "Windows SSO assertion rejected");
        return true;
      }
      const forwardedEmail = decodeIdentityHeader(
        request.headers["x-oneops-remote-mail"],
      ).trim().toLowerCase();
      const configuredLinkEmail = String(
        ssoAccountLinks[verified.upn] ?? "",
      ).trim().toLowerCase();
      const resolvedEmail = isAllowedSsoPrincipal(
        configuredLinkEmail,
        allowedSsoEmailDomains,
      )
        ? configuredLinkEmail
        : isAllowedSsoPrincipal(forwardedEmail, allowedSsoEmailDomains)
          ? forwardedEmail
          : "";
      const result = await repository.provisionWindows({
        subject: verified.user,
        upn: verified.upn,
        displayName: decodeIdentityHeader(
          request.headers["x-oneops-remote-display-name"],
        ),
        email: resolvedEmail,
        department: decodeIdentityHeader(
          request.headers["x-oneops-remote-department"],
        ),
        title: decodeIdentityHeader(request.headers["x-oneops-remote-title"]),
      });
      if (result.user.status !== "ACTIVE") {
        authError(response, 403, "ACCOUNT_INACTIVE", "Account is inactive");
        return true;
      }
      const ticket = randomToken();
      await repository.createLoginTicket({
        userId: result.user.id,
        token: ticket,
        returnPath: safeReturnPath(url.searchParams.get("returnTo")),
        expiresAt: new Date(Date.now() + 60_000),
      });
      await auditSafely({
        actorUserId: result.user.id,
        eventType: result.created
          ? "WINDOWS_USER_PROVISIONED"
          : result.identityLinked
            ? "WINDOWS_IDENTITY_LINKED"
            : "WINDOWS_SSO_SUCCEEDED",
        targetType: "USER",
        targetId: result.user.id,
        ...meta,
        details: { bootstrap: result.bootstrap },
      });
      const action = `${publicOrigin(request, publicBaseUrl)}${base}/sso/windows/callback`;
      html(response, 200, loginTicketForm(action, ticket));
      return true;
    }

    if (
      request.method === "POST" &&
      url.pathname === `${base}/sso/windows/callback`
    ) {
      const body = await readBody(request).catch(() => ({}));
      const ticket = await repository.consumeLoginTicket(body.ticket);
      if (!ticket) {
        authError(response, 401, "SSO_TICKET_INVALID", "SSO ticket is invalid");
        return true;
      }
      const cookies = await issueSession(request, ticket.userId);
      redirect(response, ticket.returnPath, cookies);
      return true;
    }

    const current = await profile(request);
    if (!current) {
      authError(response, 401, "AUTHENTICATION_REQUIRED", "Authentication required");
      return true;
    }
    if (
      !["GET", "HEAD"].includes(request.method) &&
      !validCsrf(request, current)
    ) {
      authError(response, 403, "CSRF_VALIDATION_FAILED", "CSRF validation failed");
      return true;
    }

    if (request.method === "POST" && url.pathname === `${base}/logout`) {
      await repository.revokeSession(current.sessionId);
      await auditSafely({
        actorUserId: current.impersonatorUserId ?? current.id,
        eventType: "LOGOUT_SUCCEEDED",
        targetType: current.impersonatorUserId ? "USER" : "SESSION",
        targetId: current.impersonatorUserId ? current.id : null,
        ...meta,
        details: current.impersonatorUserId
          ? { fromImpersonation: true }
          : {},
      });
      json(
        response,
        200,
        { authenticated: false },
        { "Set-Cookie": expiredSessionCookies() },
      );
      return true;
    }

    if (
      request.method === "POST" &&
      url.pathname === `${base}/impersonation/stop`
    ) {
      if (!current.impersonatorUserId) {
        authError(
          response,
          400,
          "IMPERSONATION_NOT_ACTIVE",
          "代理ログインは開始されていません",
        );
        return true;
      }
      try {
        const actor = await repository.findActiveUser(current.impersonatorUserId);
        await repository.revokeSession(current.sessionId);
        const cookies = await issueSession(request, actor.id);
        await auditSafely({
          actorUserId: actor.id,
          eventType: "IMPERSONATION_STOPPED",
          targetType: "USER",
          targetId: current.id,
          ...meta,
          details: { targetUserId: current.id },
        });
        json(response, 200, { authenticated: true }, {
          "Set-Cookie": cookies,
        });
      } catch (error) {
        await repository.revokeSession(current.sessionId);
        await auditSafely({
          actorUserId: current.impersonatorUserId,
          eventType: "IMPERSONATION_STOP_FAILED",
          targetType: "USER",
          targetId: current.id,
          ...meta,
          details: { code: error?.code ?? "USER_NOT_ACTIVE" },
        });
        authError(
          response,
          403,
          error?.code ?? "IMPERSONATION_STOP_FAILED",
          "管理者セッションを復元できませんでした。通常のログインを使用してください",
        );
      }
      return true;
    }

    const impersonationMatch = url.pathname.match(
      new RegExp(`^${base}/impersonation/([0-9a-f-]+)$`),
    );
    if (request.method === "POST" && impersonationMatch) {
      if (
        !(await requirePermission(
          request,
          response,
          "identity.users.impersonate",
        ))
      ) {
        return true;
      }
      if (current.impersonatorUserId) {
        authError(
          response,
          400,
          "IMPERSONATION_NESTED",
          "代理ログイン中は別の代理ログインを開始できません",
        );
        return true;
      }
      const targetId = impersonationMatch[1];
      if (targetId === current.id) {
        authError(
          response,
          400,
          "IMPERSONATION_SELF",
          "自分自身への代理ログインはできません",
        );
        return true;
      }
      try {
        const target = await repository.findActiveUser(targetId);
        const cookies = await issueSession(request, target.id, current.id);
        await auditSafely({
          actorUserId: current.id,
          eventType: "IMPERSONATION_STARTED",
          targetType: "USER",
          targetId: target.id,
          ...meta,
          details: {
            targetUsername: target.username,
            targetUserId: target.id,
          },
        });
        json(response, 200, { authenticated: true }, {
          "Set-Cookie": cookies,
        });
      } catch (error) {
        await auditSafely({
          actorUserId: current.id,
          eventType: "IMPERSONATION_START_FAILED",
          targetType: "USER",
          targetId,
          ...meta,
          details: { code: error?.code ?? "USER_NOT_ACTIVE" },
        });
        authError(
          response,
          404,
          error?.code ?? "USER_NOT_ACTIVE",
          "対象ユーザーが有効ではありません",
        );
      }
      return true;
    }

    if (request.method === "PUT" && url.pathname === `${base}/profile`) {
      const validation = validateProfileInput(
        await readBody(request).catch(() => ({})),
      );
      if (!validation.valid) {
        authError(
          response,
          400,
          "PROFILE_VALIDATION_FAILED",
          "Profile data is invalid",
          validation.errors,
        );
        return true;
      }
      const user = await repository.updateProfile(
        current.id,
        validation.profile,
      );
      await auditSafely({
        actorUserId: current.id,
        eventType: "PROFILE_UPDATED",
        targetType: "USER",
        targetId: current.id,
        ...meta,
        details: { fields: ["displayName"] },
      });
      json(response, 200, {
        user: {
          ...user,
          identities: current.identities ?? [],
        },
      });
      return true;
    }

    if (request.method === "GET" && url.pathname === `${base}/users`) {
      if (!(await requirePermission(request, response, "identity.users.read"))) {
        return true;
      }
      json(response, 200, { users: await repository.listUsers() });
      return true;
    }

    if (request.method === "POST" && url.pathname === `${base}/users`) {
      const permitted = await requirePermission(request, response, "identity.users.write");
      if (!permitted) return true;
      try {
        const validation = validateRegistration(await readBody(request));
        if (!validation.valid) {
          authError(response, 400, "USER_CREATE_VALIDATION_FAILED", "User input is invalid", validation.errors);
          return true;
        }
        const user = await repository.createManagedUser({
          ...validation.registration,
          passwordHash: await hashPassword(validation.registration.password),
          actorUserId: permitted.id,
        });
        await auditSafely({
          actorUserId: permitted.id,
          eventType: "USER_CREATED",
          targetType: "USER",
          targetId: user.id,
          ...meta,
          details: { status: user.status, bootstrap: false },
        });
        json(response, 201, { user });
      } catch (error) {
        authError(response, error?.code === "USER_CREATE_CONFLICT" ? 409 : 400, error?.code ?? "USER_CREATE_FAILED", "User could not be created");
      }
      return true;
    }

    const userMatch = url.pathname.match(
      new RegExp(`^${base}/users/([0-9a-f-]+)$`),
    );
    if (request.method === "PUT" && userMatch) {
      if (!(await requirePermission(request, response, "identity.users.write"))) {
        return true;
      }
      try {
        const body = await readBody(request);
        const roleAssignments = Array.isArray(body.roleAssignments)
          ? body.roleAssignments.slice(0, 100)
          : [];
        const user = await repository.updateUser(
          userMatch[1],
          { status: body.status, roleAssignments },
          current.id,
        );
        await auditSafely({
          actorUserId: current.id,
          eventType: "USER_ACCESS_UPDATED",
          targetType: "USER",
          targetId: user.id,
          ...meta,
          details: {
            status: user.status,
            roleAssignmentCount: roleAssignments.length,
          },
        });
        json(response, 200, { user });
      } catch (error) {
        authError(
          response,
          error?.code === "USER_NOT_FOUND" ? 404 : 400,
          error?.code ?? "USER_UPDATE_FAILED",
          "User could not be updated",
        );
      }
      return true;
    }

    const windowsIdentityMatch = url.pathname.match(
      new RegExp(`^${base}/users/([0-9a-f-]+)/windows-identity$`),
    );
    if (request.method === "PUT" && windowsIdentityMatch) {
      const permitted = await requirePermission(
        request,
        response,
        "identity.users.write",
      );
      if (!permitted) return true;
      const validation = validateWindowsIdentityBinding(await readBody(request), {
        allowedWindowsDomains: allowedSsoWindowsDomains,
        allowedUpnDomains: allowedSsoDomains,
      });
      if (!validation.valid) {
        authError(
          response,
          400,
          "WINDOWS_IDENTITY_VALIDATION_FAILED",
          "Windows identity input is invalid",
          validation.errors,
        );
        return true;
      }
      try {
        const identity = await repository.bindWindowsIdentity(
          windowsIdentityMatch[1],
          validation.identity,
        );
        await auditSafely({
          actorUserId: permitted.id,
          eventType: "WINDOWS_IDENTITY_ADMIN_LINKED",
          targetType: "USER",
          targetId: windowsIdentityMatch[1],
          ...meta,
          details: { subject: identity.subject, upn: identity.upn },
        });
        json(response, 200, { identity });
      } catch (error) {
        authError(
          response,
          error?.code === "USER_NOT_FOUND" ? 404 :
            error?.code === "WINDOWS_IDENTITY_CONFLICT" ? 409 : 400,
          error?.code ?? "WINDOWS_IDENTITY_LINK_FAILED",
          "Windows identity could not be linked",
        );
      }
      return true;
    }

    if (request.method === "DELETE" && windowsIdentityMatch) {
      const permitted = await requirePermission(
        request,
        response,
        "identity.users.write",
      );
      if (!permitted) return true;
      try {
        const identity = await repository.unbindWindowsIdentity(
          windowsIdentityMatch[1],
        );
        await auditSafely({
          actorUserId: permitted.id,
          eventType: "WINDOWS_IDENTITY_ADMIN_UNLINKED",
          targetType: "USER",
          targetId: windowsIdentityMatch[1],
          ...meta,
          details: { subject: identity.subject, upn: identity.upn },
        });
        json(response, 200, { identity });
      } catch (error) {
        authError(
          response,
          error?.code === "USER_NOT_FOUND" ||
              error?.code === "WINDOWS_IDENTITY_NOT_FOUND"
            ? 404
            : 400,
          error?.code ?? "WINDOWS_IDENTITY_UNLINK_FAILED",
          "Windows identity could not be unlinked",
        );
      }
      return true;
    }

    if (request.method === "GET" && url.pathname === `${base}/roles`) {
      if (!(await requirePermission(request, response, "identity.roles.read"))) {
        return true;
      }
      const [roles, permissions] = await Promise.all([
        repository.listRoles(),
        repository.listPermissions(),
      ]);
      json(response, 200, { roles, permissions });
      return true;
    }

    if (request.method === "POST" && url.pathname === `${base}/roles`) {
      if (!(await requirePermission(request, response, "identity.roles.write"))) {
        return true;
      }
      const validation = validateRoleInput(await readBody(request));
      if (!validation.valid) {
        authError(
          response,
          400,
          "ROLE_VALIDATION_FAILED",
          "Role data is invalid",
          validation.errors,
        );
        return true;
      }
      try {
        const role = await repository.saveRole(null, validation.role);
        await auditSafely({
          actorUserId: current.id,
          eventType: "ROLE_CREATED",
          targetType: "ROLE",
          targetId: role.id,
          ...meta,
          details: { code: role.code },
        });
        json(response, 201, { role });
      } catch (error) {
        authError(
          response,
          error?.code === "ROLE_CONFLICT" ? 409 : 400,
          error?.code ?? "ROLE_SAVE_FAILED",
          "Role could not be saved",
        );
      }
      return true;
    }

    const roleMatch = url.pathname.match(
      new RegExp(`^${base}/roles/([0-9a-f-]+)$`),
    );
    if (request.method === "PUT" && roleMatch) {
      if (!(await requirePermission(request, response, "identity.roles.write"))) {
        return true;
      }
      const validation = validateRoleInput(await readBody(request));
      if (!validation.valid) {
        authError(
          response,
          400,
          "ROLE_VALIDATION_FAILED",
          "Role data is invalid",
          validation.errors,
        );
        return true;
      }
      try {
        const role = await repository.saveRole(roleMatch[1], validation.role);
        await auditSafely({
          actorUserId: current.id,
          eventType: "ROLE_UPDATED",
          targetType: "ROLE",
          targetId: role.id,
          ...meta,
          details: {
            code: role.code,
            permissionCount: role.permissionCodes.length,
          },
        });
        json(response, 200, { role });
      } catch (error) {
        authError(
          response,
          error?.code === "ROLE_NOT_FOUND" ? 404 : 400,
          error?.code ?? "ROLE_SAVE_FAILED",
          "Role could not be saved",
        );
      }
      return true;
    }

    if (request.method === "GET" && url.pathname === `${base}/audit`) {
      const current = await requirePermission(
        request,
        response,
        "audit.read",
      );
      if (!current) {
        return true;
      }
      const events = await repository.listAudit({
        limit: url.searchParams.get("limit") ?? 200,
        actor: url.searchParams.get("actor") ?? "",
        capability: url.searchParams.get("capability") ?? "",
        outcome: url.searchParams.get("outcome") ?? "",
        eventType: url.searchParams.get("eventType") ?? "",
        createdFrom: url.searchParams.get("createdFrom") ?? "",
        createdTo: url.searchParams.get("createdTo") ?? "",
      });
      await auditSafely({
        actorUserId: current.id,
        sessionId: current.sessionId,
        eventType: "AUDIT_LOG_READ",
        targetType: "AUDIT_LOG",
        capability: "SYSTEM_AUDIT",
        action: "SEARCH",
        outcome: "SUCCESS",
        ...requestMeta(request),
        details: { resultCount: events.length },
      });
      json(response, 200, {
        events,
      });
      return true;
    }

    authError(response, 404, "AUTH_ENDPOINT_NOT_FOUND", "Endpoint not found");
    return true;
  }

  return {
    handle,
    profile,
    validCsrf,
    requirePermission,
  };
}
