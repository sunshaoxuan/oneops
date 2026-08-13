package jp.onehr.oneops.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Array;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import jp.onehr.oneops.identity.infrastructure.PasswordHasher;
import tools.jackson.databind.ObjectMapper;

class IdentityServiceTest {

    @Test
    void 管理対象ユーザーのWindowsIdentityMetadataを画面契約へ展開する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        UUID userId = UUID.fromString("10000000-0000-4000-8000-000000000043");
        when(jdbcTemplate.queryForList("SELECT * FROM users ORDER BY created_at, username"))
            .thenReturn(List.of(Map.of(
                "id", userId,
                "username", "x03043",
                "email", "",
                "display_name", "張 天馳",
                "status", "ACTIVE",
                "locale", "ja-JP"
            )));
        when(jdbcTemplate.queryForList(contains("FROM user_role_assignments")))
            .thenReturn(List.of());
        when(jdbcTemplate.queryForList(contains("FROM auth_identities"), eq(userId)))
            .thenReturn(List.of(Map.of(
                "provider", "WINDOWS",
                "subject", "TOKYO\\x03043",
                "metadata", "{\"upn\":\"x03043@tokyo.scientia.co.jp\",\"windowsDomain\":\"tokyo\",\"domainUsername\":\"x03043\"}"
            )));
        when(jdbcTemplate.queryForList(contains("FROM external_systems"), eq(userId)))
            .thenReturn(List.of());

        IdentityService service = service(jdbcTemplate);
        Map<String, Object> identity = (Map<String, Object>) ((List<?>) service
            .listManagedUsers().get(0).get("identities")).get(0);

        assertThat(identity).containsEntry("provider", "WINDOWS")
            .containsEntry("subject", "TOKYO\\x03043")
            .containsEntry("windowsDomain", "tokyo")
            .containsEntry("domainUsername", "x03043")
            .containsEntry("upn", "x03043@tokyo.scientia.co.jp");
    }

    @Test
    void 権限配列を接続終了後もJSONへシリアライズできる() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Array permissionCodes = mock(Array.class);
        when(permissionCodes.getArray()).thenReturn(new String[] {"identity.roles.read", "identity.roles.write"});

        Map<String, Object> role = new LinkedHashMap<>();
        role.put("id", "role-id");
        role.put("code", "SYSTEM_ADMIN");
        role.put("name", "システム管理者");
        role.put("description", "管理機能を管理します。");
        role.put("system_role", true);
        role.put("assignable", false);
        role.put("permission_codes", permissionCodes);
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.contains("FROM roles")))
            .thenReturn(List.of(role));
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.contains("FROM permissions")))
            .thenReturn(List.of());

        IdentityService service = new IdentityService(jdbcTemplate, mock(PasswordHasher.class), mock(SessionService.class), 28800L);
        Map<String, Object> result = service.rolesAndPermissions();

        String json = new ObjectMapper().writeValueAsString(result);
        assertThat(json).contains("\"permissionCodes\":[\"identity.roles.read\",\"identity.roles.write\"]");
    }

    @Test
    void ロール更新はUUIDで対象をロックして権限関連を置換する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        IdentityService service = service(jdbcTemplate);
        UUID roleId = UUID.fromString("69537368-0b08-4d33-b085-59d8083cbb69");
        UUID readPermissionId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID taskPermissionId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        when(jdbcTemplate.queryForList(contains("SELECT id FROM roles"), eq(roleId)))
            .thenReturn(List.of(Map.of("code", "VIEWER")));
        when(jdbcTemplate.queryForMap(contains("UPDATE roles"), eq("RENAMED_VIEWER"), eq("只读用户"), eq("查看业务档案"), eq(roleId)))
            .thenReturn(roleRow(roleId, "RENAMED_VIEWER", "只读用户", "查看业务档案", true));
        when(jdbcTemplate.queryForList(contains("FROM permissions WHERE"), any(Object[].class)))
            .thenReturn(List.of(
                Map.of("id", readPermissionId, "code", "dashboard.read"),
                Map.of("id", taskPermissionId, "code", "personal.tasks.use")
            ));

        Map<String, Object> result = service.saveRole(roleId.toString(), Map.of(
            "code", "RENAMED_VIEWER",
            "name", "只读用户",
            "description", "查看业务档案",
            "permissionCodes", List.of("dashboard.read", "personal.tasks.use")
        ));

        assertThat(result.get("code")).isEqualTo("RENAMED_VIEWER");
        assertThat(result.get("permissionCodes")).isEqualTo(List.of("dashboard.read", "personal.tasks.use"));
        verify(jdbcTemplate).update("DELETE FROM role_permissions WHERE role_id = ?", roleId);
        verify(jdbcTemplate).update(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            roleId, readPermissionId
        );
        verify(jdbcTemplate).update(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            roleId, taskPermissionId
        );
    }

    @Test
    void ロール作成は権限関連を同じ処理で保存する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        IdentityService service = service(jdbcTemplate);
        UUID roleId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        UUID permissionId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        when(jdbcTemplate.queryForMap(contains("INSERT INTO roles"), eq("SUPPORT"), eq("支援担当"), eq("問合支援を担当")))
            .thenReturn(roleRow(roleId, "SUPPORT", "支援担当", "問合支援を担当", false));
        when(jdbcTemplate.queryForList(contains("FROM permissions WHERE"), any(Object[].class)))
            .thenReturn(List.of(Map.of("id", permissionId, "code", "inquiries.use")));

        Map<String, Object> result = service.saveRole(null, Map.of(
            "code", "support",
            "name", "支援担当",
            "description", "問合支援を担当",
            "permissionCodes", List.of("INQUIRIES.USE", "inquiries.use")
        ));

        assertThat(result.get("code")).isEqualTo("SUPPORT");
        assertThat(result.get("permissionCodes")).isEqualTo(List.of("inquiries.use"));
        verify(jdbcTemplate).update("DELETE FROM role_permissions WHERE role_id = ?", roleId);
        verify(jdbcTemplate).update(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            roleId, permissionId
        );
    }

    @Test
    void 不明な権限を含む場合は権限関連を書き換えない() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        IdentityService service = service(jdbcTemplate);
        UUID roleId = UUID.fromString("69537368-0b08-4d33-b085-59d8083cbb69");
        when(jdbcTemplate.queryForList(contains("SELECT id FROM roles"), eq(roleId)))
            .thenReturn(List.of(Map.of("code", "VIEWER")));
        when(jdbcTemplate.queryForMap(contains("UPDATE roles"), any(Object[].class)))
            .thenReturn(roleRow(roleId, "VIEWER", "只读用户", "查看业务档案", true));
        when(jdbcTemplate.queryForList(contains("FROM permissions WHERE"), any(Object[].class)))
            .thenReturn(List.of());

        assertThatThrownBy(() -> service.saveRole(roleId.toString(), Map.of(
            "code", "VIEWER",
            "name", "只读用户",
            "description", "查看业务档案",
            "permissionCodes", List.of("missing.permission")
        ))).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Permission not found");

        verify(jdbcTemplate, never()).update(
            eq("DELETE FROM role_permissions WHERE role_id = ?"),
            any(Object[].class)
        );
    }

    @Test
    void 不正なロールIDはSQL実行前に拒否する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        IdentityService service = service(jdbcTemplate);

        assertThatThrownBy(() -> service.saveRole("invalid-id", Map.of(
            "code", "VIEWER",
            "name", "只读用户",
            "description", "",
            "permissionCodes", List.of()
        ))).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("roleId is invalid");

        verify(jdbcTemplate, never()).queryForList(any(String.class), any(Object[].class));
    }

    @Test
    void SENDAIドメインは対応するUPNだけを認証テストで許可する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        UUID userId = UUID.fromString("10000000-0000-4000-8000-000000000056");
        when(jdbcTemplate.queryForObject(contains("subject_normalized"), eq(Integer.class), any(Object[].class)))
            .thenReturn(0);
        IdentityService service = new IdentityService(
            jdbcTemplate, mock(PasswordHasher.class), mock(SessionService.class), 28800L,
            "tokyo,sendai", "tokyo.scientia.co.jp,sendai.scientia.co.jp",
            "{\"tokyo\":\"tokyo.scientia.co.jp\",\"sendai\":\"sendai.scientia.co.jp\"}"
        );

        assertThat(service.testWindowsIdentity(userId.toString(), Map.of(
            "action", "UPSERT", "subject", "SENDAI\\x01123", "upn", "x01123@sendai.scientia.co.jp"
        ))).containsEntry("valid", true);
        assertThatThrownBy(() -> service.testWindowsIdentity(userId.toString(), Map.of(
            "action", "UPSERT", "subject", "SENDAI\\x01123", "upn", "x01123@tokyo.scientia.co.jp"
        ))).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Windows identity input is invalid");
    }

    private static IdentityService service(JdbcTemplate jdbcTemplate) {
        return new IdentityService(jdbcTemplate, mock(PasswordHasher.class), mock(SessionService.class), 28800L);
    }

    private static Map<String, Object> roleRow(
        UUID id,
        String code,
        String name,
        String description,
        boolean systemRole
    ) {
        return Map.of(
            "id", id,
            "code", code,
            "name", name,
            "description", description,
            "system_role", systemRole,
            "assignable", true
        );
    }
}
