package jp.onehr.oneops.environment.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import jp.onehr.oneops.masterdata.application.MasterDataService;

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class EnvironmentCrudDatabaseTest {

    @Autowired
    private EnvironmentService environmentService;

    @Autowired
    private MasterDataService masterDataService;

    @Test
    void 実PostgreSQLで環境台帳と認証情報のCRUDを自動ロールバックする() {
        String classificationId = String.valueOf(masterDataService.createClassification(Map.of(
            "code", "ENV_CRUD_CLASS", "name", "環境 CRUD 検証区分"
        )).get("id"));
        String organizationId = String.valueOf(masterDataService.createOrganization(Map.of(
            "classificationId", classificationId,
            "code", "ENV_CRUD_ORG",
            "name", "環境 CRUD 検証組織",
            "shortName", "ENVCRUD",
            "maintenanceStatus", "〇",
            "remarks", "自動ロールバック検証"
        )).get("id"));
        String productId = String.valueOf(masterDataService.createProduct(Map.of(
            "code", "ENV_CRUD_PRODUCT",
            "name", "環境 CRUD 検証製品",
            "shortName", "ENVCRUD",
            "sortOrder", 9999
        )).get("id"));
        String versionId = String.valueOf(masterDataService.createVersion(Map.of(
            "productId", productId, "version", "1.0", "displayVersion", "V1.0"
        )).get("id"));
        String moduleId = String.valueOf(masterDataService.createVersionModule(Map.of(
            "productVersionId", versionId,
            "code", "ENV_CRUD_MODULE",
            "name", "環境 CRUD 検証モジュール",
            "shortName", "ENVCRUDM",
            "sortOrder", 1
        )).get("id"));

        String groupId = String.valueOf(environmentService.createGroup(Map.of(
            "organizationId", organizationId, "name", "CRUD 基本環境", "sortOrder", 1
        )).get("id"));
        assertThat(environmentService.updateGroup(groupId, Map.of(
            "organizationId", organizationId, "name", "CRUD 基本環境更新", "sortOrder", 2
        )).get("name")).isEqualTo("CRUD 基本環境更新");

        Map<String, Object> environment = environmentService.createEnvironment(Map.ofEntries(
            Map.entry("organizationId", organizationId),
            Map.entry("groupId", groupId),
            Map.entry("name", "CRUD 検証環境"),
            Map.entry("scope", "INTERNAL"),
            Map.entry("purpose", "DEVELOPMENT"),
            Map.entry("status", "ACTIVE"),
            Map.entry("url", "https://crud.example.test"),
            Map.entry("ownerName", "検証担当"),
            Map.entry("notes", "自動ロールバック検証"),
            Map.entry("sortOrder", 1),
            Map.entry("lastVerifiedAt", "2026-08-03"),
            Map.entry("products", List.of(Map.of(
                "productVersionId", versionId,
                "usageStatus", "ACTIVE",
                "notes", "CRUD 検証",
                "moduleIds", List.of(moduleId)
            )))
        ));
        String environmentId = String.valueOf(environment.get("id"));
        Map<String, Object> updatedEnvironment = environmentService.updateEnvironment(environmentId, Map.ofEntries(
            Map.entry("organizationId", organizationId),
            Map.entry("groupId", groupId),
            Map.entry("name", "CRUD 検証環境更新"),
            Map.entry("scope", "INTERNAL"),
            Map.entry("purpose", "DEVELOPMENT"),
            Map.entry("status", "ACTIVE"),
            Map.entry("url", "https://crud-updated.example.test"),
            Map.entry("ownerName", "検証担当"),
            Map.entry("notes", "更新検証"),
            Map.entry("sortOrder", 2),
            Map.entry("revision", environment.get("revision")),
            Map.entry("lastVerifiedAt", "2026-08-03"),
            Map.entry("products", List.of(Map.of(
                "productVersionId", versionId,
                "usageStatus", "ACTIVE",
                "notes", "更新検証",
                "moduleIds", List.of(moduleId)
            )))
        ));
        assertThat(updatedEnvironment.get("name")).isEqualTo("CRUD 検証環境更新");

        String endpointId = String.valueOf(environmentService.createEndpoint(Map.ofEntries(
            Map.entry("environmentId", environmentId),
            Map.entry("organizationId", organizationId),
            Map.entry("name", "CRUD 接続先"),
            Map.entry("role", "AP"),
            Map.entry("hostname", "crud.example.test"),
            Map.entry("ipAddress", "192.0.2.10"),
            Map.entry("port", 443),
            Map.entry("protocol", "HTTPS"),
            Map.entry("databaseType", ""),
            Map.entry("databaseVersion", ""),
            Map.entry("databaseName", ""),
            Map.entry("notes", "CRUD 検証"),
            Map.entry("status", "ACTIVE"),
            Map.entry("sortOrder", 1)
        )).get("id"));
        assertThat(environmentService.updateEndpoint(endpointId, Map.ofEntries(
            Map.entry("environmentId", environmentId),
            Map.entry("organizationId", organizationId),
            Map.entry("name", "CRUD 接続先更新"),
            Map.entry("role", "AP"),
            Map.entry("hostname", "crud-updated.example.test"),
            Map.entry("ipAddress", "192.0.2.11"),
            Map.entry("port", 8443),
            Map.entry("protocol", "HTTPS"),
            Map.entry("databaseType", ""),
            Map.entry("databaseVersion", ""),
            Map.entry("databaseName", ""),
            Map.entry("notes", "更新検証"),
            Map.entry("status", "ACTIVE"),
            Map.entry("sortOrder", 2)
        )).get("name")).isEqualTo("CRUD 接続先更新");

        assertThat(environmentService.saveCredential(endpointId, Map.of(
            "organizationId", organizationId,
            "username", "crud-user",
            "password", "crud-password"
        )).get("credentialConfigured")).isEqualTo(true);
        Map<String, Object> credential = environmentService.getCredential(endpointId, organizationId);
        assertThat(credential.get("username")).isEqualTo("crud-user");
        assertThat(credential.get("password")).isEqualTo("crud-password");

        assertThat(environmentService.archiveEnvironment(environmentId, organizationId, true).get("status"))
            .isEqualTo("RETIRED");
        assertThat(environmentService.archiveEnvironment(environmentId, organizationId, false).get("status"))
            .isEqualTo("ACTIVE");
        assertThat(environmentService.inventory(organizationId, false).toString())
            .contains("CRUD 検証環境更新");

        String emptyGroupId = String.valueOf(environmentService.createGroup(Map.of(
            "organizationId", organizationId, "name", "CRUD 空環境", "sortOrder", 99
        )).get("id"));
        assertThat(environmentService.archiveGroup(emptyGroupId, organizationId).get("archivedAt"))
            .isNotNull();
    }
}
