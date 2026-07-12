package com.novigo.common.api;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Enveloppe de pagination standard renvoyée par toutes les listes de l'API.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last) {

    public static <T> PageResponse<T> of(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages(), p.isLast());
    }

    /** Enveloppe une page d'entités dont le contenu a déjà été mappé vers des DTO. */
    public static <E, T> PageResponse<T> of(Page<E> p, List<T> mappedContent) {
        return new PageResponse<>(mappedContent, p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages(), p.isLast());
    }
}
