package com.novigo.storage;

/**
 * SPI d'un fournisseur de stockage de médias (Local, Cloudinary, S3, MinIO).
 * En démo/dev, seul LOCAL écrit réellement les octets ; les autres renvoient une URL simulée.
 */
public interface StorageProvider {

    String code();

    String label();

    StoredFile store(String filename, String contentType, byte[] content);

    default void delete(String url) {
        // no-op par défaut
    }

    record StoredFile(String url, String provider, String contentType, long size) {}
}
