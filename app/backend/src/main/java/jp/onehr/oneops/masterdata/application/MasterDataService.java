package jp.onehr.oneops.masterdata.application;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MasterDataService {

    private final JdbcTemplate jdbcTemplate;

    public MasterDataService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listClassifications() {
        return jdbcTemplate.queryForList("SELECT id, code, name FROM organization_classifications ORDER BY name, code")
            .stream().map(this::classification).toList();
    }

    @Transactional
    public Map<String, Object> createClassification(Map<String, Object> input) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO organization_classifications (code, name) VALUES (?, ?) RETURNING id, code, name",
            required(input, "code"), required(input, "name")
        );
        return classification(row);
    }

    @Transactional
    public Map<String, Object> updateClassification(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE organization_classifications SET code = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, code, name",
            required(input, "code"), required(input, "name"), longId(id, "classificationId")
        );
        return rows.isEmpty() ? null : classification(rows.get(0));
    }

    public List<Map<String, Object>> listOrganizations() {
        return jdbcTemplate.queryForList(
            "SELECT o.id, o.classification_id, c.code AS classification_code, c.name AS classification_name, " +
                "o.code, o.name, o.short_name, o.maintenance_status, o.remarks, " +
                "s.inquiry_customer_code, " +
                "s.inquiry_customer_name, s.inquiry_last_synced_at " +
                "FROM organizations o LEFT JOIN organization_classifications c ON c.id = o.classification_id " +
                "LEFT JOIN customer_information_settings s ON s.organization_id = o.id " +
                "ORDER BY o.name, o.code"
        ).stream().map(this::organization).toList();
    }

    @Transactional
    public Map<String, Object> createOrganization(Map<String, Object> input) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO organizations (classification_id, code, name, short_name, maintenance_status, remarks) " +
                "VALUES (?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, '')) " +
                "RETURNING id, classification_id, code, name, short_name, maintenance_status, remarks",
            nullableLongId(input.get("classificationId"), "classificationId"), required(input, "code"), required(input, "name"),
            text(input, "shortName"), text(input, "maintenanceStatus"), text(input, "remarks")
        );
        saveInquiryCustomerCode(row.get("id"), input);
        row = withInquiryCustomerCode(row, input);
        return organizationWithClassification(row);
    }

    @Transactional
    public Map<String, Object> updateOrganization(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE organizations SET classification_id = ?, code = ?, name = ?, short_name = NULLIF(?, ''), " +
                "maintenance_status = NULLIF(?, ''), remarks = NULLIF(?, '') " +
                "WHERE id = ? RETURNING id, classification_id, code, name, short_name, maintenance_status, remarks",
            nullableLongId(input.get("classificationId"), "classificationId"), required(input, "code"), required(input, "name"),
            text(input, "shortName"), text(input, "maintenanceStatus"), text(input, "remarks"), longId(id, "organizationId")
        );
        if (rows.isEmpty()) {
            return null;
        }
        saveInquiryCustomerCode(rows.get(0).get("id"), input);
        return organizationWithClassification(withInquiryCustomerCode(rows.get(0), input));
    }

    public List<Map<String, Object>> listProducts() {
        List<Map<String, Object>> productRows = jdbcTemplate.queryForList(
            "SELECT id, code, name, short_name, version_selection_mode, lifecycle_status, sort_order " +
                "FROM products WHERE lifecycle_status = 'ACTIVE' ORDER BY sort_order, name, code"
        );
        List<Map<String, Object>> versionRows = jdbcTemplate.queryForList(
            "SELECT id, product_id, version, display_version, lifecycle_status FROM product_versions " +
                "WHERE lifecycle_status = 'ACTIVE' ORDER BY product_id, id"
        );
        List<Map<String, Object>> moduleRows = jdbcTemplate.queryForList(
            "SELECT id, product_version_id, product_module_id, code, name, short_name, lifecycle_status, sort_order " +
                "FROM product_version_modules WHERE lifecycle_status = 'ACTIVE' ORDER BY product_version_id, sort_order, name, id"
        );
        Map<String, List<Map<String, Object>>> modulesByVersion = new LinkedHashMap<>();
        for (Map<String, Object> row : moduleRows) {
            modulesByVersion.computeIfAbsent(text(row, "product_version_id"), ignored -> new ArrayList<>()).add(module(row));
        }
        Map<String, List<Map<String, Object>>> versionsByProduct = new LinkedHashMap<>();
        for (Map<String, Object> row : versionRows) {
            versionsByProduct.computeIfAbsent(text(row, "product_id"), ignored -> new ArrayList<>())
                .add(version(row, modulesByVersion.getOrDefault(text(row, "id"), List.of())));
        }
        versionsByProduct.values().forEach(values -> values.sort(Comparator.comparing(item -> text(item, "version"), String.CASE_INSENSITIVE_ORDER)));
        return productRows.stream().map(row -> product(row, versionsByProduct.getOrDefault(text(row, "id"), List.of()))).toList();
    }

    @Transactional
    public Map<String, Object> createProduct(Map<String, Object> input) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO products (code, name, short_name, sort_order) VALUES (?, ?, NULLIF(?, ''), ?) " +
                "RETURNING id, code, name, short_name, version_selection_mode, lifecycle_status, sort_order",
            required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder")
        );
        return product(row, List.of());
    }

    @Transactional
    public Map<String, Object> updateProduct(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE products SET code = ?, name = ?, short_name = NULLIF(?, ''), sort_order = ?, updated_at = CURRENT_TIMESTAMP " +
                "WHERE id = ? AND lifecycle_status = 'ACTIVE' " +
                "RETURNING id, code, name, short_name, version_selection_mode, lifecycle_status, sort_order",
            required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder"), longId(id, "productId")
        );
        return rows.isEmpty() ? null : product(rows.get(0), List.of());
    }

    @Transactional
    public Map<String, Object> createVersion(Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "INSERT INTO product_versions (product_id, version, display_version) " +
                "SELECT id, ?, NULLIF(?, '') FROM products WHERE id = ? AND lifecycle_status = 'ACTIVE' " +
                "RETURNING id, product_id, version, display_version, lifecycle_status",
            required(input, "version"), text(input, "displayVersion"), longId(required(input, "productId"), "productId")
        );
        return rows.isEmpty() ? null : version(rows.get(0), List.of());
    }

    @Transactional
    public Map<String, Object> updateVersion(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE product_versions SET version = ?, display_version = NULLIF(?, ''), updated_at = CURRENT_TIMESTAMP " +
                "WHERE id = ? AND product_id = ? AND lifecycle_status = 'ACTIVE' " +
                "RETURNING id, product_id, version, display_version, lifecycle_status",
            required(input, "version"), text(input, "displayVersion"), longId(id, "productVersionId"), longId(required(input, "productId"), "productId")
        );
        return rows.isEmpty() ? null : version(rows.get(0), List.of());
    }

    @Transactional
    public Map<String, Object> createVersionModule(Map<String, Object> input) {
        long versionId = longId(required(input, "productVersionId"), "productVersionId");
        Map<String, Object> version = jdbcTemplate.queryForMap("SELECT id, product_id FROM product_versions WHERE id = ? AND lifecycle_status = 'ACTIVE'", versionId);
        Map<String, Object> module = jdbcTemplate.queryForMap(
            "INSERT INTO product_modules (product_id, code, name, short_name, sort_order) VALUES (?, ?, ?, NULLIF(?, ''), ?) " +
                "ON CONFLICT (product_id, code) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name, sort_order = EXCLUDED.sort_order " +
                "RETURNING id",
            version.get("product_id"), required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder")
        );
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "INSERT INTO product_version_modules (product_version_id, product_module_id, code, name, short_name, sort_order) " +
                "VALUES (?, ?, ?, ?, NULLIF(?, ''), ?) RETURNING id, product_version_id, product_module_id, code, name, short_name, lifecycle_status, sort_order",
            versionId, module.get("id"), required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder")
        );
        return module(row);
    }

    @Transactional
    public Map<String, Object> updateVersionModule(String id, Map<String, Object> input) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "UPDATE product_version_modules SET code = ?, name = ?, short_name = NULLIF(?, ''), sort_order = ?, updated_at = CURRENT_TIMESTAMP " +
                "WHERE id = ? AND product_version_id = ? AND lifecycle_status = 'ACTIVE' " +
                "RETURNING id, product_version_id, product_module_id, code, name, short_name, lifecycle_status, sort_order",
            required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder"), longId(id, "productVersionModuleId"), longId(required(input, "productVersionId"), "productVersionId")
        );
        if (rows.isEmpty()) {
            return null;
        }
        jdbcTemplate.update("UPDATE product_modules SET code = ?, name = ?, short_name = NULLIF(?, ''), sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            required(input, "code"), required(input, "name"), text(input, "shortName"), number(input, "sortOrder"), rows.get(0).get("product_module_id"));
        return module(rows.get(0));
    }

    private Map<String, Object> classification(Map<String, Object> row) {
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"));
    }

    private Map<String, Object> organization(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", text(row, "id"));
        result.put("classificationId", text(row, "classification_id"));
        result.put("classificationCode", text(row, "classification_code"));
        result.put("classificationName", text(row, "classification_name"));
        result.put("code", text(row, "code"));
        result.put("name", text(row, "name"));
        result.put("shortName", text(row, "short_name"));
        result.put("maintenanceStatus", text(row, "maintenance_status"));
        result.put("remarks", text(row, "remarks"));
        result.put("inquiryCustomerCode", text(row, "inquiry_customer_code"));
        result.put("inquiryCustomerName", text(row, "inquiry_customer_name"));
        result.put("inquiryLastSyncedAt", row.get("inquiry_last_synced_at") == null
            ? null : String.valueOf(row.get("inquiry_last_synced_at")));
        return result;
    }

    private void saveInquiryCustomerCode(Object organizationId, Map<String, Object> input) {
        String inquiryCustomerCode = text(input, "inquiryCustomerCode");
        jdbcTemplate.update(
            "INSERT INTO customer_information_settings (organization_id, inquiry_customer_code) " +
                "VALUES (?, NULLIF(?, '')) " +
                "ON CONFLICT (organization_id) DO UPDATE SET " +
                "inquiry_customer_code = EXCLUDED.inquiry_customer_code, " +
                "inquiry_source_setting_id = CASE WHEN customer_information_settings.inquiry_customer_code " +
                "IS NOT DISTINCT FROM EXCLUDED.inquiry_customer_code THEN " +
                "customer_information_settings.inquiry_source_setting_id ELSE NULL END, " +
                "inquiry_external_customer_id = CASE WHEN customer_information_settings.inquiry_customer_code " +
                "IS NOT DISTINCT FROM EXCLUDED.inquiry_customer_code THEN " +
                "customer_information_settings.inquiry_external_customer_id ELSE NULL END, " +
                "inquiry_customer_name = CASE WHEN customer_information_settings.inquiry_customer_code " +
                "IS NOT DISTINCT FROM EXCLUDED.inquiry_customer_code THEN " +
                "customer_information_settings.inquiry_customer_name ELSE NULL END, " +
                "inquiry_last_synced_at = CASE WHEN customer_information_settings.inquiry_customer_code " +
                "IS NOT DISTINCT FROM EXCLUDED.inquiry_customer_code THEN " +
                "customer_information_settings.inquiry_last_synced_at ELSE NULL END, " +
                "revision = customer_information_settings.revision + 1, updated_at = CURRENT_TIMESTAMP",
            organizationId,
            inquiryCustomerCode
        );
    }

    private Map<String, Object> withInquiryCustomerCode(Map<String, Object> row, Map<String, Object> input) {
        Map<String, Object> mapped = new LinkedHashMap<>(row);
        String inquiryCustomerCode = text(input, "inquiryCustomerCode");
        mapped.put("inquiry_customer_code", inquiryCustomerCode);
        mapped.put("inquiry_customer_name", null);
        mapped.put("inquiry_last_synced_at", null);
        return mapped;
    }

    private Map<String, Object> organizationWithClassification(Map<String, Object> row) {
        if (row.get("classification_id") != null) {
            Map<String, Object> classification = jdbcTemplate.queryForMap("SELECT code, name FROM organization_classifications WHERE id = ?", row.get("classification_id"));
            row = new LinkedHashMap<>(row);
            row.put("classification_code", classification.get("code"));
            row.put("classification_name", classification.get("name"));
        }
        return organization(row);
    }

    private Map<String, Object> product(Map<String, Object> row, List<Map<String, Object>> versions) {
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"),
            "shortName", text(row, "short_name"), "versionSelectionMode", textOr(row, "version_selection_mode", "SINGLE"),
            "lifecycleStatus", textOr(row, "lifecycle_status", "ACTIVE"), "sortOrder", number(row, "sort_order"), "versions", versions);
    }

    private Map<String, Object> version(Map<String, Object> row, List<Map<String, Object>> modules) {
        return Map.of("id", text(row, "id"), "productId", text(row, "product_id"), "version", text(row, "version"),
            "displayVersion", text(row, "display_version"), "lifecycleStatus", textOr(row, "lifecycle_status", "ACTIVE"), "modules", modules);
    }

    private Map<String, Object> module(Map<String, Object> row) {
        return Map.of("id", text(row, "id"), "productVersionId", text(row, "product_version_id"),
            "productModuleId", text(row, "product_module_id"), "code", text(row, "code"), "name", text(row, "name"),
            "shortName", text(row, "short_name"), "lifecycleStatus", textOr(row, "lifecycle_status", "ACTIVE"), "sortOrder", number(row, "sort_order"));
    }

    private static String required(Map<String, Object> input, String key) {
        String value = text(input, key);
        if (value.isBlank()) {
            throw new IllegalArgumentException(key + " is required");
        }
        return value;
    }

    private static String text(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String textOr(Map<String, Object> row, String key, String fallback) {
        String value = text(row, key);
        return value.isBlank() ? fallback : value;
    }

    private static int number(Map<String, Object> row, String key) {
        Object value = row.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    private static long longId(Object value, String field) {
        try {
            return value instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(value));
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException(field + " is invalid", exception);
        }
    }

    private static Long nullableLongId(Object value, String field) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return longId(value, field);
    }
}
