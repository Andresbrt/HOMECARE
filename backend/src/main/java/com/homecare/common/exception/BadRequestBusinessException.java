package com.homecare.common.exception;

import org.springframework.http.HttpStatus;

public class BadRequestBusinessException extends BusinessRuleException {

    public BadRequestBusinessException(String code, String message) {
        super(code, message, HttpStatus.BAD_REQUEST);
    }

    public BadRequestBusinessException(String code, String message, Throwable cause) {
        super(code, message, HttpStatus.BAD_REQUEST, cause);
    }
}
