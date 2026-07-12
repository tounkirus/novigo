package com.novigo.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception métier portant un statut HTTP.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
