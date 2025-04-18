package com.example.org.controllers;

import com.example.org.entities.Role;
import com.example.org.entities.User;
import com.example.org.entities.Equipment;
import com.example.org.repositories.RoleRepository;
import com.example.org.repositories.UserRepository;
import com.example.org.repositories.EquipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.Set;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashSet;


@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Получить всех пользователей
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    // Получить все роли
    @PostMapping("/users")
    public ResponseEntity<Map<String, String>> addUser(@RequestBody Map<String, String> userRequest) {
        Map<String, String> response = new HashMap<>();

        // Извлечение данных из тела запроса
        String username = userRequest.get("username");
        String password = userRequest.get("password");
        Long roleId = Long.valueOf(userRequest.get("roleId"));

        // Проверка входных данных
        if (username == null || username.isBlank()) {
            response.put("error", "Username is required.");
            return ResponseEntity.badRequest().body(response);
        }

        if (password == null || password.isBlank()) {
            response.put("error", "Password is required.");
            return ResponseEntity.badRequest().body(response);
        }

        if (roleId == null) {
            response.put("error", "Role ID is required.");
            return ResponseEntity.badRequest().body(response);
        }

        // Валидация логина
        String usernameRegex = "^[A-Z][a-zA-Z0-9_]{5,19}$";
        if (!username.matches(usernameRegex)) {
            response.put("error", "Invalid username format.");
            return ResponseEntity.badRequest().body(response);
        }

        // Валидация пароля
        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$";
        if (!password.matches(passwordRegex)) {
            response.put("error", "Invalid password format.");
            return ResponseEntity.badRequest().body(response);
        }

        // Проверка существования пользователя
        if (userRepository.findByUsername(username).isPresent()) {
            response.put("error", "Username already exists.");
            return ResponseEntity.badRequest().body(response);
        }

        // Создание пользователя
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User();
        user.setUsername(username);
        user.setPassword(hashedPassword);
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new RuntimeException("Role not found."));
        user.setRoles(Set.of(role));

        userRepository.save(user);
        response.put("message", "User added successfully.");
        return ResponseEntity.ok(response);
    }



    // Изменить роль пользователя
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Map<String, String>> changeUserRole(@PathVariable Long userId, @RequestBody Map<String, String> roleRequest) {
        System.out.println("Received roleRequest: " + roleRequest);

        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();

        // Проверка на активного пользователя
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getName().equals(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot change role of active user"));
        }

        String newRoleName = roleRequest.get("role");
        System.out.println("New Role Name: " + newRoleName);

        Optional<Role> roleOpt = roleRepository.findByName(newRoleName);

        if (roleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role provided"));
        }

        // Очищаем предыдущие роли и добавляем новую
        user.getRoles().clear();
        user.getRoles().add(roleOpt.get());

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User role successfully updated"));
    }







    // Удалить пользователя
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElseThrow();

        if (id.equals(currentUser.getId())) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "You cannot delete yourself.");
            return ResponseEntity.badRequest().body(response);
        }

        userRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> addEquipment(@RequestBody EquipmentRequest equipmentRequest) {
        if (equipmentRequest.getName() == null || equipmentRequest.getSerialNumber() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name and Serial Number are required."));
        }

        Equipment equipment = new Equipment();
        equipment.setName(equipmentRequest.getName());
        equipment.setSerialNumber(equipmentRequest.getSerialNumber());
        equipment.setStatus("available");
        equipment.setDescription(equipmentRequest.getDescription());

        equipmentRepository.save(equipment);
        return ResponseEntity.ok(Map.of("message", "Equipment added successfully"));
}


}
