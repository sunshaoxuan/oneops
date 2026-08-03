package jp.onehr.oneops;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import jp.onehr.oneops.platform.web.HealthController;

@WebMvcTest(controllers = HealthController.class)
class OneOpsApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthUsesSpringBackend() throws Exception {
        mockMvc.perform(get("/api/work-center/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.upstream.online").value(true));
    }
}
