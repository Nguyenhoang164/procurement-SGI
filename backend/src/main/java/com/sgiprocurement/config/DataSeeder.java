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
        seedUser("leadkinhdoanh","lvkd@123",  "SALES",             "Vietnam",           "Kinh doanh");
        seedUser("truongphongkd","tpkd@123",  "SALES_MANAGER",     "Vietnam",           "Kinh doanh");
        seedUser("nvmuahang",    "mh@123",    "PURCHASING",        "Vietnam");
        seedUser("userpending",  "pending@123","PENDING",           "Vietnam");
    }

    private void seedUser(String username, String rawPassword, String role, String market) {
        seedUser(username, rawPassword, role, market, null);
    }

    private void seedUser(String username, String rawPassword, String role, String market, String department) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setMarket(market);
            user.setDepartment(department);
            user.setActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            System.out.println("Seeded user: " + username + " / role=" + role + (department != null ? " / dept=" + department : ""));
        } else if (department != null) {
            userRepository.findByUsername(username).ifPresent(user -> {
                if (user.getDepartment() == null) {
                    user.setDepartment(department);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    System.out.println("Updated department for: " + username + " -> " + department);
                }
            });
        }
    }
}
