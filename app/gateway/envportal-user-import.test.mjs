import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEnvPortalUserImportPlan,
  envPortalIdentityMetadata,
  mapEnvPortalRole,
  normalizeEnvPortalUser,
  parseEnvPortalTimestamp,
} from "./envportal-user-import.mjs";

test("EnvPortal timestamps preserve Tokyo local time", () => {
  assert.equal(
    parseEnvPortalTimestamp("07/24/2026 11:30:15"),
    "2026-07-24T02:30:15.000Z",
  );
  assert.equal(
    parseEnvPortalTimestamp("2026-07-24T11:30:15+0900"),
    "2026-07-24T02:30:15.000Z",
  );
});

test("EnvPortal users derive a trusted Windows subject and UPN without guessing email", () => {
  const user = normalizeEnvPortalUser("x02353", {
    user: "x02353",
    displayName: "堤 伸子",
    role: "import_staff",
  });
  assert.equal(user.windowsSubject, "TOKYO\\x02353");
  assert.equal(user.upn, "x02353@tokyo.scientia.co.jp");
  assert.equal(user.email, "");
  assert.equal(user.targetRole, "VIEWER");
});

test("EnvPortal identity metadata persists the Windows profile fields", () => {
  const source = normalizeEnvPortalUser("x02353", { user: "x02353" });
  const metadata = envPortalIdentityMetadata(source);
  assert.equal(metadata.windowsDomain, "TOKYO");
  assert.equal(metadata.domainUsername, "x02353");
  assert.equal(metadata.upn, "x02353@tokyo.scientia.co.jp");
});

test("only an allowed corporate email is migrated", () => {
  assert.equal(
    normalizeEnvPortalUser("x03025", {
      email: "person@onehr.jp",
    }).email,
    "person@onehr.jp",
  );
  assert.equal(
    normalizeEnvPortalUser("x03025", {
      email: "x03025@tokyo.scientia.co.jp",
    }).email,
    "",
  );
});

test("empty optional source fields do not overwrite existing identity metadata", () => {
  const source = normalizeEnvPortalUser("x02851", {
    user: "x02851",
    displayName: "孫 紹煊",
    role: "admin",
  });
  const metadata = envPortalIdentityMetadata(source);
  assert.equal(Object.hasOwn(metadata, "email"), false);
  assert.equal(Object.hasOwn(metadata, "department"), false);
  assert.equal(Object.hasOwn(metadata, "title"), false);
  assert.equal(metadata.upn, "x02851@tokyo.scientia.co.jp");
});

test("legacy admin maps to operator and other legacy roles map to viewer", () => {
  assert.equal(mapEnvPortalRole("admin"), "OPERATOR");
  assert.equal(mapEnvPortalRole("import_staff"), "VIEWER");
  assert.equal(mapEnvPortalRole("admin_watcher"), "VIEWER");
});

test("existing Windows identities merge without replacing OneOps roles", () => {
  const plan = buildEnvPortalUserImportPlan({
    sourceUsers: {
      x02851: {
        user: "x02851",
        displayName: "孫 紹煊",
        windowsDomain: "tokyo",
        role: "admin",
      },
    },
    targetUsers: [
      {
        id: "existing-admin",
        username: "sun.shaoxuan@onehr.jp",
        email: "sun.shaoxuan@onehr.jp",
        identities: [
          {
            provider: "WINDOWS",
            subject: "TOKYO\\x02851",
          },
        ],
      },
    ],
  });
  assert.deepEqual(plan.summary, {
    create: 0,
    link: 0,
    merge: 1,
    ignored: 0,
    conflicts: 0,
  });
  assert.equal(plan.actions[0].preserveExistingRoles, true);
});

test("new users are created and machine accounts are ignored", () => {
  const plan = buildEnvPortalUserImportPlan({
    sourceUsers: {
      x03025: {
        user: "x03025",
        displayName: "朴 瑛姫",
        role: "admin",
      },
      "win-machine$": {
        user: "win-machine$",
        role: "staff",
      },
    },
    targetUsers: [],
  });
  assert.equal(plan.summary.create, 1);
  assert.equal(plan.summary.ignored, 1);
  assert.equal(plan.actions[0].targetRole, "OPERATOR");
});

test("a username collision without a trusted identity is reported", () => {
  const plan = buildEnvPortalUserImportPlan({
    sourceUsers: {
      x03054: {
        user: "x03054",
        role: "new_employee",
      },
    },
    targetUsers: [
      {
        id: "unrelated",
        username: "x03054",
        email: "",
        identities: [],
      },
    ],
  });
  assert.equal(plan.summary.conflicts, 1);
  assert.equal(plan.actions.length, 0);
});
