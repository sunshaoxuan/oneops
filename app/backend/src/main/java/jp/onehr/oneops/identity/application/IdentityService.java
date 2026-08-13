package jp.onehr.oneops.identity.application;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jp.onehr.oneops.identity.domain.SessionView;
import jp.onehr.oneops.identity.domain.UserView;
import jp.onehr.oneops.identity.infrastructure.PasswordHasher;
import jp.onehr.oneops.workforce.application.WorkforcePolicyService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.ObjectMapper;

@Service
public class IdentityService {

    private static final Pattern ROLE_CODE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{2,63}$");
    private static final Pattern WINDOWS_SUBJECT_PATTERN = Pattern.compile("^([^\\\\]+)\\\\([^\\\\]+)$");
    private static final Pattern UPN_PATTERN = Pattern.compile("^([^@]+)@([^@]+)$");

    private final JdbcTemplate jdbcTemplate;
    private final PasswordHasher passwordHasher;
    private final SessionService sessionService;
    private final WorkforcePolicyService workforcePolicyService;
    private final long sessionTtlSeconds;
    private final List<String> allowedWindowsDomains;
    private final List<String> allowedUpnDomains;
    private final Map<String, String> windowsUpnSuffixes;

    @Autowired
    public IdentityService(JdbcTemplate jdbcTemplate, PasswordHasher passwordHasher, SessionService sessionService,
                           WorkforcePolicyService workforcePolicyService,
                           @Value("${OPS_SESSION_TTL_SECONDS:28800}") long sessionTtlSeconds,
                           @Value("${OPS_SSO_ALLOWED_WINDOWS_DOMAINS:tokyo}") String allowedWindowsDomains,
                           @Value("${OPS_SSO_ALLOWED_DOMAINS:tokyo.scientia.co.jp}") String allowedUpnDomains,
                           @Value("${OPS_SSO_WINDOWS_UPN_SUFFIXES:}") String windowsUpnSuffixes) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordHasher = passwordHasher;
        this.sessionService = sessionService;
        this.workforcePolicyService = workforcePolicyService;
        this.sessionTtlSeconds = sessionTtlSeconds;
        this.allowedWindowsDomains = commaSeparated(allowedWindowsDomains);
        this.allowedUpnDomains = commaSeparated(allowedUpnDomains);
        this.windowsUpnSuffixes = windowsUpnSuffixes(windowsUpnSuffixes);
    }

    public IdentityService(JdbcTemplate jdbcTemplate, PasswordHasher passwordHasher, SessionService sessionService,
                           long sessionTtlSeconds) {
        this(jdbcTemplate, passwordHasher, sessionService, sessionTtlSeconds,
            "tokyo", "tokyo.scientia.co.jp", "{\"tokyo\":\"tokyo.scientia.co.jp\"}");
    }

    IdentityService(JdbcTemplate jdbcTemplate, PasswordHasher passwordHasher, SessionService sessionService,
                    long sessionTtlSeconds, String allowedWindowsDomains, String allowedUpnDomains,
                    String windowsUpnSuffixes) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordHasher = passwordHasher;
        this.sessionService = sessionService;
        this.workforcePolicyService = null;
        this.sessionTtlSeconds = sessionTtlSeconds;
        this.allowedWindowsDomains = commaSeparated(allowedWindowsDomains);
        this.allowedUpnDomains = commaSeparated(allowedUpnDomains);
        this.windowsUpnSuffixes = windowsUpnSuffixes(windowsUpnSuffixes);
    }

    public boolean bootstrapRequired() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        return count == null || count == 0;
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

    public UserView updateProfile(HttpServletRequest request, String displayName, boolean compactPageHeadings) {
        SessionView session = requireSession(request);
        UUID userId = uuid(session.user().id(), "userId");
        jdbcTemplate.update(
            "UPDATE users SET display_name = ?, compact_page_headings = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            displayName == null ? "" : displayName.trim(), compactPageHeadings, userId
        );
        return user(userId);
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

    public SessionView requireMutationPermission(HttpServletRequest request, String permission) {
        SessionView current = requirePermission(request, permission);
        if (!sessionService.csrfValid(request, current.csrfHash())) {
            throw new SecurityException("CSRF validation failed");
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
            result.put("identities", jdbcTemplate.queryForList(
                "SELECT provider, subject, metadata FROM auth_identities WHERE user_id = ? ORDER BY provider, subject_normalized",
                row.get("id")
            ).stream().map(IdentityService::managedIdentity).toList());
            result.put("externalProfiles", jdbcTemplate.queryForList(
                "SELECT profile.id, system.id AS external_system_id, system.code AS system_code, system.name AS system_name, " +
                    "profile.external_user_id, profile.external_user_code, profile.external_display_name, profile.metadata, profile.enabled, profile.revision " +
                    "FROM external_systems system LEFT JOIN user_external_profiles profile ON profile.external_system_id = system.id AND profile.user_id = ? " +
                    "WHERE system.enabled ORDER BY system.code", row.get("id")
            ).stream().map(item -> { Map<String, Object> profile = new LinkedHashMap<>(); profile.put("id", text(item, "id")); profile.put("externalSystemId", text(item, "external_system_id")); profile.put("systemCode", text(item, "system_code")); profile.put("systemName", text(item, "system_name")); profile.put("externalUserId", text(item, "external_user_id")); profile.put("externalUserCode", text(item, "external_user_code")); profile.put("externalDisplayName", text(item, "external_display_name")); profile.put("metadata", item.get("metadata")); profile.put("enabled", item.get("id") == null || Boolean.TRUE.equals(item.get("enabled"))); profile.put("revision", item.get("revision")); return profile; }).toList());
            result.put("roleAssignments", assignments.stream().filter(item -> text(item, "user_id").equals(text(row, "id"))).map(item -> { Map<String, Object> assignment = new LinkedHashMap<>(); assignment.put("id", text(item, "id")); assignment.put("roleId", text(item, "role_id")); assignment.put("roleCode", text(item, "role_code")); assignment.put("roleName", text(item, "role_name")); assignment.put("organizationId", item.get("organization_id") == null ? null : text(item, "organization_id")); assignment.put("organizationCode", text(item, "organization_code")); assignment.put("organizationName", text(item, "organization_name")); return assignment; }).toList());
            UUID userId = uuid(row.get("id"), "userId");
            result.put("departmentMemberships", workforcePolicyService == null ? List.of() : workforcePolicyService.memberships(userId));
            result.put("responsibilityAssignments", workforcePolicyService == null ? List.of() : workforcePolicyService.responsibilityAssignments(userId));
            return result;
        }).toList();
    }

    @Transactional
    public UserView updateManagedUser(String id, String status, List<Map<String, Object>> roleAssignments, UUID actorUserId) {
        if (!List.of("PENDING", "ACTIVE", "SUSPENDED").contains(status)) throw new IllegalArgumentException("Invalid user status");
        UUID userId = uuid(id, "userId");
        int updated = jdbcTemplate.update("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", status, userId);
        if (updated == 0) throw new IllegalArgumentException("User not found");
        jdbcTemplate.update("DELETE FROM user_role_assignments WHERE user_id = ?", userId);
        for (Map<String, Object> assignment : roleAssignments) {
            UUID roleId = uuid(required(assignment, "roleId"), "roleId");
            Object organizationId = assignment.get("organizationId");
            Long scopeId = organizationId == null || String.valueOf(organizationId).isBlank()
                ? null
                : longId(organizationId, "organizationId");
            int inserted = jdbcTemplate.update("INSERT INTO user_role_assignments (user_id, role_id, organization_id, created_by_user_id) SELECT ?, id, ?, ? FROM roles WHERE id = ? AND assignable = true", userId, scopeId, actorUserId, roleId);
            if (inserted == 0) throw new IllegalArgumentException("Assignable role not found");
        }
        jdbcTemplate.update("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", userId);
        return user(userId);
    }

    @Transactional
    public UserView updateManagedUser(String id, String status, List<Map<String, Object>> roleAssignments,
                                      List<Map<String, Object>> departmentMemberships,
                                      List<Map<String, Object>> responsibilityAssignments,
                                      Map<String, Object> windowsIdentity,
                                      List<Map<String, Object>> externalProfiles, UUID actorUserId) {
        UUID userId = uuid(id, "userId");
        Map<String, String> validatedWindowsIdentity = validateWindowsIdentityChange(userId, windowsIdentity);
        UserView user = updateManagedUser(id, status, roleAssignments, actorUserId);
        if (workforcePolicyService == null) throw new IllegalStateException("Workforce policy service is unavailable");
        workforcePolicyService.replaceUserAssignments(
            userId, departmentMemberships, responsibilityAssignments, actorUserId
        );
        applyWindowsIdentityChange(userId, validatedWindowsIdentity, actorUserId);
        replaceExternalProfiles(userId, externalProfiles, actorUserId);
        return user(userId);
    }

    private void replaceExternalProfiles(UUID userId, List<Map<String, Object>> profiles, UUID actorUserId) {
        for (Map<String, Object> input : profiles) {
            if (text(input, "externalUserId").isBlank()) continue;
            UUID systemId = uuid(required(input, "externalSystemId"), "externalSystemId");
            String externalUserId = required(input, "externalUserId");
            String externalUserCode = text(input, "externalUserCode");
            String displayName = text(input, "externalDisplayName");
            jdbcTemplate.update(
                "INSERT INTO user_external_profiles (user_id, external_system_id, external_user_id, external_user_code, external_display_name, enabled, created_by_user_id, updated_by_user_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, external_system_id) DO UPDATE SET external_user_id = EXCLUDED.external_user_id, external_user_code = EXCLUDED.external_user_code, external_display_name = EXCLUDED.external_display_name, enabled = EXCLUDED.enabled, revision = user_external_profiles.revision + 1, updated_by_user_id = EXCLUDED.updated_by_user_id, updated_at = CURRENT_TIMESTAMP",
                userId, systemId, externalUserId, externalUserCode, displayName,
                !Boolean.FALSE.equals(input.get("enabled")), actorUserId, actorUserId
            );
        }
    }

    public Map<String, Object> testWindowsIdentity(String id, Map<String, Object> windowsIdentity) {
        Map<String, String> validated = validateWindowsIdentityChange(uuid(id, "userId"), windowsIdentity);
        return Map.of(
            "valid", true,
            "subject", validated.getOrDefault("subject", ""),
            "upn", validated.getOrDefault("upn", "")
        );
    }

    private Map<String, String> validateWindowsIdentityChange(UUID userId, Map<String, Object> input) {
        String action = input == null ? "KEEP" : text(input, "action").toUpperCase();
        if (action.isBlank() || "KEEP".equals(action) || "REMOVE".equals(action)) {
            return Map.of("action", action.isBlank() ? "KEEP" : action);
        }
        if (!"UPSERT".equals(action)) throw new IllegalArgumentException("Windows identity action is invalid");
        String subject = text(input, "subject");
        String upn = text(input, "upn").toLowerCase();
        var subjectMatcher = WINDOWS_SUBJECT_PATTERN.matcher(subject);
        var upnMatcher = UPN_PATTERN.matcher(upn);
        if (!subjectMatcher.matches() || !upnMatcher.matches()) {
            throw new IllegalArgumentException("Windows identity input is invalid");
        }
        String windowsDomain = subjectMatcher.group(1).toLowerCase();
        String domainUsername = subjectMatcher.group(2).toLowerCase();
        String upnUsername = upnMatcher.group(1).toLowerCase();
        String upnDomain = upnMatcher.group(2).toLowerCase();
        if (!allowedWindowsDomains.contains(windowsDomain) || !allowedUpnDomains.contains(upnDomain)
            || !upnDomain.equals(windowsUpnSuffixes.get(windowsDomain))
            || !domainUsername.equals(upnUsername) || domainUsername.endsWith("$")) {
            throw new IllegalArgumentException("Windows identity input is invalid");
        }
        Integer conflictCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM auth_identities WHERE provider = 'WINDOWS' AND subject_normalized = ? AND user_id <> ?",
            Integer.class, subject.toLowerCase(), userId
        );
        if (conflictCount != null && conflictCount > 0) {
            throw new IllegalArgumentException("Windows identity is already linked");
        }
        return Map.of(
            "action", "UPSERT", "subject", subject, "subjectNormalized", subject.toLowerCase(),
            "upn", upn, "windowsDomain", windowsDomain, "domainUsername", domainUsername
        );
    }

    private void applyWindowsIdentityChange(UUID userId, Map<String, String> identity, UUID actorUserId) {
        String action = identity.getOrDefault("action", "KEEP");
        if ("KEEP".equals(action)) return;
        if ("REMOVE".equals(action)) {
            jdbcTemplate.update("DELETE FROM auth_identities WHERE user_id = ? AND provider = 'WINDOWS'", userId);
            auditIdentityChange(actorUserId, userId, "WINDOWS_IDENTITY_ADMIN_UNLINKED");
            return;
        }
        jdbcTemplate.update(
            "INSERT INTO auth_identities (user_id, provider, subject, subject_normalized, metadata) VALUES (?, 'WINDOWS', ?, ?, jsonb_build_object('upn', ?, 'windowsDomain', ?, 'domainUsername', ?)) " +
                "ON CONFLICT (user_id) WHERE provider = 'WINDOWS' DO UPDATE SET subject = EXCLUDED.subject, subject_normalized = EXCLUDED.subject_normalized, metadata = EXCLUDED.metadata, updated_at = CURRENT_TIMESTAMP",
            userId, identity.get("subject"), identity.get("subjectNormalized"), identity.get("upn"),
            identity.get("windowsDomain"), identity.get("domainUsername")
        );
        auditIdentityChange(actorUserId, userId, "WINDOWS_IDENTITY_ADMIN_LINKED");
    }

    private void auditIdentityChange(UUID actorUserId, UUID userId, String eventType) {
        jdbcTemplate.update(
            "INSERT INTO auth_audit_events (actor_user_id, event_type, target_type, target_id, request_ip, user_agent, details) VALUES (?, ?, 'USER', ?, '', '', '{}'::jsonb)",
            actorUserId, eventType, userId
        );
    }

    public Map<String, Object> rolesAndPermissions() {
        List<Map<String, Object>> roles = jdbcTemplate.queryForList("SELECT r.id, r.code, r.name, r.description, r.system_role, r.assignable, COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::text[]) AS permission_codes FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id LEFT JOIN permissions p ON p.id = rp.permission_id GROUP BY r.id ORDER BY r.system_role DESC, r.code").stream().map(row -> { Map<String, Object> role = new LinkedHashMap<>(); role.put("id", text(row, "id")); role.put("code", text(row, "code")); role.put("name", text(row, "name")); role.put("description", text(row, "description")); role.put("systemRole", Boolean.TRUE.equals(row.get("system_role"))); role.put("assignable", Boolean.TRUE.equals(row.get("assignable"))); role.put("permissionCodes", stringList(row.get("permission_codes"))); return role; }).toList();
        List<Map<String, Object>> permissions = jdbcTemplate.queryForList("SELECT id, code, resource, action, name, description FROM permissions ORDER BY code").stream().map(row -> { Map<String, Object> permission = new LinkedHashMap<>(); permission.put("id", text(row, "id")); permission.put("code", text(row, "code")); permission.put("resource", text(row, "resource")); permission.put("action", text(row, "action")); permission.put("name", text(row, "name")); permission.put("description", text(row, "description")); return (Map<String, Object>) permission; }).toList();
        return Map.of("roles", roles, "permissions", permissions);
    }

    /** PostgreSQL 配列を JDBC 接続に依存しない JSON 用の文字列リストへ変換します。 */
    static List<String> stringList(Object value) {
        if (value == null) {
            return List.of();
        }
        if (value instanceof java.sql.Array sqlArray) {
            try {
                return stringList(sqlArray.getArray());
            } catch (SQLException exception) {
                throw new IllegalStateException("権限コード配列を読み取れません", exception);
            }
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        if (value instanceof Object[] array) {
            return java.util.Arrays.stream(array).map(String::valueOf).toList();
        }
        return List.of(String.valueOf(value));
    }

    @Transactional
    public Map<String, Object> saveRole(String id, Map<String, Object> input) {
        String code = required(input, "code").toUpperCase();
        String name = required(input, "name");
        String description = text(input, "description");
        List<String> permissionCodes = permissionCodes(input);
        if (!ROLE_CODE_PATTERN.matcher(code).matches()) throw new IllegalArgumentException("Role code is invalid");
        if (name.length() > 120) throw new IllegalArgumentException("Role name is invalid");
        if (description.length() > 1000) throw new IllegalArgumentException("Role description is invalid");
        Map<String, Object> row;
        UUID roleId;
        if (id == null || id.isBlank()) {
            row = jdbcTemplate.queryForMap("INSERT INTO roles (code, name, description) VALUES (?, ?, ?) RETURNING id, code, name, description, system_role, assignable", code, name, description);
            roleId = uuid(row.get("id"), "roleId");
        } else {
            roleId = uuid(id, "roleId");
            List<Map<String, Object>> currentRows = jdbcTemplate.queryForList(
                "SELECT id FROM roles WHERE id = ? FOR UPDATE", roleId
            );
            if (currentRows.isEmpty()) throw new IllegalArgumentException("Role not found");
            try {
                row = jdbcTemplate.queryForMap(
                    "UPDATE roles SET code = ?, name = ?, description = ?, permission_seed_enabled = false, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, code, name, description, system_role, assignable",
                    code, name, description, roleId
                );
            } catch (DuplicateKeyException exception) {
                throw new IllegalArgumentException("Role code already exists", exception);
            }
        }

        Map<String, Object> permissionIds = new LinkedHashMap<>();
        if (!permissionCodes.isEmpty()) {
            String placeholders = String.join(", ", java.util.Collections.nCopies(permissionCodes.size(), "?"));
            for (Map<String, Object> permission : jdbcTemplate.queryForList(
                "SELECT id, code FROM permissions WHERE code IN (" + placeholders + ")",
                permissionCodes.toArray()
            )) {
                permissionIds.put(text(permission, "code"), permission.get("id"));
            }
        }
        if (permissionIds.size() != permissionCodes.size()) {
            throw new IllegalArgumentException("Permission not found");
        }
        jdbcTemplate.update("DELETE FROM role_permissions WHERE role_id = ?", roleId);
        for (String permissionCode : permissionCodes) {
            jdbcTemplate.update(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                roleId, permissionIds.get(permissionCode)
            );
        }
        return Map.of("id", text(row, "id"), "code", text(row, "code"), "name", text(row, "name"), "description", text(row, "description"), "systemRole", Boolean.TRUE.equals(row.get("system_role")), "assignable", Boolean.TRUE.equals(row.get("assignable")), "permissionCodes", permissionCodes);
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

    private static List<String> commaSeparated(String value) {
        return java.util.Arrays.stream((value == null ? "" : value).split(","))
            .map(String::trim).map(String::toLowerCase).filter(item -> !item.isBlank()).toList();
    }

    private static Map<String, String> windowsUpnSuffixes(String value) {
        if (value == null || value.isBlank()) return Map.of("tokyo", "tokyo.scientia.co.jp");
        try {
            Map<?, ?> parsed = new ObjectMapper().readValue(value, Map.class);
            Map<String, String> normalized = new LinkedHashMap<>();
            parsed.forEach((domain, suffix) -> normalized.put(
                String.valueOf(domain).trim().toLowerCase(),
                String.valueOf(suffix).trim().toLowerCase()
            ));
            return Map.copyOf(normalized);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Windows UPN suffix mapping is invalid", exception);
        }
    }

    private static Map<String, Object> managedIdentity(Map<String, Object> row) {
        Map<String, Object> identity = new LinkedHashMap<>();
        identity.put("provider", text(row, "provider"));
        identity.put("subject", text(row, "subject"));
        Map<String, Object> metadata = jsonObject(row.get("metadata"));
        identity.put("windowsDomain", text(metadata, "windowsDomain"));
        identity.put("domainUsername", text(metadata, "domainUsername"));
        identity.put("upn", text(metadata, "upn"));
        return identity;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> jsonObject(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, item) -> result.put(String.valueOf(key), item));
            return result;
        }
        if (value == null || String.valueOf(value).isBlank()) return Map.of();
        try {
            return new ObjectMapper().readValue(String.valueOf(value), Map.class);
        } catch (Exception exception) {
            throw new IllegalStateException("Windows Identity Metadata を読み取れません", exception);
        }
    }

    private static String required(Map<String, Object> input, String key) {
        String value = text(input, key);
        if (value.isBlank()) throw new IllegalArgumentException(key + " is required");
        return value;
    }

    private static List<String> permissionCodes(Map<String, Object> input) {
        Object value = input.get("permissionCodes");
        if (value == null) return List.of();
        if (!(value instanceof List<?> values)) throw new IllegalArgumentException("Permission codes are invalid");
        LinkedHashSet<String> result = new LinkedHashSet<>();
        for (Object item : values) {
            String code = item == null ? "" : String.valueOf(item).trim().toLowerCase();
            if (!code.isBlank()) result.add(code);
        }
        return List.copyOf(result);
    }

    private static UUID uuid(Object value, String field) {
        try {
            return value instanceof UUID uuid ? uuid : UUID.fromString(String.valueOf(value));
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException(field + " is invalid", exception);
        }
    }

    private static long longId(Object value, String field) {
        try {
            return value instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(value));
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException(field + " is invalid", exception);
        }
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
            Boolean.TRUE.equals(row.get("compact_page_headings")),
            date(row.get("created_at")), date(row.get("last_login_at")), identities
        );
    }

    private static OffsetDateTime date(Object value) {
        return value instanceof OffsetDateTime offsetDateTime ? offsetDateTime : null;
    }

}
