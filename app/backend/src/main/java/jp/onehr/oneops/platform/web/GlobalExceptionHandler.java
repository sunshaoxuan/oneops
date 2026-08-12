package jp.onehr.oneops.platform.web;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", new ApiError("VALIDATION_FAILED", exception.getMessage(), Map.of())
        ));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurity(SecurityException exception) {
        boolean csrf = exception.getMessage() != null && exception.getMessage().contains("CSRF");
        boolean disabled = exception.getMessage() != null && exception.getMessage().contains("Self-registration is temporarily disabled");
        boolean denied = exception.getMessage() != null && exception.getMessage().contains("Permission denied");
        HttpStatus status = csrf || denied || disabled ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
        return ResponseEntity.status(status).body(Map.of(
            "error", new ApiError(csrf ? "CSRF_VALIDATION_FAILED" : denied ? "PERMISSION_DENIED" : disabled ? "REGISTRATION_DISABLED" : "AUTHENTICATION_REQUIRED", exception.getMessage(), Map.of())
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleInternal(Exception exception) {
        LOGGER.error("API 処理で予期しないエラーが発生しました", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", new ApiError("INTERNAL_ERROR", "The operation could not be completed.", Map.of())
        ));
    }
}
