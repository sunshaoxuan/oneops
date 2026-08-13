package jp.onehr.oneops.workforce.application;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

@Service
public class WorkforcePolicyService {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{1,63}$");
    private static final Set<String> TEMPLATE_FILTERS = Set.of(
        "ticketNo", "content", "keywordOperator", "includeRelatedRecords", "status",
        "createdFrom", "createdTo", "requestedReplyFrom", "requestedReplyTo",
        "updatedFrom", "updatedTo", "assignee", "unassignedOnly", "customer",
        "customerName", "customerCode", "assigneeName", "subStatus", "category",
        "classificationResult", "questionerName", "aiProcessedOnly"
    );
    private static final Map<String, Integer> RESOLUTION_STAGE = Map.of(
        "USER", 1,
        "RESPONSIBILITY", 2,
        "DEPARTMENT", 3,
        "ROLE", 4,
        "SYSTEM", 5
    );

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public WorkforcePolicyService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> catalog() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("departments", jdbcTemplate.queryForList(
            "SELECT d.id, d.code, d.name, d.parent_department_id, p.code AS parent_code, p.name AS parent_name, d.enabled, d.sort_order " +
                "FROM internal_departments d LEFT JOIN internal_departments p ON p.id = d.parent_department_id " +
                "ORDER BY d.sort_order, d.code"
        ).stream().map(this::department).toList());
        result.put("responsibilities", jdbcTemplate.queryForList(
            "SELECT id, code, name, description, enabled FROM business_responsibilities ORDER BY code"
        ).stream().map(this::responsibility).toList());
        return result;
    }

    @Transactional
    public Map<String, Object> saveDepartment(String id, Map<String, Object> input, UUID actorUserId) {
        String code = code(input, "code");
        String name = required(input, "name", 120);
        UUID parentId = optionalUuid(input.get("parentDepartmentId"), "parentDepartmentId");
        boolean enabled = bool(input, "enabled", true);
        int sortOrder = integer(input, "sortOrder", 0);
        UUID departmentId;
        if (id == null || id.isBlank()) {
            departmentId = UUID.randomUUID();
            jdbcTemplate.update(
                "INSERT INTO internal_departments (id, code, name, parent_department_id, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                departmentId, code, name, parentId, enabled, sortOrder
            );
        } else {
            departmentId = uuid(id, "departmentId");
            if (departmentId.equals(parentId)) throw new IllegalArgumentException("Department cannot be its own parent");
            if (parentId != null) {
                Integer cycle = jdbcTemplate.queryForObject(
                    "WITH RECURSIVE ancestors AS (" +
                        "SELECT id, parent_department_id FROM internal_departments WHERE id = ? " +
                        "UNION ALL SELECT d.id, d.parent_department_id FROM internal_departments d JOIN ancestors a ON d.id = a.parent_department_id" +
                        ") SELECT COUNT(*) FROM ancestors WHERE id = ?",
                    Integer.class, parentId, departmentId
                );
                if (cycle != null && cycle > 0) throw new IllegalArgumentException("Department hierarchy contains a cycle");
            }
            int updated;
            try {
                updated = jdbcTemplate.update(
                    "UPDATE internal_departments SET code = ?, name = ?, parent_department_id = ?, enabled = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    code, name, parentId, enabled, sortOrder, departmentId
                );
            } catch (DuplicateKeyException exception) {
                throw new IllegalArgumentException("Department code already exists", exception);
            }
            if (updated == 0) throw new IllegalArgumentException("Department was not found");
        }
        audit(actorUserId, "INTERNAL_DEPARTMENT_SAVED", "INTERNAL_DEPARTMENT", departmentId);
        return departmentById(departmentId);
    }

    @Transactional
    public Map<String, Object> saveResponsibility(String id, Map<String, Object> input, UUID actorUserId) {
        String code = code(input, "code");
        String name = required(input, "name", 120);
        String description = text(input, "description");
        if (description.length() > 1000) throw new IllegalArgumentException("Description is too long");
        boolean enabled = bool(input, "enabled", true);
        UUID responsibilityId;
        if (id == null || id.isBlank()) {
            responsibilityId = UUID.randomUUID();
            jdbcTemplate.update(
                "INSERT INTO business_responsibilities (id, code, name, description, enabled) VALUES (?, ?, ?, ?, ?)",
                responsibilityId, code, name, description, enabled
            );
        } else {
            responsibilityId = uuid(id, "responsibilityId");
            int updated;
            try {
                updated = jdbcTemplate.update(
                    "UPDATE business_responsibilities SET code = ?, name = ?, description = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    code, name, description, enabled, responsibilityId
                );
            } catch (DuplicateKeyException exception) {
                throw new IllegalArgumentException("Responsibility code already exists", exception);
            }
            if (updated == 0) throw new IllegalArgumentException("Responsibility was not found");
        }
        audit(actorUserId, "BUSINESS_RESPONSIBILITY_SAVED", "BUSINESS_RESPONSIBILITY", responsibilityId);
        return responsibilityById(responsibilityId);
    }

    public Map<String, Object> templates() {
        List<Map<String, Object>> templates = jdbcTemplate.queryForList(
            "SELECT id, code, name, description, filters, auto_execute, enabled, revision, created_at, updated_at " +
                "FROM inquiry_search_templates ORDER BY code"
        ).stream().map(this::template).toList();
        List<Map<String, Object>> bindings = jdbcTemplate.queryForList(
            "SELECT b.id, b.template_id, b.target_type, b.department_id, b.responsibility_id, b.role_id, b.user_id, " +
                "b.priority, b.enabled, COALESCE(d.code, br.code, r.code, u.username, 'SYSTEM') AS target_code, " +
                "COALESCE(d.name, br.name, r.name, u.display_name, 'システム既定') AS target_name " +
                "FROM inquiry_search_template_bindings b " +
                "LEFT JOIN internal_departments d ON d.id = b.department_id " +
                "LEFT JOIN business_responsibilities br ON br.id = b.responsibility_id " +
                "LEFT JOIN roles r ON r.id = b.role_id LEFT JOIN users u ON u.id = b.user_id " +
                "ORDER BY b.target_type, b.priority DESC, b.created_at"
        ).stream().map(this::binding).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("templates", templates.stream().map(item -> {
            Map<String, Object> withBindings = new LinkedHashMap<>(item);
            withBindings.put("bindings", bindings.stream()
                .filter(binding -> binding.get("templateId").equals(item.get("id"))).toList());
            return withBindings;
        }).toList());
        result.put("targets", templateTargets());
        return result;
    }

    @Transactional
    public Map<String, Object> saveTemplate(String id, Map<String, Object> input, UUID actorUserId) {
        String code = code(input, "code");
        String name = required(input, "name", 120);
        String description = text(input, "description");
        if (description.length() > 1000) throw new IllegalArgumentException("Description is too long");
        Map<String, Object> filters = filterMap(input.get("filters"));
        boolean autoExecute = bool(input, "autoExecute", true);
        boolean enabled = bool(input, "enabled", true);
        UUID templateId;
        String filtersJson = objectMapper.writeValueAsString(filters);
        if (id == null || id.isBlank()) {
            templateId = UUID.randomUUID();
            jdbcTemplate.update(
                "INSERT INTO inquiry_search_templates (id, code, name, description, filters, auto_execute, enabled, created_by_user_id, updated_by_user_id) " +
                    "VALUES (?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?)",
                templateId, code, name, description, filtersJson, autoExecute, enabled, actorUserId, actorUserId
            );
        } else {
            templateId = uuid(id, "templateId");
            int revision = integer(input, "revision", 0);
            int updated = jdbcTemplate.update(
                "UPDATE inquiry_search_templates SET name = ?, description = ?, filters = ?::jsonb, auto_execute = ?, enabled = ?, " +
                    "revision = revision + 1, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP " +
                    "WHERE id = ? AND code = ? AND revision = ?",
                name, description, filtersJson, autoExecute, enabled, actorUserId, templateId, code, revision
            );
            if (updated == 0) throw new IllegalArgumentException("Template revision conflict or code was changed");
        }
        jdbcTemplate.update("DELETE FROM inquiry_search_template_bindings WHERE template_id = ?", templateId);
        for (Map<String, Object> binding : mapList(input.get("bindings"), "bindings")) {
            insertBinding(templateId, binding);
        }
        audit(actorUserId, "INQUIRY_SEARCH_TEMPLATE_SAVED", "INQUIRY_SEARCH_TEMPLATE", templateId);
        return templates().get("templates") instanceof List<?> values
            ? values.stream().map(Map.class::cast).filter(item -> item.get("id").equals(templateId.toString())).findFirst()
                .orElseThrow(() -> new IllegalStateException("Saved template was not found"))
            : Map.of();
    }

    public Map<String, Object> effectiveTemplate(UUID userId) {
        List<Map<String, Object>> candidates = jdbcTemplate.queryForList(
            "SELECT b.id AS binding_id, b.target_type, b.priority, t.id, t.code, t.name, t.description, t.filters, t.auto_execute, t.revision, " +
                "COALESCE(d.name, br.name, r.name, u.display_name, 'システム既定') AS target_name " +
                "FROM inquiry_search_template_bindings b JOIN inquiry_search_templates t ON t.id = b.template_id " +
                "LEFT JOIN internal_departments d ON d.id = b.department_id " +
                "LEFT JOIN business_responsibilities br ON br.id = b.responsibility_id " +
                "LEFT JOIN roles r ON r.id = b.role_id LEFT JOIN users u ON u.id = b.user_id " +
                "WHERE b.enabled = TRUE AND t.enabled = TRUE AND (" +
                "b.target_type = 'SYSTEM' OR " +
                "(b.target_type = 'USER' AND b.user_id = ?) OR " +
                "(b.target_type = 'ROLE' AND EXISTS (SELECT 1 FROM user_role_assignments ura WHERE ura.user_id = ? AND ura.role_id = b.role_id)) OR " +
                "(b.target_type = 'DEPARTMENT' AND EXISTS (SELECT 1 FROM user_department_memberships udm WHERE udm.user_id = ? AND udm.department_id = b.department_id AND udm.is_primary = TRUE AND (udm.valid_from IS NULL OR udm.valid_from <= CURRENT_DATE) AND (udm.valid_to IS NULL OR udm.valid_to >= CURRENT_DATE))) OR " +
                "(b.target_type = 'RESPONSIBILITY' AND EXISTS (SELECT 1 FROM user_responsibility_assignments ura JOIN user_department_memberships udm ON udm.user_id = ura.user_id AND udm.department_id = ura.department_id WHERE ura.user_id = ? AND ura.responsibility_id = b.responsibility_id AND udm.is_primary = TRUE AND (udm.valid_from IS NULL OR udm.valid_from <= CURRENT_DATE) AND (udm.valid_to IS NULL OR udm.valid_to >= CURRENT_DATE)))" +
                ")",
            userId, userId, userId, userId
        );
        if (candidates.isEmpty()) return Map.of("status", "NONE");
        int stage = candidates.stream().mapToInt(item -> RESOLUTION_STAGE.get(text(item, "target_type"))).min().orElse(5);
        List<Map<String, Object>> stageCandidates = candidates.stream()
            .filter(item -> RESOLUTION_STAGE.get(text(item, "target_type")) == stage).toList();
        int priority = stageCandidates.stream().mapToInt(item -> number(item.get("priority"), 0)).max().orElse(0);
        List<Map<String, Object>> winners = stageCandidates.stream()
            .filter(item -> number(item.get("priority"), 0) == priority)
            .sorted(Comparator.comparing(item -> text(item, "binding_id"))).toList();
        if (winners.size() > 1) {
            return Map.of(
                "status", "CONFIGURATION_ERROR",
                "stage", winners.get(0).get("target_type"),
                "priority", priority,
                "bindingIds", winners.stream().map(item -> text(item, "binding_id")).toList()
            );
        }
        Map<String, Object> winner = winners.get(0);
        Map<String, Object> filters = resolveDynamicValues(jsonObject(winner.get("filters")));
        Map<String, Object> source = new LinkedHashMap<>();
        source.put("type", winner.get("target_type"));
        source.put("name", winner.get("target_name"));
        source.put("priority", priority);
        Map<String, Object> template = new LinkedHashMap<>();
        template.put("id", text(winner, "id"));
        template.put("code", text(winner, "code"));
        template.put("name", text(winner, "name"));
        template.put("description", text(winner, "description"));
        template.put("filters", filters);
        template.put("autoExecute", Boolean.TRUE.equals(winner.get("auto_execute")));
        template.put("revision", winner.get("revision"));
        return Map.of("status", "RESOLVED", "source", source, "template", template);
    }

    public List<Map<String, Object>> memberships(UUID userId) {
        return jdbcTemplate.queryForList(
            "SELECT m.id, m.department_id, d.code AS department_code, d.name AS department_name, m.is_primary, m.valid_from, m.valid_to " +
                "FROM user_department_memberships m JOIN internal_departments d ON d.id = m.department_id WHERE m.user_id = ? ORDER BY m.is_primary DESC, d.sort_order, d.code",
            userId
        ).stream().map(row -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", text(row, "id"));
            item.put("departmentId", text(row, "department_id"));
            item.put("departmentCode", text(row, "department_code"));
            item.put("departmentName", text(row, "department_name"));
            item.put("isPrimary", Boolean.TRUE.equals(row.get("is_primary")));
            item.put("validFrom", row.get("valid_from"));
            item.put("validTo", row.get("valid_to"));
            return item;
        }).toList();
    }

    public List<Map<String, Object>> responsibilityAssignments(UUID userId) {
        return jdbcTemplate.queryForList(
            "SELECT a.id, a.department_id, d.code AS department_code, d.name AS department_name, a.responsibility_id, r.code AS responsibility_code, r.name AS responsibility_name, a.is_primary " +
                "FROM user_responsibility_assignments a JOIN internal_departments d ON d.id = a.department_id JOIN business_responsibilities r ON r.id = a.responsibility_id " +
                "WHERE a.user_id = ? ORDER BY d.sort_order, d.code, a.is_primary DESC, r.code",
            userId
        ).stream().map(row -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", text(row, "id"));
            item.put("departmentId", text(row, "department_id"));
            item.put("departmentCode", text(row, "department_code"));
            item.put("departmentName", text(row, "department_name"));
            item.put("responsibilityId", text(row, "responsibility_id"));
            item.put("responsibilityCode", text(row, "responsibility_code"));
            item.put("responsibilityName", text(row, "responsibility_name"));
            item.put("isPrimary", Boolean.TRUE.equals(row.get("is_primary")));
            return item;
        }).toList();
    }

    @Transactional
    public void replaceUserAssignments(UUID userId, List<Map<String, Object>> memberships,
                                       List<Map<String, Object>> responsibilities, UUID actorUserId) {
        long primaryCount = memberships.stream().filter(item -> bool(item, "isPrimary", false)).count();
        if (primaryCount > 1) throw new IllegalArgumentException("Only one primary department is allowed");
        jdbcTemplate.update("DELETE FROM user_responsibility_assignments WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM user_department_memberships WHERE user_id = ?", userId);
        Set<UUID> departmentIds = new LinkedHashSet<>();
        for (Map<String, Object> membership : memberships) {
            UUID departmentId = uuid(required(membership, "departmentId", 64), "departmentId");
            if (!departmentIds.add(departmentId)) throw new IllegalArgumentException("Department membership is duplicated");
            int inserted = jdbcTemplate.update(
                "INSERT INTO user_department_memberships (user_id, department_id, is_primary, valid_from, valid_to) " +
                    "SELECT ?, id, ?, CAST(NULLIF(?, '') AS date), CAST(NULLIF(?, '') AS date) FROM internal_departments WHERE id = ? AND enabled = TRUE",
                userId, bool(membership, "isPrimary", false), text(membership, "validFrom"), text(membership, "validTo"), departmentId
            );
            if (inserted == 0) throw new IllegalArgumentException("Department is unavailable");
        }
        Set<String> responsibilityKeys = new LinkedHashSet<>();
        for (Map<String, Object> assignment : responsibilities) {
            UUID departmentId = uuid(required(assignment, "departmentId", 64), "departmentId");
            UUID responsibilityId = uuid(required(assignment, "responsibilityId", 64), "responsibilityId");
            if (!departmentIds.contains(departmentId)) throw new IllegalArgumentException("Responsibility department is not assigned to the user");
            if (!responsibilityKeys.add(departmentId + ":" + responsibilityId)) throw new IllegalArgumentException("Responsibility assignment is duplicated");
            int inserted = jdbcTemplate.update(
                "INSERT INTO user_responsibility_assignments (user_id, department_id, responsibility_id, is_primary) " +
                    "SELECT ?, d.id, r.id, ? FROM internal_departments d CROSS JOIN business_responsibilities r WHERE d.id = ? AND r.id = ? AND d.enabled = TRUE AND r.enabled = TRUE",
                userId, bool(assignment, "isPrimary", false), departmentId, responsibilityId
            );
            if (inserted == 0) throw new IllegalArgumentException("Department or responsibility is unavailable");
        }
        audit(actorUserId, "USER_WORKFORCE_ASSIGNMENTS_UPDATED", "USER", userId);
    }

    private void insertBinding(UUID templateId, Map<String, Object> input) {
        String type = required(input, "targetType", 32).toUpperCase();
        if (!RESOLUTION_STAGE.containsKey(type)) throw new IllegalArgumentException("Binding target type is invalid");
        UUID targetId = "SYSTEM".equals(type) ? null : uuid(required(input, "targetId", 64), "targetId");
        int priority = integer(input, "priority", 100);
        boolean enabled = bool(input, "enabled", true);
        UUID departmentId = "DEPARTMENT".equals(type) ? targetId : null;
        UUID responsibilityId = "RESPONSIBILITY".equals(type) ? targetId : null;
        UUID roleId = "ROLE".equals(type) ? targetId : null;
        UUID userId = "USER".equals(type) ? targetId : null;
        jdbcTemplate.update(
            "INSERT INTO inquiry_search_template_bindings (template_id, target_type, department_id, responsibility_id, role_id, user_id, priority, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            templateId, type, departmentId, responsibilityId, roleId, userId, priority, enabled
        );
    }

    private Map<String, Object> templateTargets() {
        Map<String, Object> result = new LinkedHashMap<>(catalog());
        result.put("roles", jdbcTemplate.queryForList("SELECT id, code, name FROM roles ORDER BY code").stream().map(row -> simpleTarget(row)).toList());
        result.put("users", jdbcTemplate.queryForList("SELECT id, username AS code, display_name AS name FROM users WHERE status = 'ACTIVE' ORDER BY username").stream().map(row -> simpleTarget(row)).toList());
        return result;
    }

    private Map<String, Object> simpleTarget(Map<String, Object> row) {
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"));
    }

    private Map<String, Object> departmentById(UUID id) {
        return department(jdbcTemplate.queryForMap(
            "SELECT d.id, d.code, d.name, d.parent_department_id, p.code AS parent_code, p.name AS parent_name, d.enabled, d.sort_order FROM internal_departments d LEFT JOIN internal_departments p ON p.id = d.parent_department_id WHERE d.id = ?",
            id
        ));
    }

    private Map<String, Object> responsibilityById(UUID id) {
        return responsibility(jdbcTemplate.queryForMap("SELECT id, code, name, description, enabled FROM business_responsibilities WHERE id = ?", id));
    }

    private Map<String, Object> department(Map<String, Object> row) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", text(row, "id")); item.put("code", text(row, "code")); item.put("name", text(row, "name"));
        item.put("parentDepartmentId", nullableText(row, "parent_department_id")); item.put("parentCode", text(row, "parent_code")); item.put("parentName", text(row, "parent_name"));
        item.put("enabled", Boolean.TRUE.equals(row.get("enabled"))); item.put("sortOrder", row.get("sort_order"));
        return item;
    }

    private Map<String, Object> responsibility(Map<String, Object> row) {
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"),
            "description", text(row, "description"), "enabled", Boolean.TRUE.equals(row.get("enabled")));
    }

    private Map<String, Object> template(Map<String, Object> row) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", text(row, "id")); item.put("code", text(row, "code")); item.put("name", text(row, "name")); item.put("description", text(row, "description"));
        item.put("filters", jsonObject(row.get("filters"))); item.put("autoExecute", Boolean.TRUE.equals(row.get("auto_execute"))); item.put("enabled", Boolean.TRUE.equals(row.get("enabled")));
        item.put("revision", row.get("revision")); item.put("createdAt", row.get("created_at")); item.put("updatedAt", row.get("updated_at"));
        return item;
    }

    private Map<String, Object> binding(Map<String, Object> row) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", text(row, "id")); item.put("templateId", text(row, "template_id")); item.put("targetType", text(row, "target_type"));
        item.put("targetId", switch (text(row, "target_type")) {
            case "DEPARTMENT" -> nullableText(row, "department_id");
            case "RESPONSIBILITY" -> nullableText(row, "responsibility_id");
            case "ROLE" -> nullableText(row, "role_id");
            case "USER" -> nullableText(row, "user_id");
            default -> null;
        });
        item.put("targetCode", text(row, "target_code")); item.put("targetName", text(row, "target_name"));
        item.put("priority", row.get("priority")); item.put("enabled", Boolean.TRUE.equals(row.get("enabled")));
        return item;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonObject(Object value) {
        if (value == null) return Map.of();
        if (value instanceof Map<?, ?> map) return (Map<String, Object>) map;
        return objectMapper.readValue(String.valueOf(value), Map.class);
    }

    private Map<String, Object> resolveDynamicValues(Map<String, Object> filters) {
        Map<String, Object> result = new LinkedHashMap<>();
        filters.forEach((key, value) -> result.put(key, resolveDynamicValue(value)));
        return result;
    }

    private Object resolveDynamicValue(Object value) {
        if ("TODAY".equals(value)) return LocalDate.now(ZoneId.systemDefault()).toString();
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, item) -> result.put(String.valueOf(key), resolveDynamicValue(item)));
            return result;
        }
        if (value instanceof Collection<?> values) return values.stream().map(this::resolveDynamicValue).toList();
        return value;
    }

    private Map<String, Object> filterMap(Object value) {
        Map<String, Object> filters = value == null ? Map.of() : jsonObject(value);
        List<String> invalid = filters.keySet().stream().filter(key -> !TEMPLATE_FILTERS.contains(key)).toList();
        if (!invalid.isEmpty()) throw new IllegalArgumentException("Unsupported inquiry filters: " + String.join(",", invalid));
        Object assignee = filters.get("assignee");
        if (assignee != null) {
            if (!(assignee instanceof Map<?, ?> assigneeMap)
                || assigneeMap.get("sourceValue") == null
                || String.valueOf(assigneeMap.get("sourceValue")).trim().isBlank()
                || assigneeMap.get("displayName") == null
                || String.valueOf(assigneeMap.get("displayName")).trim().isBlank()) {
                throw new IllegalArgumentException("Assignee sourceValue and displayName are required");
            }
        }
        return filters;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> mapList(Object value, String field) {
        if (value == null) return List.of();
        if (!(value instanceof List<?> list)) throw new IllegalArgumentException(field + " is invalid");
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) throw new IllegalArgumentException(field + " is invalid");
            result.add((Map<String, Object>) map);
        }
        return result;
    }

    private void audit(UUID actorUserId, String eventType, String targetType, UUID targetId) {
        jdbcTemplate.update(
            "INSERT INTO auth_audit_events (actor_user_id, event_type, target_type, target_id, details) VALUES (?, ?, ?, ?, '{}'::jsonb)",
            actorUserId, eventType, targetType, targetId
        );
    }

    private static String code(Map<String, Object> input, String key) {
        String value = required(input, key, 64).toUpperCase();
        if (!CODE_PATTERN.matcher(value).matches()) throw new IllegalArgumentException(key + " is invalid");
        return value;
    }

    private static String required(Map<String, Object> input, String key, int maxLength) {
        String value = text(input, key);
        if (value.isBlank() || value.length() > maxLength) throw new IllegalArgumentException(key + " is invalid");
        return value;
    }

    private static UUID uuid(Object value, String field) {
        try { return value instanceof UUID id ? id : UUID.fromString(String.valueOf(value)); }
        catch (RuntimeException exception) { throw new IllegalArgumentException(field + " is invalid", exception); }
    }

    private static UUID optionalUuid(Object value, String field) {
        return value == null || String.valueOf(value).isBlank() ? null : uuid(value, field);
    }

    private static boolean bool(Map<String, Object> input, String key, boolean fallback) {
        Object value = input.get(key);
        return value == null ? fallback : Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value));
    }

    private static int integer(Map<String, Object> input, String key, int fallback) {
        return number(input.get(key), fallback);
    }

    private static int number(Object value, int fallback) {
        if (value == null) return fallback;
        try { return value instanceof Number number ? number.intValue() : Integer.parseInt(String.valueOf(value)); }
        catch (NumberFormatException exception) { throw new IllegalArgumentException("Integer value is invalid", exception); }
    }

    private static String text(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String nullableText(Map<String, Object> row, String key) {
        String value = text(row, key);
        return value.isBlank() ? null : value;
    }
}
