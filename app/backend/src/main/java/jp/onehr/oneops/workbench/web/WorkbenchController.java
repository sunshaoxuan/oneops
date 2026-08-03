package jp.onehr.oneops.workbench.web;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jp.onehr.oneops.platform.proxy.LegacyGatewayProxy;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-center/v1")
public class WorkbenchController {

    private final LegacyGatewayProxy legacyGatewayProxy;

    public WorkbenchController(LegacyGatewayProxy legacyGatewayProxy) {
        this.legacyGatewayProxy = legacyGatewayProxy;
    }

    @GetMapping("/dashboard")
    public void dashboard(HttpServletRequest request, HttpServletResponse response)
            throws IOException, InterruptedException {
        legacyGatewayProxy.forward(request, response);
    }

    @GetMapping("/events")
    public void events(HttpServletRequest request, HttpServletResponse response)
            throws IOException, InterruptedException {
        legacyGatewayProxy.forward(request, response);
    }
}
