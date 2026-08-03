package jp.onehr.oneops.platform.proxy;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class LegacyGatewayProxyTest {

    private HttpServer server;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void forwardsMethodPathQueryHeadersAndBody() throws Exception {
        AtomicReference<String> request = new AtomicReference<>();
        server.createContext("/api/work-center/v1/compat", exchange -> {
            request.set(exchange.getRequestMethod() + " " + exchange.getRequestURI() + " "
                + exchange.getRequestHeaders().getFirst("X-Request-ID") + " "
                + new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.getResponseHeaders().add("X-Bridge-Test", "ok");
            byte[] response = "{\"accepted\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(202, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        server.start();

        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        LegacyGatewayProxy proxy = new LegacyGatewayProxy(properties);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setMethod("POST");
        servletRequest.setRequestURI("/api/work-center/v1/compat");
        servletRequest.setQueryString("page=2");
        servletRequest.addHeader("X-Request-ID", "request-1");
        servletRequest.setContent("payload".getBytes(StandardCharsets.UTF_8));
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        proxy.forward(servletRequest, servletResponse);

        assertThat(servletResponse.getStatus()).isEqualTo(202);
        assertThat(servletResponse.getHeader("X-Bridge-Test")).isEqualTo("ok");
        assertThat(servletResponse.getContentAsString()).isEqualTo("{\"accepted\":true}");
        assertThat(request.get()).isEqualTo("POST /api/work-center/v1/compat?page=2 request-1 payload");
    }

    @Test
    void rejectsForwardingWhenBridgeIsDisabled() throws Exception {
        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        LegacyGatewayProxy proxy = new LegacyGatewayProxy(properties);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setMethod("GET");
        servletRequest.setRequestURI("/api/work-center/v1/compat");
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        proxy.forward(servletRequest, servletResponse);

        assertThat(servletResponse.getStatus()).isEqualTo(501);
    }

    @Test
    void preservesRecentBuildTasksInTheDashboardResponse() throws Exception {
        String dashboard = """
            {"summary":{"total":2,"running":0,"failed":0,"completed":2},"tasks":[
              {"id":"20260731115428","status":"success","organization":"OneHR株式会社"},
              {"id":"20260721124905","status":"success","organization":"共通"}
            ]}
            """;
        server.createContext("/api/work-center/v1/dashboard", exchange -> {
            byte[] response = dashboard.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        server.start();

        LegacyGatewayProperties properties = new LegacyGatewayProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        LegacyGatewayProxy proxy = new LegacyGatewayProxy(properties);
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setMethod("GET");
        servletRequest.setRequestURI("/api/work-center/v1/dashboard");
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        proxy.forward(servletRequest, servletResponse);

        assertThat(servletResponse.getStatus()).isEqualTo(200);
        assertThat(servletResponse.getContentAsString()).contains("\"total\":2");
        assertThat(servletResponse.getContentAsString()).contains("20260731115428");
        assertThat(servletResponse.getContentAsString()).contains("20260721124905");
    }
}
