package jp.onehr.oneops.environment.web;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import jp.onehr.oneops.environment.application.EnvironmentService;
import jp.onehr.oneops.identity.application.IdentityService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-center/v1")
public class EnvironmentController {

    private final EnvironmentService service;
    private final IdentityService identityService;

    public EnvironmentController(EnvironmentService service, IdentityService identityService) {
        this.service = service;
        this.identityService = identityService;
    }

    @GetMapping("/organizations/{organizationId}/environment-inventory")
    public Map<String, Object> inventory(@PathVariable String organizationId, @RequestParam(defaultValue = "false") boolean includeArchived, HttpServletRequest request) {
        identityService.requirePermission(request, "environments.read");
        return service.inventory(organizationId, includeArchived);
    }

    @PostMapping("/environment-groups")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("group", service.createGroup(input)));
    }

    @PutMapping("/environment-groups/{id}")
    public Map<String, Object> updateGroup(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return Map.of("group", service.updateGroup(id, input));
    }

    @PostMapping("/environment-groups/{id}/archive")
    public Map<String, Object> archiveGroup(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return Map.of("group", service.archiveGroup(id, String.valueOf(input.get("organizationId"))));
    }

    @PostMapping("/environments")
    public ResponseEntity<Map<String, Object>> createEnvironment(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("environment", service.createEnvironment(input)));
    }

    @PutMapping("/environments/{id}")
    public Map<String, Object> updateEnvironment(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return Map.of("environment", service.updateEnvironment(id, input));
    }

    @PostMapping("/environments/{id}/{action:archive|restore}")
    public Map<String, Object> changeEnvironmentState(@PathVariable String id, @PathVariable String action, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return Map.of("environment", service.archiveEnvironment(id, String.valueOf(input.get("organizationId")), "archive".equals(action)));
    }

    @PostMapping("/environment-endpoints")
    public ResponseEntity<Map<String, Object>> createEndpoint(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("endpoint", service.createEndpoint(input)));
    }

    @PutMapping("/environment-endpoints/{id}")
    public Map<String, Object> updateEndpoint(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.write");
        return Map.of("endpoint", service.updateEndpoint(id, input));
    }

    @GetMapping("/environment-endpoint-credentials/{id}")
    public Map<String, Object> credential(@PathVariable String id, @RequestParam String organizationId, HttpServletRequest request) {
        identityService.requirePermission(request, "environments.credentials.read");
        Map<String, Object> credential = service.getCredential(id, organizationId);
        if (credential == null) throw new IllegalArgumentException("Environment credential not found");
        return Map.of("credential", credential);
    }

    @PutMapping("/environment-endpoint-credentials/{id}")
    public Map<String, Object> saveCredential(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "environments.credentials.write");
        Map<String, Object> credential = service.saveCredential(id, input);
        if (credential == null) throw new IllegalArgumentException("Environment endpoint not found");
        return Map.of("credential", credential);
    }
}
