package com.example.org.repositories;

import com.example.org.entities.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    Equipment findBySerialNumber(String serialNumber);
}
