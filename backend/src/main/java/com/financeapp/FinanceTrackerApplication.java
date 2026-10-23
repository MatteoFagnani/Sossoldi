package com.financeapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class FinanceTrackerApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(FinanceTrackerApplication.class, args);
	}

	private static void loadDotEnv() {
		File[] possibleFiles = new File[] {
				new File(".env"),
				new File("../.env")
		};
		for (File envFile : possibleFiles) {
			if (envFile.exists() && envFile.isFile()) {
				try {
					List<String> lines = Files.readAllLines(envFile.toPath());
					for (String line : lines) {
						line = line.trim();
						if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
							int idx = line.indexOf('=');
							String key = line.substring(0, idx).trim();
							String value = line.substring(idx + 1).trim();
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
				} catch (Exception ignored) {
				}
				break;
			}
		}
	}

}
