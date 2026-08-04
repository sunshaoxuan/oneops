package jp.onehr.oneops.workforce.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.domain.SessionView;
import jp.onehr.oneops.identity.domain.UserView;
import jp.onehr.oneops.platform.web.GlobalExceptionHandler;
import jp.onehr.oneops.workforce.application.WorkforcePolicyService;

class WorkforcePolicyApiTest {

    private IdentityService identityService;
    private WorkforcePolicyService policyService;
    private MockMvc mockMvc;
    private SessionView session;

    @BeforeEach
    void setUp() {
        identityService = mock(IdentityService.class);
        policyService = mock(WorkforcePolicyService.class);
        session = new SessionView(
            UUID.randomUUID().toString(),
            new UserView(UUID.randomUUID().toString(), "admin", "", "管理者", "ACTIVE", "ja-JP", OffsetDateTime.now(), null, List.of()),
            "csrf", List.of(), Map.of(), null
        );
        WorkforcePolicyController controller = new WorkforcePolicyController(identityService, policyService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void 有効テンプレートAPIは問合支援権限で現在利用者を解決する() throws Exception {
        when(identityService.requirePermission(any(), eq("inquiries.use"))).thenReturn(session);
        when(policyService.effectiveTemplate(UUID.fromString(session.user().id())))
            .thenReturn(Map.of("status", "NONE"));

        mockMvc.perform(get("/api/work-center/v1/inquiry-search-policy/effective"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NONE"));

        verify(identityService).requirePermission(any(), eq("inquiries.use"));
    }

    @Test
    void テンプレート更新APIは管理権限とCSRF境界を使用する() throws Exception {
        String templateId = UUID.randomUUID().toString();
        when(identityService.requireMutationPermission(any(), eq("inquiries.templates.write"))).thenReturn(session);
        when(policyService.saveTemplate(eq(templateId), any(), any())).thenReturn(Map.of(
            "id", templateId, "code", "TS2_DEFAULT", "name", "TS2既定"
        ));

        mockMvc.perform(put("/api/work-center/v1/inquiry-search-templates/{id}", templateId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"TS2_DEFAULT\",\"name\":\"TS2既定\",\"revision\":1,\"filters\":{},\"bindings\":[]}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.template.code").value("TS2_DEFAULT"));

        verify(identityService).requireMutationPermission(any(), eq("inquiries.templates.write"));
    }
}
