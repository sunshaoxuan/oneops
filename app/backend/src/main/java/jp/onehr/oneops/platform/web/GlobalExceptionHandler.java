package jp.onehr.oneops.platform.web;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", new ApiError("VALIDATION_FAILED", exception.getMessage(), Map.of())
        ));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurity(SecurityException exception) {
        boolean csrf = exception.getMessage() != null && exception.getMessage().contains("CSRF");
        HttpStatus status = csrf ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
        return ResponseEntity.status(status).body(Map.of(
            "error", new ApiError(csrf ? "CSRF_VALIDATION_FAILED" : "AUTHENTICATION_REQUIRED", exception.getMessage(), Map.of())
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleInternal(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", new ApiError("INTERNAL_ERROR", "The operation could not be completed.", Map.of())
        ));
    }
}
