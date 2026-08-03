package jp.onehr.oneops.platform.proxy;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;

@Component
public class LegacyGatewayProxy {

    private final HttpClient client;
    private final LegacyGatewayProperties properties;

    public LegacyGatewayProxy(LegacyGatewayProperties properties) {
        this.properties = properties;
        this.client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMillis()))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    }

    public void forward(HttpServletRequest request, HttpServletResponse response) throws IOException, InterruptedException {
        if (!properties.isEnabled()) {
            response.sendError(HttpServletResponse.SC_NOT_IMPLEMENTED, "The Spring endpoint has not been migrated yet.");
            return;
        }
        URI target = URI.create(properties.getBaseUrl().replaceAll("/$", "")
            + request.getRequestURI()
            + (request.getQueryString() == null ? "" : "?" + request.getQueryString()));
        byte[] body = request.getInputStream().readAllBytes();
        HttpRequest.Builder builder = HttpRequest.newBuilder(target)
            .timeout(Duration.ofSeconds(properties.getRequestTimeoutSeconds()))
            .method(request.getMethod(), body.length == 0
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(body));
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            if (name.equalsIgnoreCase("host") || name.equalsIgnoreCase("content-length") || name.equalsIgnoreCase("connection")) {
                continue;
            }
            Enumeration<String> values = request.getHeaders(name);
            while (values.hasMoreElements()) {
                builder.header(name, values.nextElement());
            }
        }
        HttpResponse<InputStream> upstream = client.send(builder.build(), HttpResponse.BodyHandlers.ofInputStream());
        response.setStatus(upstream.statusCode());
        upstream.headers().map().forEach((name, values) -> {
            if (!name.equalsIgnoreCase("transfer-encoding") && !name.equalsIgnoreCase("connection")) {
                values.forEach(value -> response.addHeader(name, value));
            }
        });
        try (InputStream input = upstream.body()) {
            input.transferTo(response.getOutputStream());
        }
    }
}
