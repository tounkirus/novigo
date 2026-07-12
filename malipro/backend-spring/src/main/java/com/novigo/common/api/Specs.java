package com.novigo.common.api;

import jakarta.persistence.criteria.Path;
import org.springframework.data.jpa.domain.Specification;

/** Fabriques de {@link Specification} réutilisables pour la recherche et le filtrage. */
public final class Specs {

    private Specs() {}

    /** Égalité stricte sur un attribut (ignore le filtre si la valeur est nulle). */
    public static <T> Specification<T> eq(String attribute, Object value) {
        if (value == null) return null;
        return (root, query, cb) -> cb.equal(root.get(attribute), value);
    }

    /** Égalité insensible à la casse sur un attribut texte. */
    public static <T> Specification<T> eqIgnoreCase(String attribute, String value) {
        if (value == null || value.isBlank()) return null;
        return (root, query, cb) -> cb.equal(cb.lower(root.get(attribute)), value.toLowerCase());
    }

    /** LIKE insensible à la casse (contient). */
    public static <T> Specification<T> like(String attribute, String value) {
        if (value == null || value.isBlank()) return null;
        String pattern = "%" + value.toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get(attribute)), pattern);
    }

    /** Recherche multi-champs (OR de LIKE) sur plusieurs attributs texte. */
    @SafeVarargs
    public static <T> Specification<T> search(String value, String... attributes) {
        if (value == null || value.isBlank() || attributes.length == 0) return null;
        String pattern = "%" + value.toLowerCase() + "%";
        return (root, query, cb) -> {
            var predicates = new jakarta.persistence.criteria.Predicate[attributes.length];
            for (int i = 0; i < attributes.length; i++) {
                predicates[i] = cb.like(cb.lower(root.<String>get(attributes[i])), pattern);
            }
            return cb.or(predicates);
        };
    }

    /** Égalité sur un attribut d'une relation (ex: "store", "id"). */
    public static <T> Specification<T> joinEq(String relation, String attribute, Object value) {
        if (value == null) return null;
        return (root, query, cb) -> {
            Path<?> path = root.get(relation).get(attribute);
            return cb.equal(path, value);
        };
    }

    /** Combine des specs en ignorant les nulles (AND). */
    @SafeVarargs
    public static <T> Specification<T> all(Specification<T>... specs) {
        Specification<T> result = null;
        for (Specification<T> s : specs) {
            if (s != null) result = (result == null) ? s : result.and(s);
        }
        return result;
    }
}
