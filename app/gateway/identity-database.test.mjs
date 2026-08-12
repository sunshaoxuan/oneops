import assert from "node:assert/strict";
import test from "node:test";
import { mapExternalIdentity } from "./identity-database.mjs";
import { readFileSync } from "node:fs";

test("Windows identity exposes domain, domain username and UPN separately", () => {
  assert.deepEqual(
    mapExternalIdentity({
      provider: "WINDOWS",
      subject: "TOKYO\\x02851",
      metadata: {
        upn: "x02851@tokyo.scientia.co.jp",
        email: "sun.shaoxuan@onehr.jp",
      },
    }),
    {
      provider: "WINDOWS",
      subject: "TOKYO\\x02851",
      windowsDomain: "TOKYO",
      domainUsername: "x02851",
      upn: "x02851@tokyo.scientia.co.jp",
    },
  );
});

test("Local identity does not fabricate Windows binding fields", () => {
  assert.deepEqual(
    mapExternalIdentity({
      provider: "LOCAL",
      subject: "sun.shaoxuan@onehr.jp",
      metadata: {},
    }),
    {
      provider: "LOCAL",
      subject: "sun.shaoxuan@onehr.jp",
      windowsDomain: "",
      domainUsername: "",
      upn: "",
    },
  );
});

test("administrator binding keeps the physical user foreign key and Windows subject uniqueness", () => {
  const source = readFileSync(
    new URL("./identity-database.mjs", import.meta.url),
    "utf8",
  );
  const migration = readFileSync(
    new URL("../db/migrations/009_create_identity_and_rbac.sql", import.meta.url),
    "utf8",
  );
  assert.match(source, /async bindWindowsIdentity\(userId/);
  assert.match(source, /user_id = \$1 AND provider = 'WINDOWS'/);
  assert.match(source, /subject_normalized = \$1/);
  assert.match(source, /async unbindWindowsIdentity\(userId/);
  assert.match(migration, /UNIQUE \(provider, subject_normalized\)/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX IF NOT EXISTS auth_identities_windows_user_unique[\s\S]*?ON auth_identities \(user_id\)[\s\S]*?WHERE provider = 'WINDOWS'/,
  );
  assert.match(migration, /user_id uuid NOT NULL REFERENCES users\(id\)/);
});
