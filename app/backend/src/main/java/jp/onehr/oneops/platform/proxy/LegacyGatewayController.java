package jp.onehr.oneops.platform.proxy;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LegacyGatewayController {

    private final LegacyGatewayProxy proxy;

    public LegacyGatewayController(LegacyGatewayProxy proxy) {
        this.proxy = proxy;
    }

    @RequestMapping({
        "/api/work-center/v1/**",
        "/api/work-center/v1"
    })
    public void forward(HttpServletRequest request, HttpServletResponse response) throws IOException, InterruptedException {
        if (request.getRequestURI().equals("/api/work-center/v1/health")) {
            return;
        }
        proxy.forward(request, response);
    }
}
