package com.novigo.storage.provider;

import com.novigo.storage.StorageProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fournisseurs cloud simulés (Cloudinary, S3, MinIO) : renvoient une URL déterministe
 * sans upload réel. À remplacer par les SDK correspondants en production.
 */
public final class CloudStorageProviders {

    private CloudStorageProviders() {}

    private static String key(String filename) {
        String safe = (filename == null ? "fichier" : filename).replaceAll("[^a-zA-Z0-9._-]", "_");
        return UUID.randomUUID().toString().substring(0, 8) + "_" + safe;
    }

    @Component
    public static class CloudinaryStorageProvider implements StorageProvider {
        @Override public String code() { return "CLOUDINARY"; }
        @Override public String label() { return "Cloudinary"; }
        @Override public StoredFile store(String filename, String contentType, byte[] content) {
            String url = "https://res.cloudinary.com/novigo/image/upload/" + key(filename);
            return new StoredFile(url, code(), contentType, content == null ? 0 : content.length);
        }
    }

    @Component
    public static class S3StorageProvider implements StorageProvider {
        @Override public String code() { return "S3"; }
        @Override public String label() { return "Amazon S3"; }
        @Override public StoredFile store(String filename, String contentType, byte[] content) {
            String url = "https://novigo.s3.amazonaws.com/" + key(filename);
            return new StoredFile(url, code(), contentType, content == null ? 0 : content.length);
        }
    }

    @Component
    public static class MinioStorageProvider implements StorageProvider {
        @Override public String code() { return "MINIO"; }
        @Override public String label() { return "MinIO"; }
        @Override public StoredFile store(String filename, String contentType, byte[] content) {
            String url = "http://localhost:9002/novigo/" + key(filename);
            return new StoredFile(url, code(), contentType, content == null ? 0 : content.length);
        }
    }
}
