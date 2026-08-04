package jp.onehr.oneops.workforce.web;

import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.domain.SessionView;
import jp.onehr.oneops.workforce.application.WorkforcePolicyService;

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
public class WorkforcePolicyController {

    private final IdentityService identityService;
    private final WorkforcePolicyService workforcePolicyService;

    public WorkforcePolicyController(IdentityService identityService, WorkforcePolicyService workforcePolicyService) {
        this.identityService = identityService;
        this.workforcePolicyService = workforcePolicyService;
    }

    @GetMapping("/internal-workforce")
    public Map<String, Object> catalog(HttpServletRequest request) {
        identityService.requirePermission(request, "identity.workforce.read");
        return workforcePolicyService.catalog();
    }

    @GetMapping("/internal-workforce/me")
    public Map<String, Object> myWorkforce(HttpServletRequest request) {
        SessionView session = identityService.requireSession(request);
        UUID userId = userId(session);
        return Map.of(
            "departmentMemberships", workforcePolicyService.memberships(userId),
            "responsibilityAssignments", workforcePolicyService.responsibilityAssignments(userId)
        );
    }

    @PostMapping("/internal-workforce/departments")
    public ResponseEntity<Map<String, Object>> createDepartment(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "identity.workforce.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "department", workforcePolicyService.saveDepartment(null, input, userId(session))
        ));
    }

    @PutMapping("/internal-workforce/departments/{id}")
    public Map<String, Object> updateDepartment(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "identity.workforce.write");
        return Map.of("department", workforcePolicyService.saveDepartment(id, input, userId(session)));
    }

    @PostMapping("/internal-workforce/responsibilities")
    public ResponseEntity<Map<String, Object>> createResponsibility(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "identity.workforce.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "responsibility", workforcePolicyService.saveResponsibility(null, input, userId(session))
        ));
    }

    @PutMapping("/internal-workforce/responsibilities/{id}")
    public Map<String, Object> updateResponsibility(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "identity.workforce.write");
        return Map.of("responsibility", workforcePolicyService.saveResponsibility(id, input, userId(session)));
    }

    @GetMapping("/inquiry-search-templates")
    public Map<String, Object> templates(HttpServletRequest request) {
        identityService.requirePermission(request, "inquiries.templates.read");
        return workforcePolicyService.templates();
    }

    @PostMapping("/inquiry-search-templates")
    public ResponseEntity<Map<String, Object>> createTemplate(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "inquiries.templates.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "template", workforcePolicyService.saveTemplate(null, input, userId(session))
        ));
    }

    @PutMapping("/inquiry-search-templates/{id}")
    public Map<String, Object> updateTemplate(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        SessionView session = identityService.requireMutationPermission(request, "inquiries.templates.write");
        return Map.of("template", workforcePolicyService.saveTemplate(id, input, userId(session)));
    }

    @GetMapping("/inquiry-search-policy/effective")
    public Map<String, Object> effectiveTemplate(HttpServletRequest request) {
        SessionView session = identityService.requirePermission(request, "inquiries.use");
        return workforcePolicyService.effectiveTemplate(userId(session));
    }

    private static UUID userId(SessionView session) {
        return UUID.fromString(session.user().id());
    }
}
