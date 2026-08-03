package jp.onehr.oneops.identity.domain;

import java.time.OffsetDateTime;
import java.util.List;

public record UserView(
    String id,
    String username,
    String email,
    String displayName,
    String status,
    String locale,
    OffsetDateTime createdAt,
    OffsetDateTime lastLoginAt,
    List<IdentityView> identities
) {
    public record IdentityView(String provider, String subject) {
    }
}
