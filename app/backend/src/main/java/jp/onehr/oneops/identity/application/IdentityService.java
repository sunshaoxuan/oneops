package jp.onehr.oneops.identity.application;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jp.onehr.oneops.identity.domain.SessionView;
import jp.onehr.oneops.identity.domain.UserView;
import jp.onehr.oneops.identity.infrastructure.PasswordHasher;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdentityService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordHasher passwordHasher;
    private final SessionService sessionService;
    private final long sessionTtlSeconds;

    public IdentityService(JdbcTemplate jdbcTemplate, PasswordHasher passwordHasher, SessionService sessionService,
                           @Value("${OPS_SESSION_TTL_SECONDS:28800}") long sessionTtlSeconds) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordHasher = passwordHasher;
        this.sessionService = sessionService;
        this.sessionTtlSeconds = sessionTtlSeconds;
    }

    public boolean bootstrapRequired() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        return count == null || count == 0;
    }

    @Transactional
    public RegistrationResult register(String username, String email, String displayName, String password,
                                       HttpServletRequest request, HttpServletResponse response) {
        String normalizedUsername = normalizeUsername(username);
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String normalizedDisplayName = displayName == null ? "" : displayName.trim();
        if (normalizedUsername.length() < 3 || normalizedDisplayName.isBlank() || password == null || password.length() < 8) {
            throw new IllegalArgumentException("Registration data is invalid");
        }
        boolean bootstrap = bootstrapRequired();
        UUID userId = UUID.randomUUID();
        try {
            jdbcTemplate.update(
                "INSERT INTO users (id, username, email, display_name, status) VALUES (?, ?, NULLIF(?, ''), ?, ?)",
                userId, normalizedUsername, normalizedEmail, normalizedDisplayName, bootstrap ? "ACTIVE" : "PENDING"
            );
            jdbcTemplate.update(
                "INSERT INTO auth_identities (user_id, provider, subject, subject_normalized, password_hash) VALUES (?, 'LOCAL', ?, ?, ?)",
                userId, normalizedUsername, normalizedUsername, passwordHasher.hash(password)
            );
            assignRole(userId, bootstrap ? "SYSTEM_ADMIN" : "VIEWER", null);
        } catch (DuplicateKeyException exception) {
            throw new IllegalStateException("Username or email is unavailable", exception);
        }
        UserView user = user(userId);
        if (bootstrap) {
            sessionService.issue(userId, null, request, response, sessionTtlSeconds);
        }
        return new RegistrationResult(user, bootstrap);
    }

    public UserView login(String login, String password, HttpServletRequest request, HttpServletResponse response) {
        String normalized = normalizeUsername(login);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT u.*, i.password_hash, i.id AS identity_id FROM users u JOIN auth_identities i ON i.user_id = u.id AND i.provider = 'LOCAL' " +
                "WHERE lower(u.username) = ? OR lower(COALESCE(u.email, '')) = ? LIMIT 1",
            normalized, login == null ? "" : login.trim().toLowerCase()
        );
        if (rows.isEmpty() || !passwordHasher.matches(password == null ? "" : password, String.valueOf(rows.get(0).get("password_hash")))
            || !"ACTIVE".equals(String.valueOf(rows.get(0).get("status")))) {
            throw new SecurityException("Login failed");
        }
        UUID userId = UUID.fromString(String.valueOf(rows.get(0).get("id")));
        jdbcTemplate.update("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", userId);
        jdbcTemplate.update("UPDATE auth_identities SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", rows.get(0).get("identity_id"));
        sessionService.issue(userId, null, request, response, sessionTtlSeconds);
        return user(userId);
    }

    public SessionView session(HttpServletRequest request) {
        String token = sessionService.sessionToken(request);
        if (token.isBlank()) {
            return null;
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT s.id AS session_id, s.csrf_hash, s.impersonator_user_id, u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id " +
                "WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1",
            SessionService.sha256(token)
        );
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        UUID userId = UUID.fromString(String.valueOf(row.get("id")));
        List<String> permissions = jdbcTemplate.queryForList(
            "SELECT DISTINCT p.code FROM user_role_assignments a JOIN role_permissions rp ON rp.role_id = a.role_id " +
                "JOIN permissions p ON p.id = rp.permission_id WHERE a.user_id = ? ORDER BY p.code", String.class, userId
        );
        UserView actor = null;
        Object impersonator = row.get("impersonator_user_id");
        if (impersonator != null) {
            actor = user(UUID.fromString(String.valueOf(impersonator)));
        }
        jdbcTemplate.update("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes'", row.get("session_id"));
        return new SessionView(String.valueOf(row.get("session_id")), mapUser(row), String.valueOf(row.get("csrf_hash")), permissions, Map.of(), actor);
    }

    public UserView updateProfile(HttpServletRequest request, String displayName) {
        SessionView session = requireSession(request);
        jdbcTemplate.update("UPDATE users SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", displayName == null ? "" : displayName.trim(), session.user().id());
        return user(UUID.fromString(session.user().id()));
    }

    public void logout(HttpServletRequest request) {
        sessionService.revoke(request);
    }

    @Transactional
    public void startImpersonation(String targetId, HttpServletRequest request, HttpServletResponse response) {
        SessionView current = requirePermission(request, "identity.users.impersonate");
        if (current.impersonator() != null) {
            throw new IllegalArgumentException("Impersonation cannot be nested");
        }
        UUID actorId = UUID.fromString(current.user().id());
        UUID targetUserId = UUID.fromString(targetId);
        if (actorId.equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot impersonate yourself");
        }
        UserView target = activeUser(targetUserId);
        if (!sessionService.csrfValid(request, current.csrfHash())) {
            throw new SecurityException("CSRF validation failed");
        }
        sessionService.issue(targetUserId, actorId, request, response, sessionTtlSeconds);
        audit(request, actorId, "IMPERSONATION_STARTED", "USER", targetUserId);
    }

    @Transactional
    public void stopImpersonation(HttpServletRequest request, HttpServletResponse response) {
        SessionView current = requireSession(request);
        if (current.impersonator() == null) {
            throw new IllegalArgumentException("Impersonation is not active");
        }
        if (!sessionService.csrfValid(request, current.csrfHash())) {
            throw new SecurityException("CSRF validation failed");
        }
        UUID actorId = UUID.fromString(current.impersonator().id());
        UUID targetId = UUID.fromString(current.user().id());
        activeUser(actorId);
        sessionService.revoke(request);
        sessionService.issue(actorId, null, request, response, sessionTtlSeconds);
        audit(request, actorId, "IMPERSONATION_STOPPED", "USER", targetId);
    }

    public SessionView requireSession(HttpServletRequest request) {
        SessionView current = session(request);
        if (current == null) {
            throw new SecurityException("Authentication required");
        }
        return current;
    }

    public SessionView requirePermission(HttpServletRequest request, String permission) {
        SessionView current = requireSession(request);
        if (!current.permissions().contains(permission)) {
            throw new SecurityException("Permission denied");
        }
        return current;
    }

    public List<Map<String, Object>> listManagedUsers() {
        List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT * FROM users ORDER BY created_at, username");
        List<Map<String, Object>> assignments = jdbcTemplate.queryForList(
            "SELECT a.id, a.user_id, a.organization_id, r.id AS role_id, r.code AS role_code, r.name AS role_name, o.code AS organization_code, o.name AS organization_name " +
                "FROM user_role_assignments a JOIN roles r ON r.id = a.role_id LEFT JOIN organizations o ON o.id = a.organization_id ORDER BY r.code, o.code"
        );
        return users.stream().map(row -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", text(row, "id")); result.put("username", text(row, "username")); result.put("email", text(row, "email")); result.put("displayName", text(row, "display_name")); result.put("status", text(row, "status")); result.put("locale", textOr(row, "locale", "ja-JP")); result.put("createdAt", row.get("created_at")); result.put("lastLoginAt", row.get("last_login_at"));
            result.put("identities", jdbcTemplate.queryForList("SELECT provider, subject, metadata FROM auth_identities WHERE user_id = ? ORDER BY provider, subject_normalized", row.get("id")));
            result.put("roleAssignments", assignments.stream().filter(item -> text(item, "user_id").equals(text(row, "id"))).map(item -> { Map<String, Object> assignment = new LinkedHashMap<>(); assignment.put("id", text(item, "id")); assignment.put("roleId", text(item, "role_id")); assignment.put("roleCode", text(item, "role_code")); assignment.put("roleName", text(item, "role_name")); assignment.put("organizationId", item.get("organization_id") == null ? null : text(item, "organization_id")); assignment.put("organizationCode", text(item, "organization_code")); assignment.put("organizationName", text(item, "organization_name")); return assignment; }).toList());
            return result;
        }).toList();
    }

    @Transactional
    public UserView updateManagedUser(String id, String status, List<Map<String, Object>> roleAssignments, UUID actorUserId) {
        if (!List.of("PENDING", "ACTIVE", "SUSPENDED").contains(status)) throw new IllegalArgumentException("Invalid user status");
        int updated = jdbcTemplate.update("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", status, id);
        if (updated == 0) throw new IllegalArgumentException("User not found");
        jdbcTemplate.update("DELETE FROM user_role_assignments WHERE user_id = ?", id);
        for (Map<String, Object> assignment : roleAssignments) {
            jdbcTemplate.update("INSERT INTO user_role_assignments (user_id, role_id, organization_id, created_by_user_id) SELECT ?, id, ?, ? FROM roles WHERE id = ? AND assignable = true", id, assignment.get("organizationId"), actorUserId, required(assignment, "roleId"));
        }
        jdbcTemplate.update("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", id);
        return user(UUID.fromString(id));
    }

    public Map<String, Object> rolesAndPermissions() {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("SELECT r.id, r.code, r.name, r.description, r.system_role, r.assignable, COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::text[]) AS permission_codes FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id GROUP BY r.id ORDER BY r.system_role DESC, r.code").stream().map(row -> { Map<String, Object> role = new LinkedHashMap<>(); role.put("id", text(row, "id")); role.put("code", text(row, "code")); role.put("name", text(row, "name")); role.put("description", text(row, "description")); role.put("systemRole", Boolean.TRUE.equals(row.get("system_role"))); role.put("assignable", Boolean.TRUE.equals(row.get("assignable"))); role.put("permissionCodes", row.get("permission_codes")); return role; }).toList();
        List<Map<String, Object>> permissions = jdbcTemplate.queryForList("SELECT id, code, resource, action, name, description FROM permissions ORDER BY code").stream().map(row -> { Map<String, Object> permission = new LinkedHashMap<>(); permission.put("id", text(row, "id")); permission.put("code", text(row, "code")); permission.put("resource", text(row, "resource")); permission.put("action", text(row, "action")); permission.put("name", text(row, "name")); permission.put("description", text(row, "description")); return (Map<String, Object>) permission; }).toList();
        return Map.of("roles", roles, "permissions", permissions);
    }

    @Transactional
    public Map<String, Object> saveRole(String id, Map<String, Object> input) {
        String code = required(input, "code").toUpperCase();
        String name = required(input, "name");
        String description = text(input, "description");
        Map<String, Object> row;
        if (id == null || id.isBlank()) {
            row = jdbcTemplate.queryForMap("INSERT INTO roles (code, name, description) VALUES (?, ?, ?) RETURNING id, code, name, description, system_role, assignable", code, name, description);
        } else {
            row = jdbcTemplate.queryForMap("UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND code <> 'SYSTEM_ADMIN' RETURNING id, code, name, description, system_role, assignable", name, description, id);
        }
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"), "description", text(row, "description"), "systemRole", Boolean.TRUE.equals(row.get("system_role")), "assignable", Boolean.TRUE.equals(row.get("assignable")), "permissionCodes", List.of());
    }

    public UserView user(UUID userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM users WHERE id = ?", userId);
        if (rows.isEmpty()) {
            throw new IllegalStateException("User not found");
        }
        return mapUser(rows.get(0));
    }

    private UserView activeUser(UUID userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM users WHERE id = ? AND status = 'ACTIVE'", userId
        );
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Target user is not active");
        }
        return mapUser(rows.get(0));
    }

    private void audit(HttpServletRequest request, UUID actorId, String eventType, String targetType, UUID targetId) {
        jdbcTemplate.update(
            "INSERT INTO auth_audit_events (actor_user_id, event_type, target_type, target_id, request_ip, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, '{}'::jsonb)",
            actorId, eventType, targetType, targetId,
            request.getRemoteAddr() == null ? "" : request.getRemoteAddr(),
            request.getHeader("User-Agent") == null ? "" : request.getHeader("User-Agent")
        );
    }

    private void assignRole(UUID userId, String roleCode, UUID actorUserId) {
        jdbcTemplate.update(
            "INSERT INTO user_role_assignments (user_id, role_id, organization_id, created_by_user_id) " +
                "SELECT ?, r.id, NULL, ? FROM roles r WHERE r.code = ? ON CONFLICT DO NOTHING",
            userId, actorUserId, roleCode
        );
    }

    private static String normalizeUsername(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static String required(Map<String, Object> input, String key) {
        String value = text(input, key);
        if (value.isBlank()) throw new IllegalArgumentException(key + " is required");
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

    private UserView mapUser(Map<String, Object> row) {
        UUID id = UUID.fromString(String.valueOf(row.get("id")));
        List<UserView.IdentityView> identities = jdbcTemplate.query(
            "SELECT provider, subject FROM auth_identities WHERE user_id = ? ORDER BY provider, subject_normalized",
            (ResultSet resultSet, int rowNumber) -> new UserView.IdentityView(resultSet.getString("provider"), resultSet.getString("subject")), id
        );
        return new UserView(
            id.toString(), String.valueOf(row.get("username")), String.valueOf(row.getOrDefault("email", "")),
            String.valueOf(row.get("display_name")), String.valueOf(row.get("status")), String.valueOf(row.get("locale")),
            date(row.get("created_at")), date(row.get("last_login_at")), identities
        );
    }

    private static OffsetDateTime date(Object value) {
        return value instanceof OffsetDateTime offsetDateTime ? offsetDateTime : null;
    }

    public record RegistrationResult(UserView user, boolean bootstrap) {
    }
}
