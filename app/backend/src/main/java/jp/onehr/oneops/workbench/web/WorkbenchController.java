package jp.onehr.oneops.workbench.web;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import jp.onehr.oneops.identity.application.IdentityService;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/work-center/v1")
public class WorkbenchController {

    private final JdbcTemplate jdbcTemplate;
    private final IdentityService identityService;

    public WorkbenchController(JdbcTemplate jdbcTemplate, IdentityService identityService) {
        this.jdbcTemplate = jdbcTemplate;
        this.identityService = identityService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(HttpServletRequest request) {
        identityService.requirePermission(request, "dashboard.read");
        return snapshot();
    }

    @GetMapping("/events")
    public SseEmitter events(HttpServletRequest request) {
        identityService.requirePermission(request, "dashboard.read");
        SseEmitter emitter = new SseEmitter(0L);
        try {
            emitter.send(SseEmitter.event().name("snapshot").data(snapshot()));
            emitter.complete();
        } catch (Exception exception) {
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    private Map<String, Object> snapshot() {
        List<Map<String, Object>> organizations = jdbcTemplate.queryForList("SELECT id, code, name, short_name, maintenance_status, remarks FROM organizations ORDER BY name, code").stream().map(row -> { Map<String, Object> item = new LinkedHashMap<>(); item.put("id", text(row, "id")); item.put("classificationId", ""); item.put("classificationCode", ""); item.put("classificationName", ""); item.put("code", text(row, "code")); item.put("name", text(row, "name")); item.put("shortName", text(row, "short_name")); item.put("maintenanceStatus", text(row, "maintenance_status")); item.put("remarks", text(row, "remarks")); return item; }).toList();
        Map<String, Object> upstream = new LinkedHashMap<>(); upstream.put("online", true); upstream.put("latencyMs", null); upstream.put("message", "Spring Boot backend connected");
        Map<String, Object> summary = new LinkedHashMap<>(); summary.put("total", 0); summary.put("running", 0); summary.put("failed", 0); summary.put("completed", 0); summary.put("organizations", organizations.size());
        Map<String, Object> resources = new LinkedHashMap<>(); resources.put("cpuCount", Runtime.getRuntime().availableProcessors()); resources.put("memoryAvailableBytes", Runtime.getRuntime().freeMemory()); resources.put("diskFreeBytes", null);
        Map<String, Object> result = new LinkedHashMap<>(); result.put("generatedAt", Instant.now().toString()); result.put("correlationId", UUID.randomUUID().toString()); result.put("upstream", upstream); result.put("summary", summary); result.put("resources", resources); result.put("tasks", List.of()); result.put("organizations", organizations); return result;
    }

    private static String text(Map<String, Object> row, String key) { Object value = row.get(key); return value == null ? "" : String.valueOf(value).trim(); }
}
