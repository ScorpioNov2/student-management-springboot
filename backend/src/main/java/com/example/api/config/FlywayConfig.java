package com.example.api.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class FlywayConfig {
	@Bean(initMethod = "migrate")
	Flyway flyway(DataSource dataSource, Environment environment) {
		String locations = environment.getProperty("spring.flyway.locations", "classpath:db/migration");
		return Flyway.configure()
				.dataSource(dataSource)
				.locations(locations.split(","))
				.load();
	}
}
