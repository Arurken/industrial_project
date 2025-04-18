package com.example.org.services;

import com.example.org.entities.Order;
import com.example.org.repositories.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.util.Optional;
import java.util.List;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Cacheable("orders")
    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable); // Используем метод Spring Data JPA для пагинации
    }

    public Optional<Order> getOrderById(Long id) {
        logger.info("Fetching order with ID: {}", id);
        return orderRepository.findById(id);
    }

    @Cacheable(value = "ordersByStatus", key = "#status")
    public List<Order> getOrdersByStatus(String status) {
        logger.info("Fetching orders with status: {} from database...", status);
        return orderRepository.findByStatus(status);

    }

    public Order createOrder(Order order) {
        logger.info("Creating new order with status: {}", order.getStatus());
        return orderRepository.save(order);
    }

    public Order updateOrder(Long id, Order updatedOrder) {
        logger.info("Updating order with ID: {}", id);
        return orderRepository.findById(id).map(order -> {
            order.setStatus(updatedOrder.getStatus());
            logger.info("Order with ID: {} updated successfully", id);
            return orderRepository.save(order);
        }).orElseThrow(() -> {
            logger.warn("Order with ID: {} not found", id);
            return new RuntimeException("Order not found with id " + id);
        });
    }

    public Order updateOrderStatus(Long orderId, String status) {
    Order order = orderRepository.findById(orderId)
                  .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    order.setStatus(status);
    return orderRepository.save(order);
    }


    public void deleteOrder(Long id) {
        logger.info("Deleting order with ID: {}", id);
        orderRepository.deleteById(id);
        logger.info("Order with ID: {} deleted successfully", id);
    }
}
