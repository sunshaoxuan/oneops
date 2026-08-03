package jp.onehr.oneops.masterdata.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class MasterDataCrudDatabaseTest {

    @Autowired
    private MasterDataService service;

    @Test
    void 実PostgreSQLで基本台帳の作成読取更新を自動ロールバックする() {
        Map<String, Object> classification = service.createClassification(Map.of(
            "code", "CRUD_CLASS",
            "name", "CRUD 検証区分"
        ));
        String classificationId = String.valueOf(classification.get("id"));
        Map<String, Object> updatedClassification = service.updateClassification(classificationId, Map.of(
            "code", "CRUD_CLASS_UPDATED",
            "name", "CRUD 検証区分更新"
        ));
        assertThat(updatedClassification.get("code")).isEqualTo("CRUD_CLASS_UPDATED");

        Map<String, Object> organization = service.createOrganization(Map.of(
            "classificationId", classificationId,
            "code", "CRUD_ORG",
            "name", "CRUD 検証組織",
            "shortName", "CRUD",
            "maintenanceStatus", "〇",
            "remarks", "自動ロールバック検証"
        ));
        String organizationId = String.valueOf(organization.get("id"));
        Map<String, Object> updatedOrganization = service.updateOrganization(organizationId, Map.of(
            "classificationId", classificationId,
            "code", "CRUD_ORG_UPDATED",
            "name", "CRUD 検証組織更新",
            "shortName", "CRUD2",
            "maintenanceStatus", "✕",
            "remarks", "更新検証"
        ));
        assertThat(updatedOrganization.get("code")).isEqualTo("CRUD_ORG_UPDATED");

        Map<String, Object> product = service.createProduct(Map.of(
            "code", "CRUD_PRODUCT",
            "name", "CRUD 検証製品",
            "shortName", "CRUDP",
            "sortOrder", 9999
        ));
        String productId = String.valueOf(product.get("id"));
        assertThat(service.updateProduct(productId, Map.of(
            "code", "CRUD_PRODUCT_UPDATED",
            "name", "CRUD 検証製品更新",
            "shortName", "CRUDPU",
            "sortOrder", 9998
        )).get("code")).isEqualTo("CRUD_PRODUCT_UPDATED");

        Map<String, Object> version = service.createVersion(Map.of(
            "productId", productId,
            "version", "1.0",
            "displayVersion", "V1.0"
        ));
        String versionId = String.valueOf(version.get("id"));
        assertThat(service.updateVersion(versionId, Map.of(
            "productId", productId,
            "version", "1.1",
            "displayVersion", "V1.1"
        )).get("version")).isEqualTo("1.1");

        Map<String, Object> module = service.createVersionModule(Map.of(
            "productVersionId", versionId,
            "code", "CRUD_MODULE",
            "name", "CRUD 検証モジュール",
            "shortName", "CRUDM",
            "sortOrder", 10
        ));
        String moduleId = String.valueOf(module.get("id"));
        assertThat(service.updateVersionModule(moduleId, Map.of(
            "productVersionId", versionId,
            "code", "CRUD_MODULE_UPDATED",
            "name", "CRUD 検証モジュール更新",
            "shortName", "CRUDMU",
            "sortOrder", 11
        )).get("code")).isEqualTo("CRUD_MODULE_UPDATED");

        assertThat(service.listClassifications().toString()).contains("CRUD_CLASS_UPDATED");
        assertThat(service.listOrganizations().toString()).contains("CRUD_ORG_UPDATED");
        assertThat(service.listProducts().toString()).contains("CRUD_PRODUCT_UPDATED");
    }
}
