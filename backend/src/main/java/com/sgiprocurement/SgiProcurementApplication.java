package com.sgiprocurement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import com.sgiprocurement.service.AuthService;

@SpringBootApplication
public class SgiProcurementApplication {

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(SgiProcurementApplication.class, args);
        
        // Initialize admin user on startup
        AuthService authService = context.getBean(AuthService.class);
        authService.createAdminUser();
    }

}
