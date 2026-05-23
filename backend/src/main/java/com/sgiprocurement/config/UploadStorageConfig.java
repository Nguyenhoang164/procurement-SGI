package com.sgiprocurement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class UploadStorageConfig {

    @Bean
    public Path uploadRootPath(@Value("${app.upload.dir:uploads}") String uploadDir) throws IOException {
        Path path = Paths.get(uploadDir);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.home"), "sgi-procurement", uploadDir);
        }
        path = path.toAbsolutePath().normalize();
        Files.createDirectories(path);
        return path;
    }
}
