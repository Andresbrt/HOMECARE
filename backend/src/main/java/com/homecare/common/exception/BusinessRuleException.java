package com.homecare.common.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public BusinessRuleException(String code, String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public BusinessRuleException(String code, String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
