package com.homecare.common.exception;

import org.springframework.http.HttpStatus;

public class ConflictBusinessException extends BusinessRuleException {

    public ConflictBusinessException(String code, String message) {
        super(code, message, HttpStatus.CONFLICT);
    }

    public ConflictBusinessException(String code, String message, Throwable cause) {
        super(code, message, HttpStatus.CONFLICT, cause);
    }
}
