package com.example.backend.service;

import com.example.backend.model.Order;
import com.example.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order save(Order order) { return orderRepository.save(order); }
    public List<Order> findByUserId(Long userId) { return orderRepository.findByUserId(userId); }
    public Optional<Order> findById(Long id) { return orderRepository.findById(id); }
}
