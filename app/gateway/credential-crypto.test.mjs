import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decryptEndpointCredential,
  encryptEndpointCredential,
} from "./credential-crypto.mjs";

test("endpoint credentials encrypt and decrypt with endpoint binding", () => {
  const previous = process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
  process.env.OPS_CREDENTIAL_ENCRYPTION_KEY =
    "test-only-credential-key-material";
  try {
    const encrypted = encryptEndpointCredential("42", {
      username: "operator",
      password: "maintenance-secret",
    });
    assert.doesNotMatch(encrypted, /operator|maintenance-secret/);
    assert.deepEqual(decryptEndpointCredential("42", encrypted), {
      username: "operator",
      password: "maintenance-secret",
    });
    assert.throws(
      () => decryptEndpointCredential("43", encrypted),
      /authenticate data/,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
    } else {
      process.env.OPS_CREDENTIAL_ENCRYPTION_KEY = previous;
    }
  }
});
