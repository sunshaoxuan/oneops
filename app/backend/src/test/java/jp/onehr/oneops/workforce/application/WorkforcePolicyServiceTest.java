package jp.onehr.oneops.workforce.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import tools.jackson.databind.ObjectMapper;

class WorkforcePolicyServiceTest {

    @Test
    void 個人割当はシステム既定より先に解決しTODAYを当日へ変換する() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(
            candidate("system-binding", "SYSTEM", 900, "SYSTEM_DEFAULT", "システム既定", "{\"status\":\"open\"}"),
            candidate("user-binding", "USER", 10, "TS2_USER", "TS2個人", "{\"status\":\"open\",\"createdTo\":\"TODAY\"}")
        ));
        WorkforcePolicyService service = new WorkforcePolicyService(jdbcTemplate, new ObjectMapper());

        Map<String, Object> result = service.effectiveTemplate(UUID.randomUUID());

        assertThat(result.get("status")).isEqualTo("RESOLVED");
        @SuppressWarnings("unchecked")
        Map<String, Object> template = (Map<String, Object>) result.get("template");
        assertThat(template.get("code")).isEqualTo("TS2_USER");
        @SuppressWarnings("unchecked")
        Map<String, Object> filters = (Map<String, Object>) template.get("filters");
        assertThat(filters.get("createdTo")).isEqualTo(LocalDate.now().toString());
    }

    @Test
    void 同一段階の最大優先順位が複数なら設定不整合を返す() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(
            candidate("role-a", "ROLE", 100, "ROLE_A", "ロールA", "{\"status\":\"open\"}"),
            candidate("role-b", "ROLE", 100, "ROLE_B", "ロールB", "{\"status\":\"open\"}"),
            candidate("system", "SYSTEM", 999, "SYSTEM", "システム", "{\"status\":\"open\"}")
        ));
        WorkforcePolicyService service = new WorkforcePolicyService(jdbcTemplate, new ObjectMapper());

        Map<String, Object> result = service.effectiveTemplate(UUID.randomUUID());

        assertThat(result.get("status")).isEqualTo("CONFIGURATION_ERROR");
        assertThat(result.get("stage")).isEqualTo("ROLE");
        assertThat(result.get("priority")).isEqualTo(100);
        assertThat(result.get("bindingIds")).isEqualTo(List.of("role-a", "role-b"));
    }

    @Test
    void 候補がない場合は未設定を返す() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());
        WorkforcePolicyService service = new WorkforcePolicyService(jdbcTemplate, new ObjectMapper());

        assertThat(service.effectiveTemplate(UUID.randomUUID())).containsEntry("status", "NONE");
    }

    private static Map<String, Object> candidate(String bindingId, String targetType, int priority,
                                                  String code, String name, String filters) {
        return Map.ofEntries(
            Map.entry("binding_id", bindingId),
            Map.entry("target_type", targetType),
            Map.entry("priority", priority),
            Map.entry("id", UUID.randomUUID()),
            Map.entry("code", code),
            Map.entry("name", name),
            Map.entry("description", ""),
            Map.entry("filters", filters),
            Map.entry("auto_execute", true),
            Map.entry("revision", 1),
            Map.entry("target_name", name)
        );
    }
}
