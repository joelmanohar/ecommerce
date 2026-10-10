package com.klu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.klu.dto.*;
import com.klu.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final UserService userService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(userService.signup(request));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(
            @RequestBody SigninRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        AuthResponse response = userService.signin(request);
        if (response == null)
            return ResponseEntity.status(401).body("Invalid email or password");

        // 1. Create a new HTTP session and store the user info
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("userId", response.getUserId());
        session.setAttribute("name", response.getName());
        session.setAttribute("email", response.getEmail());
        session.setAttribute("role", response.getRole().name());

        // 2. Set the Spring Security context for the current session
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        response.getEmail(),
                        null,
                        Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + response.getRole().name())
                        )
                );
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // 3. Persist security context in HTTP session and response
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * Check if the user has an active session.
     * Returns the user info if the session is valid, or 401 if not.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        AuthResponse response = new AuthResponse();
        response.setUserId((Long) session.getAttribute("userId"));
        response.setName((String) session.getAttribute("name"));
        response.setEmail((String) session.getAttribute("email"));
        response.setRole(com.klu.model.Role.valueOf((String) session.getAttribute("role")));
        response.setMessage("Session active");

        return ResponseEntity.ok(response);
    }

    /**
     * Invalidate the user's session (logout).
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logged out successfully");
    }
}
