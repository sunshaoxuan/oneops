import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const formatVersion = "v1";
const keySalt = "OneOps environment endpoint credentials v1";

function credentialSecret() {
  const value = String(
    process.env.OPS_CREDENTIAL_ENCRYPTION_KEY ??
      process.env.ONE_OPS_DB_PASSWORD ??
      "",
  );
  if (value.length < 12) {
    const error = new Error(
      "OPS_CREDENTIAL_ENCRYPTION_KEY must contain at least 12 characters.",
    );
    error.code = "CREDENTIAL_ENCRYPTION_KEY_REQUIRED";
    throw error;
  }
  return value;
}

function encryptionKey() {
  return scryptSync(credentialSecret(), keySalt, 32);
}

function additionalData(endpointId) {
  return Buffer.from(`environment-endpoint:${String(endpointId)}`, "utf8");
}

export function encryptEndpointCredential(
  endpointId,
  { username = "", password = "" },
) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    initializationVector,
  );
  cipher.setAAD(additionalData(endpointId));
  const plaintext = Buffer.from(
    JSON.stringify({
      username: String(username),
      password: String(password),
    }),
    "utf8",
  );
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);
  return [
    formatVersion,
    initializationVector.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptEndpointCredential(endpointId, encryptedPayload) {
  const [version, encodedIv, encodedTag, encodedCiphertext] = String(
    encryptedPayload ?? "",
  ).split(".");
  if (
    version !== formatVersion ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext
  ) {
    const error = new Error("Environment credential payload is invalid.");
    error.code = "CREDENTIAL_PAYLOAD_INVALID";
    throw error;
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAAD(additionalData(endpointId));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]);
  const credential = JSON.parse(plaintext.toString("utf8"));
  return {
    username: String(credential?.username ?? ""),
    password: String(credential?.password ?? ""),
  };
}
