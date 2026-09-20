package com.foodtrip.service.s3;

import org.springframework.web.multipart.MultipartFile;

public interface S3Service {
    String uploadFile(MultipartFile file, String folder);
    String generatePresignedUrl(String key);
}
