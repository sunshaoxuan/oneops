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
    private final String envPortalSsoUrl;
    private final String envPortalProfileUrl;
    private final String windowsSsoProxyUrl;
    private final String ssoSharedSecret;
    private final boolean autoWindowsSso;

    public AuthController(IdentityService identityService, SessionService sessionService,
                          @Value("${OPS_ENVPORTAL_SSO_URL:}") String envPortalSsoUrl,
                          @Value("${OPS_ENVPORTAL_PROFILE_URL:}") String envPortalProfileUrl,
                          @Value("${OPS_WINDOWS_SSO_PROXY_URL:}") String windowsSsoProxyUrl,
                          @Value("${OPS_SSO_SHARED_SECRET:}") String ssoSharedSecret,
                          @Value("${OPS_SSO_AUTO_LOGIN:false}") boolean autoWindowsSso) {
        this.identityService = identityService;
        this.sessionService = sessionService;
        this.envPortalSsoUrl = envPortalSsoUrl == null ? "" : envPortalSsoUrl.trim();
        this.envPortalProfileUrl = envPortalProfileUrl == null ? "" : envPortalProfileUrl.trim();
        this.windowsSsoProxyUrl = windowsSsoProxyUrl == null ? "" : windowsSsoProxyUrl.trim();
        this.ssoSharedSecret = ssoSharedSecret == null ? "" : ssoSharedSecret.trim();
        this.autoWindowsSso = autoWindowsSso;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        boolean envPortalSsoEnabled = !envPortalSsoUrl.isBlank() && !envPortalProfileUrl.isBlank();
        boolean signedProxySsoEnabled = !windowsSsoProxyUrl.isBlank() && !ssoSharedSecret.isBlank();
        boolean windowsSsoEnabled = envPortalSsoEnabled || signedProxySsoEnabled;
        String windowsSsoUrl = envPortalSsoEnabled
            ? envPortalSsoUrl
            : signedProxySsoEnabled
                ? windowsSsoProxyUrl.replaceAll("/$", "") + "/api/work-center/v1/auth/sso/windows/begin"
                : "";
        return Map.of(
            "bootstrapRequired", identityService.bootstrapRequired(),
            "windowsSsoEnabled", windowsSsoEnabled,
            "windowsSsoAutoLogin", autoWindowsSso && windowsSsoEnabled,
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
        throw new SecurityException("Self-registration is temporarily disabled");
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
        SessionView current = identityService.requireMutationPermission(request, "identity.users.write");
        return Map.of("user", identityService.updateManagedUser(
            id,
            input.status(),
            input.roleAssignments() == null ? List.of() : input.roleAssignments(),
            input.departmentMemberships() == null ? List.of() : input.departmentMemberships(),
            input.responsibilityAssignments() == null ? List.of() : input.responsibilityAssignments(),
            UUID.fromString(current.user().id())
        ));
    }

    @GetMapping("/roles")
    public Map<String, Object> roles(HttpServletRequest request) {
        identityService.requirePermission(request, "identity.roles.read");
        return identityService.rolesAndPermissions();
    }

    @PostMapping("/roles")
    public ResponseEntity<Map<String, Object>> createRole(@RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "identity.roles.write");
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("role", identityService.saveRole(null, input)));
    }

    @PutMapping("/roles/{id}")
    public Map<String, Object> updateRole(@PathVariable String id, @RequestBody Map<String, Object> input, HttpServletRequest request) {
        identityService.requireMutationPermission(request, "identity.roles.write");
        return Map.of("role", identityService.saveRole(id, input));
    }

    public record RegistrationRequest(String username, String email, String displayName, String password) {
    }

    public record LoginRequest(String login, String password) {
    }

    public record ProfileRequest(String displayName) {
    }

    public record ManagedUserRequest(String status, List<Map<String, Object>> roleAssignments,
                                     List<Map<String, Object>> departmentMemberships,
                                     List<Map<String, Object>> responsibilityAssignments) {
    }
}
