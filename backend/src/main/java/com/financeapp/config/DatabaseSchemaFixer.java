package com.financeapp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            List<Map<String, Object>> checks = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME, CHECK_CLAUSE FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS"
            );
            for (Map<String, Object> check : checks) {
                String name = String.valueOf(check.get("CONSTRAINT_NAME"));
                String clause = String.valueOf(check.get("CHECK_CLAUSE"));
                if (clause != null && clause.contains("ETF") && !clause.contains("ROBO_ADVISOR")) {
                    log.info("Removing legacy investment type check constraint: {} with clause {}", name, clause);
                    try {
                        jdbcTemplate.execute("ALTER TABLE investment DROP CONSTRAINT IF EXISTS \"" + name + "\"");
                    } catch (Exception e) {
                        try {
                            jdbcTemplate.execute("ALTER TABLE investment DROP CONSTRAINT IF EXISTS " + name);
                        } catch (Exception ex) {
                            log.warn("Could not drop constraint {}: {}", name, ex.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Schema check constraint verification note: {}", e.getMessage());
        }
    }
}

