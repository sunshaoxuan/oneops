package jp.onehr.oneops.identity.domain;

import java.util.List;
import java.util.Map;

public record SessionView(
    String sessionId,
    UserView user,
    String csrfHash,
    List<String> permissions,
    Map<String, List<String>> organizationPermissions,
    UserView impersonator
) {
}
