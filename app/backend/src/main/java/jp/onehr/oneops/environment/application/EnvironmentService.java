package jp.onehr.oneops.environment.application;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jp.onehr.oneops.platform.crypto.CredentialCrypto;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EnvironmentService {

    private final JdbcTemplate jdbcTemplate;
    private final CredentialCrypto credentialCrypto;

    public EnvironmentService(JdbcTemplate jdbcTemplate, CredentialCrypto credentialCrypto) {
        this.jdbcTemplate = jdbcTemplate;
        this.credentialCrypto = credentialCrypto;
    }

    public Map<String, Object> inventory(String organizationId, boolean includeArchived) {
        List<Map<String, Object>> groups = jdbcTemplate.queryForList(
            "SELECT id, organization_id, name, sort_order, archived_at FROM environment_groups WHERE organization_id = ? AND archived_at IS NULL ORDER BY sort_order, name, id", organizationId
        ).stream().map(this::group).toList();
        List<Map<String, Object>> environmentRows = jdbcTemplate.queryForList(
            "SELECT e.id, e.organization_id, e.group_id, g.name AS group_name, e.name, e.scope, e.purpose, e.status, e.url, e.owner_name, e.notes, e.sort_order, e.revision, e.last_verified_at, e.archived_at " +
                "FROM environments e JOIN environment_groups g ON g.id = e.group_id WHERE e.organization_id = ? AND (? OR e.archived_at IS NULL) " +
                "ORDER BY g.sort_order, e.sort_order, e.name, e.id", organizationId, includeArchived
        );
        List<Map<String, Object>> environments = new ArrayList<>();
        for (Map<String, Object> row : environmentRows) {
            environments.add(environment(row, products(text(row, "id")), endpoints(text(row, "id"))));
        }
        int total = 0;
        int production = 0;
        int verification = 0;
        int internal = 0;
        int retired = 0;
        for (Map<String, Object> item : environments) {
            boolean archived = item.get("archivedAt") != null;
            if (archived) {
                retired++;
            } else {
                total++;
                if ("PRODUCTION".equals(item.get("purpose"))) production++;
                if ("VERIFICATION".equals(item.get("purpose"))) verification++;
                if ("INTERNAL".equals(item.get("scope"))) internal++;
            }
        }
        return Map.of("organizationId", organizationId, "groups", groups, "environments", environments,
            "summary", Map.of("total", total, "production", production, "verification", verification, "internal", internal, "retired", retired));
    }

    @Transactional
    public Map<String, Object> createGroup(Map<String, Object> input) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO environment_groups (organization_id, name, sort_order) VALUES (?, ?, ?) RETURNING id, organization_id, name, sort_order, archived_at",
            required(input, "organizationId"), required(input, "name"), number(input, "sortOrder")
        );
        return group(row);
    }

    @Transactional
    public Map<String, Object> updateGroup(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE environment_groups SET name = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND archived_at IS NULL RETURNING id, organization_id, name, sort_order, archived_at",
            required(input, "name"), number(input, "sortOrder"), id, required(input, "organizationId")
        );
        return rows.isEmpty() ? null : group(rows.get(0));
    }

    @Transactional
    public Map<String, Object> archiveGroup(String id, String organizationId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE environment_groups SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM environments WHERE group_id = environment_groups.id) RETURNING id, organization_id, name, sort_order, archived_at",
            id, organizationId
        );
        return rows.isEmpty() ? null : group(rows.get(0));
    }

    @Transactional
    public Map<String, Object> createEnvironment(Map<String, Object> input) {
        assertGroup(input);
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO environments (organization_id, group_id, name, scope, purpose, status, url, owner_name, notes, sort_order, last_verified_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), ?, NULLIF(?, '')::date) " +
                "RETURNING id, organization_id, group_id, name, scope, purpose, status, url, owner_name, notes, sort_order, revision, last_verified_at, archived_at",
            required(input, "organizationId"), required(input, "groupId"), required(input, "name"), text(input, "scope"), text(input, "purpose"), textOr(input, "status", "ACTIVE"),
            text(input, "url"), text(input, "ownerName"), text(input, "notes"), number(input, "sortOrder"), text(input, "lastVerifiedAt")
        );
        replaceProducts(text(row, "id"), input.get("products"));
        return environment(row, products(text(row, "id")), endpoints(text(row, "id")));
    }

    @Transactional
    public Map<String, Object> updateEnvironment(String id, Map<String, Object> input) {
        assertGroup(input);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE environments SET group_id = ?, name = ?, scope = ?, purpose = ?, status = ?, url = NULLIF(?, ''), owner_name = NULLIF(?, ''), notes = NULLIF(?, ''), sort_order = ?, last_verified_at = NULLIF(?, '')::date, revision = revision + 1, updated_at = CURRENT_TIMESTAMP " +
                "WHERE id = ? AND organization_id = ? AND revision = ? AND archived_at IS NULL " +
                "RETURNING id, organization_id, group_id, name, scope, purpose, status, url, owner_name, notes, sort_order, revision, last_verified_at, archived_at",
            required(input, "groupId"), required(input, "name"), text(input, "scope"), text(input, "purpose"), textOr(input, "status", "ACTIVE"),
            text(input, "url"), text(input, "ownerName"), text(input, "notes"), number(input, "sortOrder"), text(input, "lastVerifiedAt"), id, required(input, "organizationId"), number(input, "revision")
        );
        if (rows.isEmpty()) {
            throw new IllegalStateException("Environment revision conflict or environment not found");
        }
        replaceProducts(id, input.get("products"));
        Map<String, Object> row = rows.get(0);
        return environment(row, products(id), endpoints(id));
    }

    @Transactional
    public Map<String, Object> archiveEnvironment(String id, String organizationId, boolean archive) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE environments SET status = ?, archived_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? RETURNING id, organization_id, group_id, name, scope, purpose, status, url, owner_name, notes, sort_order, revision, last_verified_at, archived_at",
            archive ? "RETIRED" : "ACTIVE", archive, id, organizationId
        );
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.get(0);
        return environment(row, products(id), endpoints(id));
    }

    @Transactional
    public Map<String, Object> createEndpoint(Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "INSERT INTO environment_endpoints (environment_id, name, role, hostname, ip_address, port, protocol, database_type, database_version, database_name, notes, status, sort_order) " +
                "SELECT id, ?, ?, NULLIF(?, ''), NULLIF(?, '')::inet, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), ?, ? FROM environments WHERE id = ? AND organization_id = ? AND archived_at IS NULL " +
                "RETURNING id, environment_id, name, role, hostname, host(ip_address) AS ip_address, port, protocol, database_type, database_version, database_name, notes, status, sort_order",
            required(input, "name"), textOr(input, "role", "OTHER"), text(input, "hostname"), text(input, "ipAddress"), nullableNumber(input, "port"), text(input, "protocol"), text(input, "databaseType"), text(input, "databaseVersion"), text(input, "databaseName"), text(input, "notes"), textOr(input, "status", "ACTIVE"), number(input, "sortOrder"), required(input, "environmentId"), required(input, "organizationId")
        );
        return rows.isEmpty() ? null : endpoint(rows.get(0));
    }

    @Transactional
    public Map<String, Object> updateEndpoint(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE environment_endpoints e SET name = ?, role = ?, hostname = NULLIF(?, ''), ip_address = NULLIF(?, '')::inet, port = ?, protocol = NULLIF(?, ''), database_type = NULLIF(?, ''), database_version = NULLIF(?, ''), database_name = NULLIF(?, ''), notes = NULLIF(?, ''), status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP FROM environments env WHERE e.id = ? AND e.environment_id = ? AND env.id = e.environment_id AND env.organization_id = ? AND env.archived_at IS NULL RETURNING e.id, e.environment_id, e.name, e.role, e.hostname, host(e.ip_address) AS ip_address, e.port, e.protocol, e.database_type, e.database_version, e.database_name, e.notes, e.status, e.sort_order",
            required(input, "name"), textOr(input, "role", "OTHER"), text(input, "hostname"), text(input, "ipAddress"), nullableNumber(input, "port"), text(input, "protocol"), text(input, "databaseType"), text(input, "databaseVersion"), text(input, "databaseName"), text(input, "notes"), textOr(input, "status", "ACTIVE"), number(input, "sortOrder"), id, required(input, "environmentId"), required(input, "organizationId")
        );
        return rows.isEmpty() ? null : endpoint(rows.get(0));
    }

    public Map<String, Object> getCredential(String endpointId, String organizationId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT c.encrypted_payload, c.revision FROM environment_endpoint_credentials c JOIN environment_endpoints e ON e.id = c.endpoint_id JOIN environments env ON env.id = e.environment_id WHERE c.endpoint_id = ? AND env.organization_id = ?",
            endpointId, organizationId
        );
        if (rows.isEmpty()) return null;
        CredentialCrypto.Credential credential = credentialCrypto.decryptEndpointCredential(endpointId, text(rows.get(0), "encrypted_payload"));
        return Map.of("endpointId", endpointId, "username", credential.username(), "password", credential.password(), "revision", number(rows.get(0), "revision"));
    }

    @Transactional
    public Map<String, Object> saveCredential(String endpointId, Map<String, Object> input) {
        String username = text(input, "username");
        String password = text(input, "password");
        String organizationId = required(input, "organizationId");
        Integer endpoint = jdbcTemplate.queryForObject("SELECT e.id FROM environment_endpoints e JOIN environments env ON env.id = e.environment_id WHERE e.id = ? AND env.organization_id = ? FOR UPDATE", Integer.class, endpointId, organizationId);
        if (endpoint == null) return null;
        if (username.isBlank() && password.isBlank()) {
            jdbcTemplate.update("DELETE FROM environment_endpoint_credentials WHERE endpoint_id = ?", endpointId);
            return Map.of("endpointId", endpointId, "credentialConfigured", false, "hasUsername", false, "hasPassword", false, "revision", 0);
        }
        String payload = credentialCrypto.encryptEndpointCredential(endpointId, username, password);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "INSERT INTO environment_endpoint_credentials (endpoint_id, encrypted_payload, has_username, has_password, source_system) VALUES (?, ?, ?, ?, 'ONEOPS') ON CONFLICT (endpoint_id) DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, has_username = EXCLUDED.has_username, has_password = EXCLUDED.has_password, revision = environment_endpoint_credentials.revision + 1, updated_at = CURRENT_TIMESTAMP RETURNING revision",
            endpointId, payload, !username.isBlank(), !password.isBlank()
        );
        return Map.of("endpointId", endpointId, "credentialConfigured", true, "hasUsername", !username.isBlank(), "hasPassword", !password.isBlank(), "revision", number(rows.get(0), "revision"));
    }

    private void assertGroup(Map<String, Object> input) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM environment_groups WHERE id = ? AND organization_id = ? AND archived_at IS NULL", Integer.class, required(input, "groupId"), required(input, "organizationId"));
        if (count == null || count == 0) throw new IllegalArgumentException("Environment group not found");
    }

    @SuppressWarnings("unchecked")
    private void replaceProducts(String environmentId, Object value) {
        jdbcTemplate.update("DELETE FROM environment_product_version_modules WHERE environment_id = ?", environmentId);
        jdbcTemplate.update("DELETE FROM environment_product_versions WHERE environment_id = ?", environmentId);
        if (!(value instanceof List<?> products)) return;
        for (Object item : products) {
            if (!(item instanceof Map<?, ?> raw)) continue;
            Map<String, Object> product = (Map<String, Object>) raw;
            String versionId = required(product, "productVersionId");
            jdbcTemplate.update("INSERT INTO environment_product_versions (environment_id, product_version_id, usage_status, notes) VALUES (?, ?, ?, NULLIF(?, ''))", environmentId, versionId, textOr(product, "usageStatus", "ACTIVE"), text(product, "notes"));
            Object modules = product.get("moduleIds");
            if (modules instanceof List<?> moduleIds) {
                for (Object moduleId : moduleIds) {
                    jdbcTemplate.update("INSERT INTO environment_product_version_modules (environment_id, product_version_id, product_version_module_id, product_module_id) SELECT ?, product_version_id, id, product_module_id FROM product_version_modules WHERE id = ? AND product_version_id = ? AND lifecycle_status = 'ACTIVE'", environmentId, String.valueOf(moduleId), versionId);
                }
            }
        }
    }

    private List<Map<String, Object>> products(String environmentId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT l.product_version_id, l.usage_status, l.confirmation_status, l.notes, v.product_id, v.version, v.display_version, p.code AS product_code, p.name AS product_name, p.short_name AS product_short_name FROM environment_product_versions l JOIN product_versions v ON v.id = l.product_version_id JOIN products p ON p.id = v.product_id WHERE l.environment_id = ? ORDER BY p.sort_order, p.name, v.version", environmentId
        );
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("relationType", "VERSION"); item.put("candidateId", ""); item.put("productVersionId", text(row, "product_version_id")); item.put("productId", text(row, "product_id")); item.put("productCode", text(row, "product_code")); item.put("productName", text(row, "product_name")); item.put("productShortName", text(row, "product_short_name")); item.put("version", text(row, "version")); item.put("displayVersion", text(row, "display_version")); item.put("usageStatus", textOr(row, "usage_status", "ACTIVE")); item.put("confirmationStatus", textOr(row, "confirmation_status", "CONFIRMED")); item.put("notes", text(row, "notes")); item.put("modules", List.of());
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> endpoints(String environmentId) {
        return jdbcTemplate.queryForList("SELECT e.id, e.environment_id, e.name, e.role, e.hostname, host(e.ip_address) AS ip_address, e.port, e.protocol, e.database_type, e.database_version, e.database_name, e.notes, e.status, e.sort_order, c.endpoint_id IS NOT NULL AS credential_configured, COALESCE(c.has_username, false) AS credential_has_username, COALESCE(c.has_password, false) AS credential_has_password FROM environment_endpoints e LEFT JOIN environment_endpoint_credentials c ON c.endpoint_id = e.id WHERE e.environment_id = ? ORDER BY e.sort_order, e.role, e.id", environmentId).stream().map(this::endpoint).toList();
    }

    private Map<String, Object> group(Map<String, Object> row) { Map<String, Object> result = new LinkedHashMap<>(); result.put("id", text(row, "id")); result.put("organizationId", text(row, "organization_id")); result.put("name", text(row, "name")); result.put("sortOrder", number(row, "sort_order")); result.put("archivedAt", row.get("archived_at")); return result; }
    private Map<String, Object> environment(Map<String, Object> row, List<Map<String, Object>> products, List<Map<String, Object>> endpoints) { Map<String, Object> result = new LinkedHashMap<>(); result.put("id", text(row, "id")); result.put("organizationId", text(row, "organization_id")); result.put("groupId", text(row, "group_id")); result.put("groupName", text(row, "group_name")); result.put("name", text(row, "name")); result.put("scope", textOr(row, "scope", "CUSTOMER")); result.put("purpose", textOr(row, "purpose", "PRODUCTION")); result.put("status", textOr(row, "status", "ACTIVE")); result.put("url", text(row, "url")); result.put("ownerName", text(row, "owner_name")); result.put("notes", text(row, "notes")); result.put("sortOrder", number(row, "sort_order")); result.put("revision", number(row, "revision")); result.put("lastVerifiedAt", text(row, "last_verified_at")); result.put("archivedAt", row.get("archived_at")); result.put("products", products); result.put("endpoints", endpoints); return result; }
    private Map<String, Object> endpoint(Map<String, Object> row) { Map<String, Object> result = new LinkedHashMap<>(); result.put("id", text(row, "id")); result.put("environmentId", text(row, "environment_id")); result.put("name", text(row, "name")); result.put("role", textOr(row, "role", "OTHER")); result.put("hostname", text(row, "hostname")); result.put("ipAddress", text(row, "ip_address")); result.put("port", row.get("port")); result.put("protocol", text(row, "protocol")); result.put("databaseType", text(row, "database_type")); result.put("databaseVersion", text(row, "database_version")); result.put("databaseName", text(row, "database_name")); result.put("notes", text(row, "notes")); result.put("status", textOr(row, "status", "ACTIVE")); result.put("sortOrder", number(row, "sort_order")); result.put("credentialConfigured", Boolean.TRUE.equals(row.get("credential_configured"))); result.put("credentialHasUsername", Boolean.TRUE.equals(row.get("credential_has_username"))); result.put("credentialHasPassword", Boolean.TRUE.equals(row.get("credential_has_password"))); return result; }
    private static String required(Map<String, Object> input, String key) { String value = text(input, key); if (value.isBlank()) throw new IllegalArgumentException(key + " is required"); return value; }
    private static String text(Map<String, Object> row, String key) { Object value = row.get(key); return value == null ? "" : String.valueOf(value).trim(); }
    private static String textOr(Map<String, Object> row, String key, String fallback) { String value = text(row, key); return value.isBlank() ? fallback : value; }
    private static int number(Map<String, Object> row, String key) { Object value = row.get(key); if (value instanceof Number number) return number.intValue(); try { return Integer.parseInt(String.valueOf(value)); } catch (RuntimeException exception) { return 0; } }
    private static Integer nullableNumber(Map<String, Object> row, String key) { String value = text(row, key); return value.isBlank() ? null : Integer.valueOf(value); }
}
