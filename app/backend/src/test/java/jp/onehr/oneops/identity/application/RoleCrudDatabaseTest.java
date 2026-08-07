package jp.onehr.oneops.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class RoleCrudDatabaseTest {

    @Autowired
    private IdentityService identityService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void 実PostgreSQLでロール作成更新読取を行いテスト終了時にロールバックする() {
        Map<String, Object> created = identityService.saveRole(null, Map.of(
            "code", "CRUD_TEST_ROLE",
            "name", "CRUD 検証ロール",
            "description", "実 PostgreSQL の自動ロールバック検証",
            "permissionCodes", List.of("dashboard.read")
        ));
        String roleId = String.valueOf(created.get("id"));

        assertThat(created.get("permissionCodes")).isEqualTo(List.of("dashboard.read"));
        assertThat(permissionCount(roleId)).isEqualTo(1);

        Map<String, Object> updated = identityService.saveRole(roleId, Map.of(
            "code", "CRUD_TEST_ROLE_RENAMED",
            "name", "CRUD 検証ロール更新",
            "description", "権限関連の置換を検証",
            "permissionCodes", List.of("dashboard.read", "organizations.read")
        ));

        assertThat(updated.get("id")).isEqualTo(roleId);
        assertThat(updated.get("code")).isEqualTo("CRUD_TEST_ROLE_RENAMED");
        assertThat(updated.get("name")).isEqualTo("CRUD 検証ロール更新");
        assertThat(updated.get("permissionCodes"))
            .isEqualTo(List.of("dashboard.read", "organizations.read"));
        assertThat(permissionCount(roleId)).isEqualTo(2);
        assertThat(identityService.rolesAndPermissions().get("roles").toString())
            .contains("CRUD_TEST_ROLE_RENAMED");
    }

    @Test
    void 実PostgreSQLで不明な権限を拒否して関連を保持する() {
        Map<String, Object> created = identityService.saveRole(null, Map.of(
            "code", "CRUD_TEST_INVALID",
            "name", "不明権限検証ロール",
            "description", "不明権限時のロールバック検証",
            "permissionCodes", List.of("dashboard.read")
        ));
        String roleId = String.valueOf(created.get("id"));

        assertThatThrownBy(() -> identityService.saveRole(roleId, Map.of(
            "code", "CRUD_TEST_INVALID",
            "name", "不明権限検証ロール更新",
            "description", "保存されない変更",
            "permissionCodes", List.of("missing.permission")
        ))).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Permission not found");

        assertThat(permissionCount(roleId)).isEqualTo(1);
    }

    private int permissionCount(String roleId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM role_permissions WHERE role_id = ?::uuid",
            Integer.class,
            roleId
        );
        return count == null ? 0 : count;
    }
}
