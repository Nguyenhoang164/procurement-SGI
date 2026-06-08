package com.sgiprocurement.config;

import com.sgiprocurement.model.User;
import com.sgiprocurement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin",        "admin@123", "ADMIN",             "All Markets");
        seedUser("ceo",          "ceo@123",   "CEO",               "All Markets");
        seedUser("thukho",       "kho@123",   "WAREHOUSE",         "Vietnam");
        seedUser("ketoan",       "kt@123",    "ACCOUNTANT",        "Vietnam");
        seedUser("ketoantruong", "ktt@123",   "CHIEF_ACCOUNTANT",  "All Markets");
        seedUser("nvkinhdoanh",  "nvkd@123",  "SALES",             "Vietnam");
        seedUser("truongphongkd","tpkd@123",  "SALES_MANAGER",     "Vietnam");
        seedUser("nvmuahang",    "mh@123",    "PURCHASING",        "Vietnam");
        seedUser("userpending",  "pending@123","PENDING",           "Vietnam");
    }

    private void seedUser(String username, String rawPassword, String role, String market) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setMarket(market);
            user.setActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            System.out.println("Seeded user: " + username + " / role=" + role);
        }
    }
}
