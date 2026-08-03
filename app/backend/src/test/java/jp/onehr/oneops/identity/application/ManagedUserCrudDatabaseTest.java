package jp.onehr.oneops.identity.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import jp.onehr.oneops.identity.domain.UserView;

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class ManagedUserCrudDatabaseTest {

    @Autowired
    private IdentityService identityService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void 実PostgreSQLで利用者更新とロール割当を自動ロールバックする() {
        Map<String, Object> target = jdbcTemplate.queryForMap(
            "SELECT u.id, u.status, r.id AS role_id FROM users u " +
                "JOIN user_role_assignments a ON a.user_id = u.id " +
                "JOIN roles r ON r.id = a.role_id WHERE u.status = 'ACTIVE' ORDER BY u.username LIMIT 1"
        );
        UUID userId = (UUID) target.get("id");
        UUID roleId = (UUID) target.get("role_id");

        UserView updated = identityService.updateManagedUser(
            userId.toString(),
            String.valueOf(target.get("status")),
            List.of(Map.of("roleId", roleId.toString())),
            userId
        );

        assertThat(updated.id()).isEqualTo(userId.toString());
        assertThat(jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_role_assignments WHERE user_id = ? AND role_id = ?",
            Integer.class,
            userId,
            roleId
        )).isEqualTo(1);
    }
}
