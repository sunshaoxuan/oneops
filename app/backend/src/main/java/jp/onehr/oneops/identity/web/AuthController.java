package jp.onehr.oneops.identity.web;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.application.SessionService;
import jp.onehr.oneops.identity.domain.SessionView;
import jp.onehr.oneops.identity.domain.UserView;

import org.springframework.beans.factory.annotation.Value;
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
@RequestMapping("/api/work-center/v1/auth")
public class AuthController {

    private final IdentityService identityService;
    private final SessionService sessionService;
    private final String windowsSsoUrl;
    private final boolean windowsSsoEnabled;

    public AuthController(IdentityService identityService, SessionService sessionService,
                          @Value("${OPS_SSO_WINDOWS_SSO_URL:}") String windowsSsoUrl,
                          @Value("${OPS_SSO_AUTO_LOGIN:false}") boolean windowsSsoEnabled) {
        this.identityService = identityService;
        this.sessionService = sessionService;
        this.windowsSsoUrl = windowsSsoUrl;
        this.windowsSsoEnabled = windowsSsoEnabled;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        return Map.of(
            "bootstrapRequired", identityService.bootstrapRequired(),
            "windowsSsoEnabled", windowsSsoEnabled,
            "windowsSsoAutoLogin", windowsSsoEnabled,
            "windowsSsoUrl", windowsSsoUrl
        );
    }

    @GetMapping("/session")
    public Map<String, Object> session(HttpServletRequest request) {
        SessionView current = identityService.session(request);
        if (current == null) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("authenticated", false);
            body.put("user", null);
            body.put("permissions", java.util.List.of());
            body.put("impersonation", null);
            return body;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", true);
        body.put("user", current.user());
        body.put("permissions", current.permissions());
        body.put("impersonation", current.impersonator() == null ? null : Map.of("actor", current.impersonator()));
        return body;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegistrationRequest input,
                                                          HttpServletRequest request,
                                                          HttpServletResponse response) {
        IdentityService.RegistrationResult result = identityService.register(input.username(), input.email(), input.displayName(), input.password(), request, response);
        Map<String, Object> body = result.bootstrap()
            ? Map.of("user", result.user(), "bootstrap", true, "authenticated", true)
            : Map.of("user", result.user(), "bootstrap", false, "authenticated", false, "pendingApproval", true);
        return ResponseEntity.status(result.bootstrap() ? HttpStatus.CREATED : HttpStatus.ACCEPTED).body(body);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest input, HttpServletRequest request, HttpServletResponse response) {
        UserView user = identityService.login(input.login(), input.password(), request, response);
        return Map.of("authenticated", true, "user", user);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request) {
        SessionView current = identityService.requireSession(request);
        if (!sessionService.csrfValid(request, current.csrfHash())) {
            throw new SecurityException("CSRF validation failed");
        }
        identityService.logout(request);
        return Map.of("authenticated", false);
    }

    @PutMapping("/profile")
    public Map<String, Object> profile(@RequestBody ProfileRequest input, HttpServletRequest request) {
        SessionView current = identityService.requireSession(request);
        if (!sessionService.csrfValid(request, current.csrfHash())) {
            throw new SecurityException("CSRF validation failed");
        }
        return Map.of("user", identityService.updateProfile(request, input.displayName()));
    }

    @PostMapping("/impersonation/{id}")
    public Map<String, Object> impersonation(@PathVariable String id, HttpServletRequest request, HttpServletResponse response) {
        identityService.startImpersonation(id, request, response);
        return Map.of("authenticated", true);
    }

    @PostMapping("/impersonation/stop")
    public Map<String, Object> stopImpersonation(HttpServletRequest request, HttpServletResponse response) {
        identityService.stopImpersonation(request, response);
        return Map.of("authenticated", true);
    }

    @GetMapping("/users")
    public Map<String, Object> users(HttpServletRequest request) {
        identityService.requirePermission(request, "identity.users.read");
        return Map.of("users", identityService.listManagedUsers());
    }

    @PutMapping("/users/{id}")
    public Map<String, Object> updateUser(@PathVariable String id, @RequestBody ManagedUserRequest input, HttpServletRequest request) {
        SessionView current = identityService.requirePermission(request, "identity.users.write");
        return Map.of("user", identityService.updateManagedUser(id, input.status(), input.roleAssignments() == null ? List.of() : input.roleAssignments(), UUID.fromString(current.user().id())));
    }

    @GetMapping("/roles")
    public Map<String, Object> roles(HttpServletRequest request) {
        identityService.requirePermission(request, "identity.roles.read");
        return identityService.rolesAndPermissions();
    }

    @PostMapping("/roles")
    public ResponseEntity<Map<String, Object>> createRole(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requirePermission(request, "identity.roles.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("role", identityService.saveRole(null, input)));
    }

    @PutMapping("/roles/{id}")
    public Map<String, Object> updateRole(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requirePermission(request, "identity.roles.write");
        return Map.of("role", identityService.saveRole(id, input));
    }

    public record RegistrationRequest(String username, String email, String displayName, String password) {
    }

    public record LoginRequest(String login, String password) {
    }

    public record ProfileRequest(String displayName) {
    }

    public record ManagedUserRequest(String status, List<Map<String, Object>> roleAssignments) {
    }
}
