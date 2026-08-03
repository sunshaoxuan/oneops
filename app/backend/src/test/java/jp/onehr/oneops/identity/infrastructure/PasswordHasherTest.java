package jp.onehr.oneops.identity.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {

    private final PasswordHasher passwordHasher = new PasswordHasher();

    @Test
    void verifiesNodeCompatibleScryptFormat() {
        String encoded = passwordHasher.hash("correct-password");

        assertThat(encoded).startsWith("scrypt$16384$8$1$");
        assertThat(passwordHasher.matches("correct-password", encoded)).isTrue();
        assertThat(passwordHasher.matches("incorrect-password", encoded)).isFalse();
    }
}
