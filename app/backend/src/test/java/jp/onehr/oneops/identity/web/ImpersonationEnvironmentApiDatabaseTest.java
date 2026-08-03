package jp.onehr.oneops.identity.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import jp.onehr.oneops.environment.application.EnvironmentService;
import jp.onehr.oneops.environment.web.EnvironmentController;
import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.application.SessionService;
import jp.onehr.oneops.masterdata.application.MasterDataService;
import jp.onehr.oneops.platform.web.GlobalExceptionHandler;

@SpringBootTest(properties = "oneops.legacy-gateway.enabled=false")
@Transactional
@EnabledIfEnvironmentVariable(named = "ONEOPS_DATABASE_INTEGRATION_TEST", matches = "true")
class ImpersonationEnvironmentApiDatabaseTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MasterDataService masterDataService;

    @Autowired
    private EnvironmentService environmentService;

    @Autowired
    private IdentityService identityService;

    private MockMvc mockMvc;

    @Autowired
    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                new AuthController(identityService, sessionService, "", false),
                new EnvironmentController(environmentService, identityService)
            )
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void 閲覧者への代理ログイン後も環境参照APIを利用でき更新APIは拒否される() throws Exception {
        UUID administratorId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        UUID viewerRoleId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO users (id, username, email, display_name, status) VALUES (?, ?, ?, ?, 'ACTIVE')",
            administratorId, "impersonation.admin", "impersonation.admin@example.test", "代理管理者"
        );
        jdbcTemplate.update(
            "INSERT INTO users (id, username, email, display_name, status) VALUES (?, ?, ?, ?, 'ACTIVE')",
            viewerId, "impersonation.viewer", "impersonation.viewer@example.test", "代理閲覧者"
        );
        jdbcTemplate.update(
            "INSERT INTO roles (id, code, name, description, system_role, assignable) VALUES (?, 'ENV_API_VIEWER_TEST', '環境 API 閲覧検証', '', false, true)",
            viewerRoleId
        );
        jdbcTemplate.update(
            "INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions WHERE code IN ('dashboard.read', 'environments.read')",
            viewerRoleId
        );
        jdbcTemplate.update(
            "INSERT INTO user_role_assignments (user_id, role_id) SELECT ?, id FROM roles WHERE code = 'SYSTEM_ADMIN'",
            administratorId
        );
        jdbcTemplate.update(
            "INSERT INTO user_role_assignments (user_id, role_id) VALUES (?, ?)",
            viewerId, viewerRoleId
        );

        String classificationId = String.valueOf(masterDataService.createClassification(Map.of(
            "code", "IMPERSONATION_ENV_API", "name", "代理環境 API 検証区分"
        )).get("id"));
        String organizationId = String.valueOf(masterDataService.createOrganization(Map.of(
            "classificationId", classificationId,
            "code", "IMPERSONATION_ENV_ORG",
            "name", "代理環境 API 検証組織",
            "shortName", "代理環境",
            "maintenanceStatus", "〇",
            "remarks", "自動ロールバック検証"
        )).get("id"));

        MockHttpServletRequest issueRequest = new MockHttpServletRequest();
        issueRequest.setRemoteAddr("127.0.0.1");
        issueRequest.addHeader("User-Agent", "OneOps integration test");
        MockHttpServletResponse issueResponse = new MockHttpServletResponse();
        SessionService.SessionToken administratorSession = sessionService.issue(
            administratorId, null, issueRequest, issueResponse, 600
        );

        MvcResult impersonation = mockMvc.perform(post(
                "/api/work-center/v1/auth/impersonation/{id}", viewerId
            )
                .cookie(
                    new Cookie("oneops_session", administratorSession.token()),
                    new Cookie("oneops_csrf", administratorSession.csrf())
                )
                .header("X-OneOps-CSRF", administratorSession.csrf()))
            .andExpect(status().isOk())
            .andReturn();

        List<String> setCookies = impersonation.getResponse().getHeaders("Set-Cookie");
        String viewerSession = cookieValue(setCookies, "oneops_session");
        String viewerCsrf = cookieValue(setCookies, "oneops_csrf");

        mockMvc.perform(get("/api/work-center/v1/auth/session")
                .cookie(new Cookie("oneops_session", viewerSession)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.id").value(viewerId.toString()))
            .andExpect(jsonPath("$.permissions[?(@ == 'environments.read')]").exists())
            .andExpect(jsonPath("$.permissions[?(@ == 'environments.write')]").doesNotExist())
            .andExpect(jsonPath("$.impersonation.actor.id").value(administratorId.toString()));

        mockMvc.perform(get(
                "/api/work-center/v1/organizations/{organizationId}/environment-inventory",
                organizationId
            )
                .cookie(new Cookie("oneops_session", viewerSession)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.organizationId").value(organizationId))
            .andExpect(jsonPath("$.groups").isArray())
            .andExpect(jsonPath("$.environments").isArray())
            .andExpect(jsonPath("$.summary.total").value(0));

        mockMvc.perform(post("/api/work-center/v1/environment-groups")
                .cookie(
                    new Cookie("oneops_session", viewerSession),
                    new Cookie("oneops_csrf", viewerCsrf)
                )
                .header("X-OneOps-CSRF", viewerCsrf)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"organizationId\":\"" + organizationId + "\",\"name\":\"拒否検証\",\"sortOrder\":1}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("PERMISSION_DENIED"));
    }

    private static String cookieValue(List<String> headers, String name) {
        String prefix = name + "=";
        return headers.stream()
            .filter(header -> header.startsWith(prefix))
            .map(header -> header.substring(prefix.length(), header.indexOf(';')))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException(name + " cookie was not issued"));
    }
}
