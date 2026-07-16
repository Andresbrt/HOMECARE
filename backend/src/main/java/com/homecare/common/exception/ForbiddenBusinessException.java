package com.homecare.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenBusinessException extends BusinessRuleException {

    public ForbiddenBusinessException(String code, String message) {
        super(code, message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenBusinessException(String code, String message, Throwable cause) {
        super(code, message, HttpStatus.FORBIDDEN, cause);
    }
}
