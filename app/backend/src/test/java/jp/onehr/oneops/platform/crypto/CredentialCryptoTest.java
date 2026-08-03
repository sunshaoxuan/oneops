package jp.onehr.oneops.platform.crypto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CredentialCryptoTest {

    @Test
    void roundTripsEndpointCredentialWithAad() {
        CredentialCrypto crypto = new CredentialCrypto("test-credential-secret");
        String payload = crypto.encryptEndpointCredential("123", "operator", "password");

        assertThat(payload).startsWith("v1.");
        CredentialCrypto.Credential value = crypto.decryptEndpointCredential("123", payload);
        assertThat(value.username()).isEqualTo("operator");
        assertThat(value.password()).isEqualTo("password");
    }
}
