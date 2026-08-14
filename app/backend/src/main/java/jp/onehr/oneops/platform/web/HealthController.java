package jp.onehr.oneops.platform.web;

import java.time.Instant;
import java.util.Map;

import jp.onehr.oneops.platform.proxy.LegacyGatewayProcess;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final String version;
    private final LegacyGatewayProcess legacyGatewayProcess;

    public HealthController(@Value("${oneops.version:0.18.23}") String version,
                            LegacyGatewayProcess legacyGatewayProcess) {
        this.version = version;
        this.legacyGatewayProcess = legacyGatewayProcess;
    }

    @GetMapping(value = "/api/work-center/v1/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> health() {
        boolean ready = legacyGatewayProcess.isReady();
        Map<String, Object> body = Map.of(
            "status", ready ? "UP" : "STARTING",
            "generatedAt", Instant.now().toString(),
            "upstream", Map.of(
                "online", ready,
                "service", "oneops-spring-backend",
                "version", version,
                "legacyGatewayReady", ready
            )
        );
        return ResponseEntity
            .status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
            .body(body);
    }
}
