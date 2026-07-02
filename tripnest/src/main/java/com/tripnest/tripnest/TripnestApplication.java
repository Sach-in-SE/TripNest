package com.tripnest.tripnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.tripnest")
@EnableJpaRepositories(basePackages = "com.tripnest.repository")
@EntityScan(basePackages = "com.tripnest.entity")
public class TripnestApplication {

	public static void main(String[] args) {
		SpringApplication.run(TripnestApplication.class, args);
	}

}