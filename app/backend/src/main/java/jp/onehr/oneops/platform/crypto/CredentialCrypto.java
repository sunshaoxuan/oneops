package jp.onehr.oneops.platform.crypto;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CredentialCrypto {

    private static final byte[] KEY_SALT = "OneOps environment endpoint credentials v1".getBytes(StandardCharsets.UTF_8);
    private final String secret;
    private final SecureRandom secureRandom = new SecureRandom();

    public CredentialCrypto(@Value("${OPS_CREDENTIAL_ENCRYPTION_KEY:${ONE_OPS_DB_PASSWORD:}}") String secret) {
        if (secret == null || secret.length() < 12) {
            throw new IllegalStateException("Credential encryption key is required");
        }
        this.secret = secret;
    }

    public String encryptEndpointCredential(String endpointId, String username, String password) {
        try {
            byte[] iv = new byte[12];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key(), "AES"), new GCMParameterSpec(128, iv));
            cipher.updateAAD(("environment-endpoint:" + endpointId).getBytes(StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(("{\"username\":\"" + escape(username) + "\",\"password\":\"" + escape(password) + "\"}").getBytes(StandardCharsets.UTF_8));
            byte[] tag = new byte[16];
            byte[] ciphertext = new byte[encrypted.length - tag.length];
            System.arraycopy(encrypted, encrypted.length - tag.length, tag, 0, tag.length);
            System.arraycopy(encrypted, 0, ciphertext, 0, ciphertext.length);
            return "v1." + encode(iv) + "." + encode(tag) + "." + encode(ciphertext);
        } catch (Exception exception) {
            throw new IllegalStateException("Credential encryption failed", exception);
        }
    }

    public Credential decryptEndpointCredential(String endpointId, String payload) {
        try {
            String[] parts = payload.split("\\.", -1);
            if (parts.length != 4 || !"v1".equals(parts[0])) throw new IllegalArgumentException("Invalid credential payload");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key(), "AES"), new GCMParameterSpec(128, decode(parts[1])));
            cipher.updateAAD(("environment-endpoint:" + endpointId).getBytes(StandardCharsets.UTF_8));
            byte[] ciphertext = decode(parts[3]);
            byte[] tag = decode(parts[2]);
            byte[] combined = new byte[ciphertext.length + tag.length];
            System.arraycopy(ciphertext, 0, combined, 0, ciphertext.length);
            System.arraycopy(tag, 0, combined, ciphertext.length, tag.length);
            String json = new String(cipher.doFinal(combined), StandardCharsets.UTF_8);
            String username = json.replaceFirst(".*\\\"username\\\":\\\"(.*?)\\\".*", "$1");
            String password = json.replaceFirst(".*\\\"password\\\":\\\"(.*?)\\\".*", "$1");
            return new Credential(unescape(username), unescape(password));
        } catch (Exception exception) {
            throw new IllegalStateException("Credential decryption failed", exception);
        }
    }

    private byte[] key() {
        return SCrypt.generate(secret.getBytes(StandardCharsets.UTF_8), KEY_SALT, 16_384, 8, 1, 32);
    }

    private static String encode(byte[] value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
    private static byte[] decode(String value) { return Base64.getUrlDecoder().decode(value); }
    private static String escape(String value) { return String.valueOf(value).replace("\\", "\\\\").replace("\"", "\\\""); }
    private static String unescape(String value) { return value.replace("\\\"", "\"").replace("\\\\", "\\"); }

    public record Credential(String username, String password) {
    }
}
