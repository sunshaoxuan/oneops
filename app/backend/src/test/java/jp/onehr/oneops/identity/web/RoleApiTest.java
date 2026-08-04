package jp.onehr.oneops.identity.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.application.SessionService;
import jp.onehr.oneops.platform.web.GlobalExceptionHandler;

class RoleApiTest {

    private IdentityService identityService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        identityService = mock(IdentityService.class);
        AuthController controller = new AuthController(
            identityService, mock(SessionService.class), "", "", "", "", false
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    void ロール一覧APIはロールと権限を返す() throws Exception {
        when(identityService.rolesAndPermissions()).thenReturn(Map.of(
            "roles", List.of(Map.of("id", "role-id", "code", "VIEWER", "permissionCodes", List.of("dashboard.read"))),
            "permissions", List.of(Map.of("id", "permission-id", "code", "dashboard.read"))
        ));

        mockMvc.perform(get("/api/work-center/v1/auth/roles"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles[0].code").value("VIEWER"))
            .andExpect(jsonPath("$.roles[0].permissionCodes[0]").value("dashboard.read"));
        verify(identityService).requirePermission(any(), eq("identity.roles.read"));
    }

    @Test
    void ロール作成APIは権限関連を含む作成結果を返す() throws Exception {
        when(identityService.saveRole(eq(null), any())).thenReturn(Map.of(
            "id", "new-role-id", "code", "SUPPORT", "name", "支援担当", "description", "",
            "systemRole", false, "assignable", true, "permissionCodes", List.of("inquiries.use")
        ));

        mockMvc.perform(post("/api/work-center/v1/auth/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"SUPPORT\",\"name\":\"支援担当\",\"description\":\"\",\"permissionCodes\":[\"inquiries.use\"]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role.code").value("SUPPORT"))
            .andExpect(jsonPath("$.role.permissionCodes[0]").value("inquiries.use"));
        verify(identityService).requireMutationPermission(any(), eq("identity.roles.write"));
    }

    @Test
    void ロール更新APIは物理IDと権限関連をサービスへ渡す() throws Exception {
        String roleId = "69537368-0b08-4d33-b085-59d8083cbb69";
        when(identityService.saveRole(eq(roleId), any())).thenReturn(Map.of(
            "id", roleId, "code", "VIEWER", "name", "閲覧者", "description", "",
            "systemRole", true, "assignable", true, "permissionCodes", List.of("dashboard.read")
        ));

        mockMvc.perform(put("/api/work-center/v1/auth/roles/{id}", roleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"VIEWER\",\"name\":\"閲覧者\",\"description\":\"\",\"permissionCodes\":[\"dashboard.read\"]}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role.id").value(roleId))
            .andExpect(jsonPath("$.role.permissionCodes.length()").value(1));
        verify(identityService).requireMutationPermission(any(), eq("identity.roles.write"));
        verify(identityService).saveRole(eq(roleId), any());
    }

    @Test
    void CSRF検証失敗は403と識別可能なコードを返す() throws Exception {
        when(identityService.requireMutationPermission(any(), eq("identity.roles.write")))
            .thenThrow(new SecurityException("CSRF validation failed"));

        mockMvc.perform(put("/api/work-center/v1/auth/roles/{id}", "69537368-0b08-4d33-b085-59d8083cbb69")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"VIEWER\",\"name\":\"閲覧者\",\"description\":\"\",\"permissionCodes\":[]}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("CSRF_VALIDATION_FAILED"));
    }
}
