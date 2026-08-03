package jp.onehr.oneops.masterdata.web;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.masterdata.application.MasterDataService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-center/v1")
public class MasterDataController {

    private final MasterDataService service;
    private final IdentityService identityService;

    public MasterDataController(MasterDataService service, IdentityService identityService) {
        this.service = service;
        this.identityService = identityService;
    }

    @GetMapping("/organization-classifications")
    public Map<String, Object> classifications(HttpServletRequest request) {
        identityService.requirePermission(request, "catalog.read");
        return Map.of("classifications", service.listClassifications());
    }

    @PostMapping("/organization-classifications")
    public ResponseEntity<Map<String, Object>> createClassification(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("classification", service.createClassification(input)));
    }

    @PutMapping("/organization-classifications/{id}")
    public Map<String, Object> updateClassification(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        Map<String, Object> classification = service.updateClassification(id, input);
        if (classification == null) {
            throw new IllegalArgumentException("Classification not found");
        }
        return Map.of("classification", classification);
    }

    @GetMapping("/organizations")
    public Map<String, Object> organizations(HttpServletRequest request) {
        identityService.requirePermission(request, "organizations.read");
        return Map.of("organizations", service.listOrganizations());
    }

    @PostMapping("/organizations")
    public ResponseEntity<Map<String, Object>> createOrganization(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "organizations.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("organization", service.createOrganization(input)));
    }

    @PutMapping("/organizations/{id}")
    public Map<String, Object> updateOrganization(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "organizations.write");
        Map<String, Object> organization = service.updateOrganization(id, input);
        if (organization == null) {
            throw new IllegalArgumentException("Organization not found");
        }
        return Map.of("organization", organization);
    }

    @GetMapping("/products")
    public Map<String, Object> products(HttpServletRequest request) {
        identityService.requirePermission(request, "catalog.read");
        return Map.of("products", service.listProducts());
    }

    @PostMapping("/products")
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("product", service.createProduct(input)));
    }

    @PutMapping("/products/{id}")
    public Map<String, Object> updateProduct(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        Map<String, Object> product = service.updateProduct(id, input);
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }
        return Map.of("product", product);
    }

    @PostMapping("/product-versions")
    public ResponseEntity<Map<String, Object>> createVersion(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        Map<String, Object> version = service.createVersion(input);
        if (version == null) {
            throw new IllegalArgumentException("Product not found");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("productVersion", version));
    }

    @PutMapping("/product-versions/{id}")
    public Map<String, Object> updateVersion(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        Map<String, Object> version = service.updateVersion(id, input);
        if (version == null) {
            throw new IllegalArgumentException("Product version not found");
        }
        return Map.of("productVersion", version);
    }

    @PostMapping("/product-version-modules")
    public ResponseEntity<Map<String, Object>> createModule(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("productVersionModule", service.createVersionModule(input)));
    }

    @PutMapping("/product-version-modules/{id}")
    public Map<String, Object> updateModule(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "catalog.write");
        Map<String, Object> module = service.updateVersionModule(id, input);
        if (module == null) {
            throw new IllegalArgumentException("Product version module not found");
        }
        return Map.of("productVersionModule", module);
    }
}
