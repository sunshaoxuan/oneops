package jp.onehr.oneops.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final JdbcTemplate jdbcTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public SessionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SessionToken issue(UUID userId, UUID impersonatorUserId, HttpServletRequest request,
                              HttpServletResponse response, long ttlSeconds) {
        String token = randomToken();
        String csrf = randomToken();
        UUID sessionId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO auth_sessions (id, user_id, token_hash, csrf_hash, expires_at, client_ip, user_agent, impersonator_user_id) " +
                "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP + (? * INTERVAL '1 second'), ?, ?, ?)",
            sessionId, userId, sha256(token), sha256(csrf), ttlSeconds,
            request.getRemoteAddr() == null ? "" : request.getRemoteAddr(),
            request.getHeader("User-Agent") == null ? "" : request.getHeader("User-Agent"),
            impersonatorUserId
        );
        response.addHeader("Set-Cookie", cookie("oneops_session", token, true, ttlSeconds));
        response.addHeader("Set-Cookie", cookie("oneops_csrf", csrf, false, ttlSeconds));
        return new SessionToken(token, csrf);
    }

    public void revoke(HttpServletRequest request) {
        String token = cookieValue(request, "oneops_session");
        if (!token.isBlank()) {
            jdbcTemplate.update("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?", sha256(token));
        }
    }

    public String sessionToken(HttpServletRequest request) {
        return cookieValue(request, "oneops_session");
    }

    public String csrfToken(HttpServletRequest request) {
        return cookieValue(request, "oneops_csrf");
    }

    public boolean csrfValid(HttpServletRequest request, String csrfHash) {
        String header = request.getHeader("X-OneOps-CSRF");
        String cookie = csrfToken(request);
        return header != null && !header.isBlank() && header.equals(cookie) && sha256(header).equals(csrfHash);
    }

    public static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(64);
            for (byte item : digest) {
                result.append(String.format("%02x", item));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String randomToken() {
        byte[] value = new byte[32];
        secureRandom.nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static String cookie(String name, String value, boolean httpOnly, long maxAge) {
        return name + "=" + value + "; Path=/; Max-Age=" + Math.max(0, maxAge)
            + (httpOnly ? "; HttpOnly" : "") + "; Secure; SameSite=Lax";
    }

    private static String cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return "";
        }
        for (var cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue() == null ? "" : cookie.getValue();
            }
        }
        return "";
    }

    public record SessionToken(String token, String csrf) {
    }
}
