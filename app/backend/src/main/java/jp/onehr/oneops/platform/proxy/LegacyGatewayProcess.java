package jp.onehr.oneops.platform.proxy;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

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
    private Process process;

    public LegacyGatewayProcess(LegacyGatewayProperties properties) {
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public synchronized void start() {
        logger.info("Legacy gateway bridge enabled={}, internalPort={}, nodeScript={}",
            properties.isEnabled(), properties.getInternalPort(), properties.getNodeScript());
        if (!properties.isEnabled() || process != null) {
            return;
        }
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
            process = builder.start();
            waitUntilReady();
        } catch (IOException exception) {
            throw new IllegalStateException("Legacy gateway bridge could not start", exception);
        }
    }

    private void waitUntilReady() {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        URI health = URI.create("http://127.0.0.1:" + properties.getInternalPort() + "/api/work-center/v1/health");
        long deadline = System.nanoTime() + Duration.ofSeconds(20).toNanos();
        while (System.nanoTime() < deadline) {
            if (process != null && !process.isAlive()) {
                throw new IllegalStateException("Legacy gateway bridge exited before readiness");
            }
            try {
                HttpResponse<Void> response = client.send(
                    HttpRequest.newBuilder(health).timeout(Duration.ofSeconds(2)).GET().build(),
                    HttpResponse.BodyHandlers.discarding()
                );
                if (response.statusCode() < 500) {
                    return;
                }
            } catch (IOException | InterruptedException exception) {
                if (exception instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                    break;
                }
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

    @PreDestroy
    public synchronized void stop() {
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
