package com.futaneagro.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private Environment environment;

    @Autowired(required = false)
    private DataSource dataSource;

    @Value("${server.port:8080}")
    private int serverPort;

    @GetMapping("/api/env")
    public ResponseEntity<Map<String, String>> getEnvInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("profile", Arrays.toString(environment.getActiveProfiles()));
        info.put("port", String.valueOf(serverPort));
        try {
            if (dataSource != null) {
                try (Connection conn = dataSource.getConnection()) {
                    info.put("db", conn.getCatalog());
                }
            } else {
                info.put("db", "unknown");
            }
        } catch (Exception e) {
            info.put("db", "error: " + e.getMessage());
        }
        return ResponseEntity.ok(info);
    }
}
