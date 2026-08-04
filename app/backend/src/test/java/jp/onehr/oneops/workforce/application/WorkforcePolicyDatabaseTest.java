package jp.onehr.oneops.workforce.application;

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

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class WorkforcePolicyDatabaseTest {

    @Autowired
    private WorkforcePolicyService service;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void 実PostgreSQLで所属職責テンプレート及び個人既定を自動ロールバックする() {
        UUID actorUserId = jdbcTemplate.queryForObject(
            "SELECT id FROM users WHERE status = 'ACTIVE' ORDER BY username LIMIT 1",
            UUID.class
        );
        UUID departmentId = jdbcTemplate.queryForObject(
            "SELECT id FROM internal_departments WHERE code = 'TS2'",
            UUID.class
        );
        UUID responsibilityId = jdbcTemplate.queryForObject(
            "SELECT id FROM business_responsibilities WHERE code = 'TECHNICAL'",
            UUID.class
        );

        service.replaceUserAssignments(
            actorUserId,
            List.of(Map.of(
                "departmentId", departmentId.toString(),
                "isPrimary", true,
                "validFrom", "",
                "validTo", ""
            )),
            List.of(Map.of(
                "departmentId", departmentId.toString(),
                "responsibilityId", responsibilityId.toString(),
                "isPrimary", true
            )),
            actorUserId
        );

        Map<String, Object> saved = service.saveTemplate(null, Map.of(
            "code", "TEST_TS2_PERSONAL_DEFAULT",
            "name", "試験用個人既定",
            "description", "自動ロールバック対象",
            "filters", Map.of(
                "status", "open",
                "createdTo", "TODAY",
                "assignee", Map.of("sourceValue", "test-owner", "displayName", "試験担当")
            ),
            "autoExecute", true,
            "enabled", true,
            "bindings", List.of(Map.of(
                "targetType", "USER",
                "targetId", actorUserId.toString(),
                "priority", 100,
                "enabled", true
            ))
        ), actorUserId);

        assertThat(saved.get("code")).isEqualTo("TEST_TS2_PERSONAL_DEFAULT");
        assertThat(service.memberships(actorUserId)).singleElement()
            .satisfies(item -> assertThat(item).containsEntry("departmentCode", "TS2").containsEntry("isPrimary", true));
        assertThat(service.responsibilityAssignments(actorUserId)).singleElement()
            .satisfies(item -> assertThat(item).containsEntry("responsibilityCode", "TECHNICAL").containsEntry("isPrimary", true));
        assertThat(service.effectiveTemplate(actorUserId)).containsEntry("status", "RESOLVED");
    }
}
