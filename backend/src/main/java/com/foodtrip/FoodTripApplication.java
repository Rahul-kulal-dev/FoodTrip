package com.foodtrip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class FoodTripApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(FoodTripApplication.class, args);
    }

    private static void loadDotEnv() {
        File[] candidates = new File[] {
                new File(".env"),
                new File("../.env"),
                new File("backend/.env")
        };

        for (File candidate : candidates) {
            if (candidate.exists() && candidate.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(candidate, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getenv(key) == null && System.getProperty(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
