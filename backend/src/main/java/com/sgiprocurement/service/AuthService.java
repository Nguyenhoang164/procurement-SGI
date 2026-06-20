package com.sgiprocurement.service;

import com.sgiprocurement.dto.LoginRequest;
import com.sgiprocurement.dto.RegisterRequest;
import com.sgiprocurement.dto.AuthResponse;
import com.sgiprocurement.dto.UserResponse;
import com.sgiprocurement.model.User;
import com.sgiprocurement.repository.UserRepository;
import com.sgiprocurement.config.JwtTokenProvider;
import com.sgiprocurement.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AuditLogService auditLogService;

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
            return ip;
        } catch (Exception e) {
            return null;
        }
    }

    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.getActive()) {
            throw new BadCredentialsException("User account is inactive");
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        auditLogService.record(user.getUsername(), user.getRole(), "LOGIN",
                null, null, null, getClientIp());

        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getMarket(),
                user.getDepartment()
        );
    }

    public void createAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin@123"));
            admin.setRole("ADMIN");
            admin.setMarket("All Markets");
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }
    }

    public UserResponse getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getMarket(),
                user.getActive(),
                user.getDepartment(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("PENDING");
        user.setMarket(request.getMarket());
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        auditLogService.record(request.getUsername(), saved.getRole(), "REGISTER",
                null, null, null, getClientIp());

        String token = jwtTokenProvider.generateToken(saved.getId(), saved.getUsername(), saved.getRole());
        return new AuthResponse(
                token, "Bearer", saved.getId(),
                saved.getUsername(), saved.getRole(), saved.getMarket(),
                saved.getDepartment()
        );
    }

}
