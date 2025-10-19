package com.example.backend.controller;

import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.service.DeliveryDriverService;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final DeliveryDriverService deliveryDriverService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


    public AuthController(UserService userService, DeliveryDriverService deliveryDriverService) {
        this.userService = userService;
        this.deliveryDriverService = deliveryDriverService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (userService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
    String requestedRole = body.getOrDefault("role", "CUSTOMER");
    Role role = "AGENT".equalsIgnoreCase(requestedRole) || "DRIVER".equalsIgnoreCase(requestedRole)
        ? Role.ROLE_DRIVER
        : Role.ROLE_USER;

    User u = new User();
    u.setName(body.get("name"));
    u.setEmail(email);
    u.setPassword(body.get("password"));
    u.setPhone(body.get("phone"));
    u.setAddress(body.get("address"));
    u.setRoles(Set.of(role));
    User saved = userService.createUser(u);

    if (role == Role.ROLE_DRIVER) {
        deliveryDriverService.upsertForUser(saved, saved.getPhone());
    }

    return ResponseEntity.ok(Map.of(
        "message", "user created",
        "roles", saved.getRoles()
    ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
    var userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
        var user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
        // Simplified: don't return a JWT in this demo. Return user id and roles instead.
        return ResponseEntity.ok(Map.of("userId", user.getId(), "roles", user.getRoles()));
    }
}
