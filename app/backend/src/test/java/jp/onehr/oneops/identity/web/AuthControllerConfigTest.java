package jp.onehr.oneops.identity.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.util.Map;

import org.junit.jupiter.api.Test;

import jp.onehr.oneops.identity.application.IdentityService;
import jp.onehr.oneops.identity.application.SessionService;

class AuthControllerConfigTest {

    private static final String SSO_URL = "http://OHR0067:8998/oneops_sso.jsp";
    private static final String PROFILE_URL = "http://192.168.20.38:8999/auth_windows.jsp";

    @Test
    void EnvPortal設定が完全な場合だけ自動SSOを有効化する() {
        Map<String, Object> config = controller(SSO_URL, PROFILE_URL, "", "", true).config();

        assertThat(config)
            .containsEntry("windowsSsoEnabled", true)
            .containsEntry("windowsSsoAutoLogin", true)
            .containsEntry("windowsSsoUrl", SSO_URL);
    }

    @Test
    void EnvPortalプロファイル検証URLがない場合はSSO入口を公開しない() {
        Map<String, Object> config = controller(SSO_URL, "", "", "", true).config();

        assertThat(config)
            .containsEntry("windowsSsoEnabled", false)
            .containsEntry("windowsSsoAutoLogin", false)
            .containsEntry("windowsSsoUrl", "");
    }

    @Test
    void 自動ログイン停止中も手動SSO入口は維持する() {
        Map<String, Object> config = controller(SSO_URL, PROFILE_URL, "", "", false).config();

        assertThat(config)
            .containsEntry("windowsSsoEnabled", true)
            .containsEntry("windowsSsoAutoLogin", false)
            .containsEntry("windowsSsoUrl", SSO_URL);
    }

    @Test
    void 署名代理設定が完全な場合は既存の開始APIを公開する() {
        Map<String, Object> config = controller(
            "", "", "http://domain-proxy:8998/", "shared-secret", true
        ).config();

        assertThat(config)
            .containsEntry("windowsSsoEnabled", true)
            .containsEntry("windowsSsoAutoLogin", true)
            .containsEntry(
                "windowsSsoUrl",
                "http://domain-proxy:8998/api/work-center/v1/auth/sso/windows/begin"
            );
    }

    private AuthController controller(
        String envPortalSsoUrl,
        String envPortalProfileUrl,
        String windowsSsoProxyUrl,
        String ssoSharedSecret,
        boolean autoWindowsSso
    ) {
        return new AuthController(
            mock(IdentityService.class),
            mock(SessionService.class),
            envPortalSsoUrl,
            envPortalProfileUrl,
            windowsSsoProxyUrl,
            ssoSharedSecret,
            autoWindowsSso
        );
    }
}
