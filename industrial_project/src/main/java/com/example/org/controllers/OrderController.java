package com.example.org.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.example.org.services.OrderService;
import com.example.org.entities.Order;
import com.example.org.entities.User;
import com.example.org.entities.Equipment;
import com.example.org.repositories.OrderRepository;
import com.example.org.repositories.UserRepository;
import com.example.org.repositories.EquipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    // Создание заказа
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        logger.info("Received payload: {}", payload);

        String username = request.getUserPrincipal().getName();
        logger.info("User: {}", username);

        Long equipmentId = ((Number) payload.get("equipmentId")).longValue();
        logger.info("Equipment ID: {}", equipmentId);

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        Order order = new Order();
        order.setUser(userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found")));
        order.setEquipment(equipment);
        order.setStatus("Создан");
        logger.info("Saving order: {}", order);

        return ResponseEntity.ok(orderRepository.save(order));
    }




    // Получение всех заказов
    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderRepository.findAllWithDetails();
        return ResponseEntity.ok(orders);
    }


    // Обновление статуса заказа (по Map)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    // Обновление статуса заказа (по String)
    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody String status) {
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(order);
    }
    @GetMapping("/user")
    public ResponseEntity<List<Order>> getOrdersByUser(HttpServletRequest request) {
        String username = request.getUserPrincipal().getName();
        List<Order> orders = orderRepository.findByUsername(username);
        return ResponseEntity.ok(orders);
    }


}
