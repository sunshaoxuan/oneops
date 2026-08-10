package jp.onehr.oneops.platform.proxy;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.lang.reflect.Field;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class LegacyGatewayProcessTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void disabledBridgeIsReadyWithoutChildProcess() {
        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        properties.setEnabled(false);

        LegacyGatewayProcess process = new LegacyGatewayProcess(properties);

        assertTrue(process.isReady());
    }

    @Test
    void enabledBridgeStartsAsNotReady() {
        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        properties.setEnabled(true);

        LegacyGatewayProcess process = new LegacyGatewayProcess(properties);

        assertFalse(process.isReady());
    }

    @Test
    void readinessRequiresExactUpPayload() throws Exception {
        LegacyGatewayProcess process = processWithReadiness(
            200,
            "{\"status\":\"UP\",\"upstream\":{\"online\":true}}"
        );

        assertTrue(process.probeReadiness());
    }

    @Test
    void readinessRejectsErrorAndMalformedPayloads() throws Exception {
        assertFalse(processWithReadiness(503, "{}").probeReadiness());
        assertFalse(processWithReadiness(404, "{}").probeReadiness());
        assertFalse(processWithReadiness(200, "not-json").probeReadiness());
        assertFalse(processWithReadiness(
            200,
            "{\"status\":\"DEGRADED\",\"upstream\":{\"online\":true}}"
        ).probeReadiness());
        assertFalse(processWithReadiness(
            200,
            "{\"status\":\"UP\",\"upstream\":{\"online\":false}}"
        ).probeReadiness());
    }

    @Test
    void readinessTurnsOffWhenChildProcessExits() throws Exception {
        LegacyGatewayProcess process = processWithReadiness(
            200,
            "{\"status\":\"UP\",\"upstream\":{\"online\":true}}"
        );
        Process child = mock(Process.class);
        when(child.isAlive()).thenReturn(true, false);
        setField(process, "process", child);
        setField(process, "ready", true);

        assertTrue(process.isReady());
        assertFalse(process.isReady());
    }

    private LegacyGatewayProcess processWithReadiness(int status, String body) throws IOException {
        if (server != null) {
            server.stop(0);
        }
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/work-center/v1/readiness", exchange -> {
            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        server.start();

        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        properties.setEnabled(true);
        properties.setInternalPort(server.getAddress().getPort());
        return new LegacyGatewayProcess(properties);
    }

    private void setField(LegacyGatewayProcess process, String name, Object value)
            throws ReflectiveOperationException {
        Field field = LegacyGatewayProcess.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(process, value);
    }
}
