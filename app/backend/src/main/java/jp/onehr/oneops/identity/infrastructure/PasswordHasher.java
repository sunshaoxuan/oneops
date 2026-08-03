package jp.onehr.oneops.identity.infrastructure;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private static final int N = 16_384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int KEY_LENGTH = 64;
    private final SecureRandom secureRandom = new SecureRandom();

    public String hash(String password) {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        byte[] derived = SCrypt.generate(
            password.getBytes(StandardCharsets.UTF_8), salt, N, R, P, KEY_LENGTH
        );
        return String.join(
            "$",
            "scrypt",
            String.valueOf(N),
            String.valueOf(R),
            String.valueOf(P),
            encode(salt),
            encode(derived)
        );
    }

    public boolean matches(String password, String encoded) {
        String[] parts = String.valueOf(encoded).split("\\$", -1);
        if (parts.length != 6 || !"scrypt".equals(parts[0])) {
            return false;
        }
        try {
            byte[] salt = decode(parts[4]);
            byte[] expected = decode(parts[5]);
            byte[] actual = SCrypt.generate(
                password.getBytes(StandardCharsets.UTF_8), salt,
                Integer.parseInt(parts[1]), Integer.parseInt(parts[2]),
                Integer.parseInt(parts[3]), expected.length
            );
            return MessageDigest.isEqual(expected, actual);
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private static String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static byte[] decode(String value) {
        return Base64.getUrlDecoder().decode(value);
    }
}
