package com.example.org.controllers;

import com.example.org.entities.Equipment;
import com.example.org.repositories.EquipmentRepository;
import com.example.org.controllers.EquipmentRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    @Autowired
    private EquipmentRepository equipmentRepository;

    // Получение всех записей оборудования
    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment() {
        return ResponseEntity.ok(equipmentRepository.findAll());
    }

    // Добавление нового оборудования (доступно только администраторам)
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

    // Удаление оборудования
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEquipment(@PathVariable Long id) {
        if (!equipmentRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Equipment not found"));
        }
        equipmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Equipment deleted successfully"));
    }
}
