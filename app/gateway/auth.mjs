import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._:@-]{2,127}$/;
const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;
const PASSWORD_RULES = [
  [/[a-z]/, "lowercase"],
  [/[A-Z]/, "uppercase"],
  [/[0-9]/, "number"],
  [/[^A-Za-z0-9]/, "symbol"],
];

export function sha256(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
}

export function randomToken(size = 32) {
  return randomBytes(size).toString("base64url");
}

export function normalizeUsername(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeWindowsSubject(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function windowsAccountName(subject) {
  const normalized = normalizeWindowsSubject(subject);
  const domainPart = normalized.includes("\\")
    ? normalized.split("\\").at(-1)
    : normalized;
  return domainPart.includes("@") ? domainPart.split("@", 1)[0] : domainPart;
}

export function isWindowsMachineAccount(subject) {
  return windowsAccountName(subject).endsWith("$");
}

export function ssoPrincipalDomain(upn) {
  const normalized = normalizeEmail(upn);
  const separator = normalized.lastIndexOf("@");
  if (separator < 1 || separator === normalized.length - 1) return "";
  return normalized.slice(separator + 1);
}

export function isAllowedSsoPrincipal(upn, allowedDomains) {
  const domain = ssoPrincipalDomain(upn);
  const normalizedDomains = (Array.isArray(allowedDomains) ? allowedDomains : [])
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter(Boolean);
  return Boolean(domain && normalizedDomains.includes(domain));
}

export function validateRegistration(input) {
  const username = normalizeUsername(input?.username);
  const email = normalizeEmail(input?.email);
  const displayName = String(input?.displayName ?? "").trim();
  const password = String(input?.password ?? "");
  const errors = {};
  if (!USERNAME_PATTERN.test(username)) {
    errors.username = "USERNAME_INVALID";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "EMAIL_INVALID";
  }
  if (!displayName || displayName.length > 120) {
    errors.displayName = "DISPLAY_NAME_INVALID";
  }
  const missingPasswordRules = PASSWORD_RULES
    .filter(([pattern]) => !pattern.test(password))
    .map(([, rule]) => rule);
  if (password.length < 12 || password.length > 256 || missingPasswordRules.length) {
    errors.password = "PASSWORD_WEAK";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    registration: { username, email, displayName, password },
  };
}

export function validateProfileInput(input) {
  const displayName = String(input?.displayName ?? "").trim();
  const errors = {};
  if (!displayName || displayName.length > 120) {
    errors.displayName = "DISPLAY_NAME_INVALID";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    profile: { displayName },
  };
}

export function validateRoleInput(input) {
  const code = String(input?.code ?? "").trim().toUpperCase();
  const name = String(input?.name ?? "").trim();
  const description = String(input?.description ?? "").trim();
  const permissionCodes = [
    ...new Set(
      (Array.isArray(input?.permissionCodes) ? input.permissionCodes : [])
        .map((item) => String(item ?? "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const errors = {};
  if (!ROLE_CODE_PATTERN.test(code)) errors.code = "ROLE_CODE_INVALID";
  if (!name || name.length > 120) errors.name = "ROLE_NAME_INVALID";
  if (description.length > 1000) errors.description = "ROLE_DESCRIPTION_INVALID";
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    role: { code, name, description, permissionCodes },
  };
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(String(password), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("base64url"),
    Buffer.from(derived).toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password, encoded) {
  const [algorithm, nText, rText, pText, saltText, hashText] =
    String(encoded ?? "").split("$");
  if (
    algorithm !== "scrypt" ||
    !nText ||
    !rText ||
    !pText ||
    !saltText ||
    !hashText
  ) {
    return false;
  }
  try {
    const expected = Buffer.from(hashText, "base64url");
    const actual = await scrypt(
      String(password),
      Buffer.from(saltText, "base64url"),
      expected.length,
      {
        N: Number(nText),
        r: Number(rText),
        p: Number(pText),
        maxmem: 64 * 1024 * 1024,
      },
    );
    return expected.length === actual.length &&
      timingSafeEqual(expected, Buffer.from(actual));
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  const cookies = {};
  for (const item of String(header ?? "").split(";")) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    const name = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure !== false) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  return parts.join("; ");
}

export function sessionCookies(sessionToken, csrfToken, maxAgeSeconds) {
  return [
    serializeCookie("oneops_session", sessionToken, {
      httpOnly: true,
      maxAge: maxAgeSeconds,
    }),
    serializeCookie("oneops_csrf", csrfToken, {
      httpOnly: false,
      maxAge: maxAgeSeconds,
    }),
  ];
}

export function expiredSessionCookies() {
  return [
    serializeCookie("oneops_session", "", { httpOnly: true, maxAge: 0 }),
    serializeCookie("oneops_csrf", "", { httpOnly: false, maxAge: 0 }),
  ];
}

export function requiredPermission(method, pathname) {
  const write = method !== "GET" && method !== "HEAD";
  if (pathname.includes("/ai-assistant")) {
    return "ai.assistant.use";
  }
  if (pathname.includes("/inquiry-support/settings")) {
    return write ? "models.settings.write" : "models.settings.read";
  }
  if (pathname.includes("/inquiry-support")) {
    return "inquiries.use";
  }
  if (
    pathname.includes("/model-settings") ||
    pathname.includes("/ai-settings") ||
    pathname.includes("/agent-gateways")
  ) {
    return write ? "models.settings.write" : "models.settings.read";
  }
  if (pathname.includes("/builder/")) {
    return "dashboard.read";
  }
  if (pathname.endsWith("/dashboard") || pathname.endsWith("/events")) {
    return "dashboard.read";
  }
  if (pathname.includes("/organization-classifications")) {
    return write ? "catalog.write" : "catalog.read";
  }
  if (pathname.includes("/organizations")) {
    if (pathname.includes("/environment-inventory")) {
      return "environments.read";
    }
    return write ? "organizations.write" : "organizations.read";
  }
  if (pathname.includes("/environment-endpoint-credentials")) {
    return write
      ? "environments.credentials.write"
      : "environments.credentials.read";
  }
  if (pathname.includes("/environment-endpoints")) {
    return write ? "environments.write" : "environments.read";
  }
  if (
    pathname.includes("/environments") ||
    pathname.includes("/environment-groups")
  ) {
    return write ? "environments.write" : "environments.read";
  }
  if (
    pathname.includes("/products") ||
    pathname.includes("/product-versions") ||
    pathname.includes("/product-version-modules")
  ) {
    return write ? "catalog.write" : "catalog.read";
  }
  return null;
}

export function hasPermission(profile, permissionCode, organizationId = null) {
  if (!profile || profile.status !== "ACTIVE") return false;
  if (profile.systemPermissions?.includes(permissionCode)) return true;
  if (!organizationId) return false;
  return Boolean(
    profile.organizationPermissions?.[String(organizationId)]?.includes(
      permissionCode,
    ),
  );
}

export function canonicalSsoRequest(
  method,
  pathAndQuery,
  user,
  upn,
  timestamp,
  nonce,
) {
  return [
    String(method ?? "").toUpperCase(),
    String(pathAndQuery ?? ""),
    String(user ?? ""),
    String(upn ?? ""),
    String(timestamp ?? ""),
    String(nonce ?? ""),
  ].join("\n");
}

export function signSsoRequest(
  secret,
  method,
  pathAndQuery,
  user,
  upn,
  timestamp,
  nonce,
) {
  return createHmac("sha256", secret)
    .update(
      canonicalSsoRequest(method, pathAndQuery, user, upn, timestamp, nonce),
      "utf8",
    )
    .digest("base64url");
}

export class SsoNonceStore {
  constructor() {
    this.nonces = new Map();
  }

  consume(nonce, expiresAt, now = Date.now()) {
    for (const [key, expiry] of this.nonces.entries()) {
      if (expiry <= now) this.nonces.delete(key);
    }
    if (this.nonces.has(nonce)) return false;
    this.nonces.set(nonce, expiresAt);
    return true;
  }
}

export function verifySsoRequest({
  secret,
  method,
  pathAndQuery,
  headers,
  nonceStore,
  now = Date.now(),
  allowedClockSkewMs = 120_000,
  allowedDomains = ["tokyo.scientia.co.jp"],
}) {
  const user = String(headers["x-oneops-remote-user"] ?? "").trim();
  const upn = String(headers["x-oneops-remote-upn"] ?? "").trim().toLowerCase();
  const timestampText = String(headers["x-oneops-auth-timestamp"] ?? "").trim();
  const nonce = String(headers["x-oneops-auth-nonce"] ?? "").trim();
  const signature = String(headers["x-oneops-auth-signature"] ?? "").trim();
  const timestamp = Number(timestampText);
  if (!secret || !user || !upn || !timestamp || !nonce || !signature) {
    return { valid: false, code: "SSO_ASSERTION_INCOMPLETE" };
  }
  if (isWindowsMachineAccount(user)) {
    return { valid: false, code: "SSO_MACHINE_ACCOUNT_REJECTED" };
  }
  if (Math.abs(now - timestamp) > allowedClockSkewMs) {
    return { valid: false, code: "SSO_ASSERTION_EXPIRED" };
  }
  const expected = signSsoRequest(
    secret,
    method,
    pathAndQuery,
    user,
    upn,
    timestampText,
    nonce,
  );
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return { valid: false, code: "SSO_SIGNATURE_INVALID" };
  }
  if (
    !nonceStore.consume(
      nonce,
      timestamp + allowedClockSkewMs,
      now,
    )
  ) {
    return { valid: false, code: "SSO_ASSERTION_REPLAYED" };
  }
  if (!isAllowedSsoPrincipal(upn, allowedDomains)) {
    return { valid: false, code: "SSO_DOMAIN_NOT_ALLOWED" };
  }
  return { valid: true, user, upn, domain: ssoPrincipalDomain(upn) };
}

export function safeReturnPath(value) {
  const path = String(value ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/";
  }
  return path.slice(0, 2048);
}

export function decodeIdentityHeader(value) {
  try {
    return decodeURIComponent(String(value ?? "").trim()).slice(0, 500);
  } catch {
    return "";
  }
}
