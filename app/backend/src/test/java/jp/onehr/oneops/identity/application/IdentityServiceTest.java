package jp.onehr.oneops.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.sql.Array;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import jp.onehr.oneops.identity.infrastructure.PasswordHasher;
import tools.jackson.databind.ObjectMapper;

class IdentityServiceTest {

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
}
