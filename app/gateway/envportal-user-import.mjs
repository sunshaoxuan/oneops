const MACHINE_ACCOUNT_PATTERN = /\$$/;
const WINDOWS_ACCOUNT_PATTERN = /^[a-z0-9._-]{3,128}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;

function text(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

export function parseEnvPortalTimestamp(value) {
  const source = text(value);
  if (!source) return null;
  const legacy = source.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
  );
  const normalized = legacy
    ? `${legacy[3]}-${legacy[1]}-${legacy[2]}T${legacy[4]}:${legacy[5]}:${legacy[6]}+09:00`
    : source.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function mapEnvPortalRole(sourceRole) {
  return lower(sourceRole) === "admin" ? "OPERATOR" : "VIEWER";
}

export function normalizeEnvPortalUser(
  sourceKey,
  record,
  {
    defaultWindowsDomain = "TOKYO",
    upnSuffix = "tokyo.scientia.co.jp",
    allowedEmailDomain = "onehr.jp",
  } = {},
) {
  const username = lower(record?.user || sourceKey);
  if (
    !WINDOWS_ACCOUNT_PATTERN.test(username) ||
    MACHINE_ACCOUNT_PATTERN.test(username)
  ) {
    return null;
  }
  const windowsDomain =
    lower(record?.windowsDomain || defaultWindowsDomain).toUpperCase();
  const sourceUpn = lower(record?.upn);
  const derivedUpn = `${username}@${lower(upnSuffix)}`;
  const upn =
    EMAIL_PATTERN.test(sourceUpn) &&
    sourceUpn.endsWith(`@${lower(upnSuffix)}`)
      ? sourceUpn
      : derivedUpn;
  const sourceEmail = lower(record?.email);
  const email =
    EMAIL_PATTERN.test(sourceEmail) &&
    sourceEmail.endsWith(`@${lower(allowedEmailDomain)}`)
      ? sourceEmail
      : "";
  const sourceRole = lower(record?.role) || "staff";
  return {
    sourceKey: lower(sourceKey),
    sourceUser: username,
    username,
    email,
    displayName: text(record?.displayName) || username,
    windowsDomain,
    windowsSubject: `${windowsDomain}\\${username}`,
    windowsSubjectNormalized: `${windowsDomain}\\${username}`.toLowerCase(),
    upn,
    department: text(record?.department),
    title: text(record?.title),
    sourceRole,
    targetRole: mapEnvPortalRole(sourceRole),
    firstSeen: parseEnvPortalTimestamp(record?.firstSeen),
    lastSeen: parseEnvPortalTimestamp(record?.lastSeen),
  };
}

export function envPortalIdentityMetadata(source) {
  const metadata = {
    upn: source.upn,
    windowsDomain: source.windowsDomain,
    domainUsername: source.username,
    displayName: source.displayName,
    sourceSystem: "ENVPORTAL",
    sourceUser: source.sourceUser,
    sourceRole: source.sourceRole,
    sourceFirstSeen: source.firstSeen,
    sourceLastSeen: source.lastSeen,
  };
  for (const field of ["email", "department", "title"]) {
    if (source[field]) metadata[field] = source[field];
  }
  return metadata;
}

function identityKey(identity) {
  return `${String(identity?.provider ?? "").toUpperCase()}:${lower(
    identity?.subjectNormalized || identity?.subject,
  )}`;
}

export function buildEnvPortalUserImportPlan({
  sourceUsers,
  targetUsers,
  options = {},
}) {
  const targetByIdentity = new Map();
  const targetByEmail = new Map();
  const targetByUsername = new Map();
  for (const user of targetUsers ?? []) {
    targetByUsername.set(lower(user.username), user);
    if (user.email) targetByEmail.set(lower(user.email), user);
    for (const identity of user.identities ?? []) {
      targetByIdentity.set(identityKey(identity), user);
    }
  }

  const actions = [];
  const ignored = [];
  const conflicts = [];
  for (const [sourceKey, record] of Object.entries(sourceUsers ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const source = normalizeEnvPortalUser(sourceKey, record, options);
    if (!source) {
      ignored.push({
        sourceKey,
        reason: "MACHINE_OR_INVALID_ACCOUNT",
      });
      continue;
    }
    const matchedByIdentity = targetByIdentity.get(
      `WINDOWS:${source.windowsSubjectNormalized}`,
    );
    if (matchedByIdentity) {
      actions.push({
        type: "MERGE_IDENTITY",
        source,
        targetUserId: String(matchedByIdentity.id),
        preserveExistingRoles: true,
      });
      continue;
    }
    const matchedByEmail = source.email
      ? targetByEmail.get(source.email)
      : null;
    if (matchedByEmail) {
      actions.push({
        type: "LINK_IDENTITY",
        source,
        targetUserId: String(matchedByEmail.id),
        preserveExistingRoles: true,
      });
      continue;
    }
    const usernameConflict = targetByUsername.get(source.username);
    if (usernameConflict) {
      conflicts.push({
        sourceKey,
        sourceUser: source.sourceUser,
        reason: "USERNAME_ALREADY_USED",
        targetUserId: String(usernameConflict.id),
      });
      continue;
    }
    actions.push({
      type: "CREATE_USER",
      source,
      targetRole: source.targetRole,
      preserveExistingRoles: false,
    });
  }
  return {
    sourceCount: Object.keys(sourceUsers ?? {}).length,
    targetCount: (targetUsers ?? []).length,
    actions,
    ignored,
    conflicts,
    summary: {
      create: actions.filter((item) => item.type === "CREATE_USER").length,
      link: actions.filter((item) => item.type === "LINK_IDENTITY").length,
      merge: actions.filter((item) => item.type === "MERGE_IDENTITY").length,
      ignored: ignored.length,
      conflicts: conflicts.length,
    },
  };
}

export function publicEnvPortalUserImportPlan(plan, applied = null) {
  return {
    sourceSystem: "ENVPORTAL",
    sourceCount: plan.sourceCount,
    targetCountBefore: plan.targetCount,
    summary: plan.summary,
    actions: plan.actions.map((action) => ({
      type: action.type,
      sourceUser: action.source.sourceUser,
      displayName: action.source.displayName,
      windowsSubject: action.source.windowsSubject,
      upn: action.source.upn,
      emailPresent: Boolean(action.source.email),
      sourceRole: action.source.sourceRole,
      targetRole:
        action.type === "CREATE_USER" ? action.targetRole : "PRESERVE_EXISTING",
      targetUserId: action.targetUserId ?? "",
    })),
    ignored: plan.ignored,
    conflicts: plan.conflicts,
    applied,
  };
}
