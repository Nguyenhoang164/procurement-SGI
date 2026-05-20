package com.sgiprocurement.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest httpServletRequest,
                         HttpServletResponse httpServletResponse,
                         AuthenticationException ex) throws IOException, ServletException {

        httpServletResponse.setContentType("application/json;charset=UTF-8");
        httpServletResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        final ErrorDetails errorDetails = new ErrorDetails(
                java.time.LocalDateTime.now(),
                "Unauthorized",
                httpServletRequest.getRequestURI(),
                "UNAUTHORIZED"
        );

        httpServletResponse.getWriter().write(new ObjectMapper().writeValueAsString(errorDetails));
    }

}
