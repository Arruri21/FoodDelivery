package com.example.backend.repository;

import com.example.backend.model.DeliveryDriver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryDriverRepository extends JpaRepository<DeliveryDriver, Long> {
    Optional<DeliveryDriver> findByUserId(Long userId);
    List<DeliveryDriver> findAllByOrderByNameAsc();
}
