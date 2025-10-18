package com.example.backend.controller;

import com.example.backend.model.Role;
import com.example.backend.model.User;
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
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (userService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        User u = new User();
        u.setName(body.get("name"));
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(body.get("password")));
        u.setPhone(body.get("phone"));
        u.setAddress(body.get("address"));
        u.setRoles(Set.of(Role.ROLE_USER));
        userService.createUser(u);
        return ResponseEntity.ok(Map.of("message", "user created"));
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
