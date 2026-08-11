package jp.onehr.oneops;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import jp.onehr.oneops.platform.proxy.LegacyGatewayProcess;
import jp.onehr.oneops.platform.web.HealthController;

class OneOpsApplicationTests {

    private MockMvc mockMvc;
    private LegacyGatewayProcess legacyGatewayProcess;

    @BeforeEach
    void setUp() {
        legacyGatewayProcess = mock(LegacyGatewayProcess.class);
        mockMvc = MockMvcBuilders
            .standaloneSetup(new HealthController("0.18.10", legacyGatewayProcess))
            .build();
    }

    @Test
    void healthIsUpAfterLegacyGatewayReadiness() throws Exception {
        when(legacyGatewayProcess.isReady()).thenReturn(true);

        mockMvc.perform(get("/api/work-center/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.upstream.online").value(true))
            .andExpect(jsonPath("$.upstream.legacyGatewayReady").value(true));
    }

    @Test
    void healthRejectsTrafficUntilLegacyGatewayReadiness() throws Exception {
        when(legacyGatewayProcess.isReady()).thenReturn(false);

        mockMvc.perform(get("/api/work-center/v1/health"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.status").value("STARTING"))
            .andExpect(jsonPath("$.upstream.online").value(false))
            .andExpect(jsonPath("$.upstream.legacyGatewayReady").value(false));
    }
}
