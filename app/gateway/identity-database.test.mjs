import assert from "node:assert/strict";
import test from "node:test";
import { mapExternalIdentity } from "./identity-database.mjs";

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
