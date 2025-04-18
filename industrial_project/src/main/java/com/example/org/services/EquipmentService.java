package com.example.org.services;

import com.example.org.entities.Equipment;
import com.example.org.repositories.EquipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.Optional;

@Service
public class EquipmentService {

    private static final Logger logger = LoggerFactory.getLogger(EquipmentService.class);

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Cacheable("equipment")
    public Page<Equipment> getAllEquipment(Pageable pageable) {
        logger.info("Fetching all equipment from database...");
        return equipmentRepository.findAll(pageable);
    }

    public Optional<Equipment> getEquipmentById(Long id) {
        logger.info("Fetching equipment with ID: {}", id);
        return equipmentRepository.findById(id);
    }

    @Cacheable(value = "equipment", key = "#serialNumber")
    public Equipment getEquipmentBySerialNumber(String serialNumber) {
        logger.info("Fetching equipment with serial number: {} from database...", serialNumber);
        return equipmentRepository.findBySerialNumber(serialNumber);
    }

    public Equipment createEquipment(Equipment equipment) {
        logger.info("Creating new equipment: {}", equipment.getName());
        return equipmentRepository.save(equipment);
    }

    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {
        logger.info("Updating equipment with ID: {}", id);
        return equipmentRepository.findById(id).map(equipment -> {
            equipment.setName(updatedEquipment.getName());
            equipment.setSerialNumber(updatedEquipment.getSerialNumber());
            equipment.setStatus(updatedEquipment.getStatus());
            equipment.setDescription(updatedEquipment.getDescription());
            logger.info("Equipment with ID: {} updated successfully", id);
            return equipmentRepository.save(equipment);
        }).orElseThrow(() -> {
            logger.warn("Equipment with ID: {} not found", id);
            return new RuntimeException("Equipment not found with id " + id);
        });
    }

    public void deleteEquipment(Long id) {
        logger.info("Deleting equipment with ID: {}", id);
        equipmentRepository.deleteById(id);
        logger.info("Equipment with ID: {} deleted successfully", id);
    }
}
