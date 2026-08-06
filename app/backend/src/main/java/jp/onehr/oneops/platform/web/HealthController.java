package jp.onehr.oneops.platform.web;

import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final String version;

    public HealthController(@Value("${oneops.version:0.10.1}") String version) {
        this.version = version;
    }

    @GetMapping(value = "/api/work-center/v1/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "generatedAt", Instant.now().toString(),
            "upstream", Map.of("online", true, "service", "oneops-spring-backend", "version", version)
        );
    }
}
