package com.example.org.controllers;

import com.example.org.entities.Role;
import com.example.org.entities.User;
import com.example.org.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;


import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();

        // Валидация логина
        String usernameRegex = "^[A-Z][a-zA-Z0-9_]{5,19}$";
        Pattern usernamePattern = Pattern.compile(usernameRegex);
        Matcher usernameMatcher = usernamePattern.matcher(user.getUsername());

        if (!usernameMatcher.matches()) {
            response.put("message", "Invalid username. Must start with a capital letter, contain only letters, numbers, and underscores, and be 6-20 characters long.");
            return ResponseEntity.badRequest().body(response);
        }

        // Валидация пароля
        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$";
        Pattern passwordPattern = Pattern.compile(passwordRegex);
        Matcher passwordMatcher = passwordPattern.matcher(user.getPassword());

        if (!passwordMatcher.matches()) {
            response.put("message", "Invalid password. Must be 8-30 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
            return ResponseEntity.badRequest().body(response);
        }

        // Проверка на существование пользователя
        Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            response.put("message", "Username already exists");
            return ResponseEntity.badRequest().body(response);
        }

        // Хешируем пароль
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Устанавливаем роль ROLE_USER по умолчанию
        Role userRole = new Role();
        userRole.setId(2L); // ID роли ROLE_USER
        user.setRoles(Set.of(userRole));

        // Сохраняем пользователя
        userRepository.save(user);

        response.put("message", "Registration successful");
        return ResponseEntity.ok(response);
    }

@GetMapping("/me")
public ResponseEntity<Map<String, Object>> getCurrentUser() {
    Map<String, Object> response = new HashMap<>();
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    // Проверяем, что пользователь аутентифицирован
    if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
        response.put("error", "User is not authenticated");
        return ResponseEntity.status(401).body(response);
    }

    // Добавляем имя пользователя
    String username = authentication.getName();
    response.put("username", username);

    // Извлекаем роли
    Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
    List<String> roles = authorities.stream()
            .map(GrantedAuthority::getAuthority) // Получаем название роли, например, ROLE_ADMIN
            .collect(Collectors.toList());
    response.put("roles", roles);

    // Получение ID пользователя из базы данных
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    response.put("id", user.getId()); // Добавляем идентификатор пользователя

    return ResponseEntity.ok(response);
}

}
