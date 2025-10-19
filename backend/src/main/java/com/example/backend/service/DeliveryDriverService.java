package com.example.backend.service;

import com.example.backend.model.DeliveryDriver;
import com.example.backend.model.User;
import com.example.backend.repository.DeliveryDriverRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DeliveryDriverService {

    private final DeliveryDriverRepository deliveryDriverRepository;

    public DeliveryDriverService(DeliveryDriverRepository deliveryDriverRepository) {
        this.deliveryDriverRepository = deliveryDriverRepository;
    }

    public Optional<DeliveryDriver> findByUserId(Long userId) {
        return deliveryDriverRepository.findByUserId(userId);
    }

    public Optional<DeliveryDriver> findById(Long id) {
        return deliveryDriverRepository.findById(id);
    }

    public List<DeliveryDriver> findAll() {
        return deliveryDriverRepository.findAllByOrderByNameAsc();
    }

    public DeliveryDriver save(DeliveryDriver deliveryDriver) {
        return deliveryDriverRepository.save(deliveryDriver);
    }

    @Transactional
    public DeliveryDriver upsertForUser(User user, String contact) {
        return deliveryDriverRepository.findByUserId(user.getId())
                .map(existing -> updateExisting(existing, user, contact))
                .orElseGet(() -> createNew(user, contact));
    }

    @Transactional
    public Optional<DeliveryDriver> updateAvailability(Long userId, boolean available, User fallbackUser) {
        Optional<DeliveryDriver> existing = deliveryDriverRepository.findByUserId(userId);
        DeliveryDriver driver = existing.orElseGet(() -> {
            if (fallbackUser == null) {
                return null;
            }
            return createNew(fallbackUser, fallbackUser.getPhone());
        });
        if (driver == null) {
            return Optional.empty();
        }
        driver.setAvailable(available);
        return Optional.of(deliveryDriverRepository.save(driver));
    }

    private DeliveryDriver updateExisting(DeliveryDriver driver, User user, String contact) {
        driver.setUser(user);
        if (driver.getName() == null || driver.getName().isBlank()) {
            driver.setName(user.getName());
        }
        driver.setContact(contact != null ? contact : driver.getContact());
        if (driver.getAvailable() == null) {
            driver.setAvailable(Boolean.TRUE);
        }
        return deliveryDriverRepository.save(driver);
    }

    private DeliveryDriver createNew(User user, String contact) {
        DeliveryDriver driver = new DeliveryDriver();
        driver.setUser(user);
        driver.setName(user.getName());
        driver.setContact(contact != null ? contact : user.getPhone());
        driver.setAvailable(Boolean.TRUE);
        return deliveryDriverRepository.save(driver);
    }
}
