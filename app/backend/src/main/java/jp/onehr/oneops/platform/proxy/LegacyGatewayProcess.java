package jp.onehr.oneops.platform.proxy;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import jakarta.annotation.PreDestroy;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class LegacyGatewayProcess {

    private static final Logger logger = LoggerFactory.getLogger(LegacyGatewayProcess.class);

    private final LegacyGatewayProperties properties;
    private final HttpClient client;
    private final ObjectMapper objectMapper;
    private volatile Process process;
    private volatile boolean ready;

    public LegacyGatewayProcess(LegacyGatewayProperties properties) {
        this.properties = properties;
        this.client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMillis()))
            .build();
        this.objectMapper = JsonMapper.builder().build();
    }

    @EventListener(ApplicationReadyEvent.class)
    public synchronized void start() {
        logger.info("Legacy gateway bridge enabled={}, internalPort={}, nodeScript={}",
            properties.isEnabled(), properties.getInternalPort(), properties.getNodeScript());
        if (!properties.isEnabled() || process != null) {
            return;
        }
        ready = false;
        Path node = Path.of(properties.getNodeExecutable());
        Path script = Path.of(properties.getNodeScript());
        Path envFile = Path.of(properties.getEnvFile());
        if (!Files.isRegularFile(node) || !Files.isRegularFile(script) || !Files.isRegularFile(envFile)) {
            throw new IllegalStateException("Legacy gateway bridge files are missing");
        }
        try {
            ProcessBuilder builder = new ProcessBuilder(List.of(
                node.toString(),
                "--env-file=" + envFile,
                script.toString()
            ));
            builder.directory(script.getParent().getParent().toFile());
            builder.environment().put("OPS_GATEWAY_HOST", "127.0.0.1");
            builder.environment().put("OPS_GATEWAY_PORT", String.valueOf(properties.getInternalPort()));
            builder.redirectError(ProcessBuilder.Redirect.INHERIT);
            builder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            Process startedProcess = builder.start();
            process = startedProcess;
            startedProcess.onExit().thenRun(() -> {
                if (process == startedProcess) {
                    ready = false;
                }
            });
            waitUntilReady();
            ready = true;
        } catch (IOException exception) {
            throw new IllegalStateException("Legacy gateway bridge could not start", exception);
        }
    }

    public boolean isReady() {
        if (!properties.isEnabled()) {
            return true;
        }
        Process currentProcess = process;
        return ready
            && currentProcess != null
            && currentProcess.isAlive()
            && probeReadiness();
    }

    private void waitUntilReady() {
        long deadline = System.nanoTime()
            + Duration.ofSeconds(properties.getReadinessTimeoutSeconds()).toNanos();
        while (System.nanoTime() < deadline) {
            if (process != null && !process.isAlive()) {
                throw new IllegalStateException("Legacy gateway bridge exited before readiness");
            }
            if (probeReadiness()) {
                return;
            }
            if (Thread.currentThread().isInterrupted()) {
                break;
            }
            try {
                Thread.sleep(250);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        stop();
        throw new IllegalStateException("Legacy gateway bridge did not become ready");
    }

    boolean probeReadiness() {
        URI readiness = URI.create(
            "http://127.0.0.1:" + properties.getInternalPort()
                + "/api/work-center/v1/readiness"
        );
        try {
            HttpResponse<String> response = client.send(
                HttpRequest.newBuilder(readiness).timeout(Duration.ofSeconds(2)).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            if (response.statusCode() != 200) {
                return false;
            }
            JsonNode body = objectMapper.readTree(response.body());
            return "UP".equals(body.path("status").asText())
                && body.path("upstream").path("online").asBoolean(false);
        } catch (IOException | RuntimeException exception) {
            return false;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    @PreDestroy
    public synchronized void stop() {
        ready = false;
        if (process == null) {
            return;
        }
        process.destroy();
        try {
            if (!process.waitFor(10, java.util.concurrent.TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
        } finally {
            process = null;
        }
    }
}
