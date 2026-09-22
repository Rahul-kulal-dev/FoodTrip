package com.foodtrip.controller.s3;

import com.foodtrip.service.s3.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.foodtrip.dto.common.UploadResponse;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final S3Service s3Service;

    public FileUploadController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT')")
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "uploads") String folder) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }

        try {
            String key = s3Service.uploadFile(file, folder);
            String url = s3Service.generatePresignedUrl(key);
            return ResponseEntity.ok(new UploadResponse(url));
        } catch (Exception e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }
}
