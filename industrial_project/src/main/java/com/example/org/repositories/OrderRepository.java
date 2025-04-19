package com.example.org.repositories;

import com.example.org.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE o.user.username = :username")
    List<Order> findByUsername(@Param("username") String username);

    @Query("SELECT o FROM Order o WHERE o.status = :status")
    List<Order> findByStatus(@Param("status") String status);

    @Query("SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.equipment")
    List<Order> findAllWithDetails();


}
