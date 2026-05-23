package com.sgiprocurement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx"
    );

    private final Path uploadRoot;

    @Autowired
    public FileStorageService(@Qualifier("uploadRootPath") Path uploadRootPath) {
        this.uploadRoot = uploadRootPath;
    }

    public String storePaymentAttachment(Long paymentRequestId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File không hợp lệ");
        }

        String originalName = file.getOriginalFilename();
        String extension = extractExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Định dạng file không được hỗ trợ: " + extension);
        }

        Path targetDir = uploadRoot.resolve("payment-requests").resolve(String.valueOf(paymentRequestId));
        Files.createDirectories(targetDir);

        String storedName = UUID.randomUUID() + "_" + sanitizeFilename(originalName);
        Path targetPath = targetDir.resolve(storedName).normalize();

        if (!targetPath.startsWith(targetDir)) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        return "/files/payment-requests/" + paymentRequestId + "/" + storedName;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "file";
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
