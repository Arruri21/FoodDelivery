package com.example.backend.controller;

import com.example.backend.model.DeliveryDriver;
import com.example.backend.model.Order;
import com.example.backend.model.Role;
import com.example.backend.service.DeliveryDriverService;
import com.example.backend.service.OrderService;
import com.example.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    private final UserService userService;
    private final DeliveryDriverService deliveryDriverService;
    private final OrderService orderService;

    private static final Set<String> DRIVER_ALLOWED_STATUSES = Set.of("PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED");
    private static final Set<String> DRIVER_TERMINAL_STATUSES = Set.of("DELIVERED", "CANCELLED");

    public DriverController(UserService userService,
                            DeliveryDriverService deliveryDriverService,
                            OrderService orderService) {
        this.userService = userService;
        this.deliveryDriverService = deliveryDriverService;
        this.orderService = orderService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(@RequestParam Long userId) {
        if (!userService.hasRole(userId, Role.ROLE_DRIVER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "driver privileges required"));
        }
        Optional<DeliveryDriver> driverOpt = deliveryDriverService.findByUserId(userId);
        return driverOpt
                .map(driver -> ResponseEntity.ok(toDriverPayload(driver)))
                .orElseGet(() -> userService.findById(userId)
                        .map(user -> {
                            DeliveryDriver created = deliveryDriverService.upsertForUser(user, user.getPhone());
                            return ResponseEntity.ok(toDriverPayload(created));
                        })
                        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("error", "driver profile not found"))));
    }

    @PatchMapping("/availability")
    public ResponseEntity<?> updateAvailability(@RequestParam Long userId, @RequestBody Map<String, Object> body) {
        if (!userService.hasRole(userId, Role.ROLE_DRIVER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "driver privileges required"));
        }
        Object value = body.get("available");
        if (value == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "available field is required"));
        }
        boolean available = Boolean.parseBoolean(value.toString());
    Optional<DeliveryDriver> updated = deliveryDriverService.updateAvailability(
        userId,
        available,
        userService.findById(userId).orElse(null)
    );
        return updated
                .map(driver -> ResponseEntity.ok(toDriverPayload(driver)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "driver profile not found")));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> assignedOrders(@RequestParam Long userId) {
        if (!userService.hasRole(userId, Role.ROLE_DRIVER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "driver privileges required"));
        }
        DeliveryDriver driver = deliveryDriverService.findByUserId(userId)
                .orElseGet(() -> userService.findById(userId)
                        .map(user -> deliveryDriverService.upsertForUser(user, user.getPhone()))
                        .orElse(null));
        if (driver == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "driver profile not found"));
        }
        List<Map<String, Object>> payload = orderService.findByDriverId(driver.getId()).stream()
                .map(this::toOrderView)
                .collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("driver", toDriverPayload(driver));
        response.put("orders", payload);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@RequestParam Long userId,
                                               @PathVariable Long orderId,
                                               @RequestBody Map<String, Object> body) {
        if (!userService.hasRole(userId, Role.ROLE_DRIVER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "driver privileges required"));
        }
        Object statusValue = body.get("status");
        if (statusValue == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "status field is required"));
        }
        String nextStatus = statusValue.toString().trim().toUpperCase();
        if (!DRIVER_ALLOWED_STATUSES.contains(nextStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "status change not allowed"));
        }

        DeliveryDriver driver = deliveryDriverService.findByUserId(userId)
                .orElseGet(() -> userService.findById(userId)
                        .map(user -> deliveryDriverService.upsertForUser(user, user.getPhone()))
                        .orElse(null));
        if (driver == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "driver profile not found"));
        }

        Optional<Order> orderOpt = orderService.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "order not found"));
        }
        Order order = orderOpt.get();
        if (order.getDriver() == null || !Objects.equals(order.getDriver().getId(), driver.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "order not assigned to this driver"));
        }

        order.setStatus(nextStatus);
        Order savedOrder = orderService.save(order);

        List<Order> driverOrders = orderService.findByDriverId(driver.getId());
        boolean hasActiveAssignments = driverOrders.stream().anyMatch(existing -> !isTerminalStatus(existing.getStatus()));
        driver.setAvailable(!hasActiveAssignments);
        DeliveryDriver savedDriver = deliveryDriverService.save(driver);

        Map<String, Object> response = new HashMap<>();
        response.put("order", toOrderView(savedOrder));
        response.put("driver", toDriverPayload(savedDriver));
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toDriverPayload(DeliveryDriver driver) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", driver.getId());
        map.put("name", driver.getName());
        map.put("contact", driver.getContact());
        map.put("available", driver.getAvailable());
        if (driver.getUser() != null) {
            map.put("user", Map.of(
                    "id", driver.getUser().getId(),
                    "email", driver.getUser().getEmail()
            ));
        }
        return map;
    }

    private Map<String, Object> toOrderView(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("status", order.getStatus());
        map.put("deliveryAddress", order.getDeliveryAddress());
        map.put("totalAmount", order.getTotalAmount());
        map.put("orderDate", order.getOrderDate());
        if (order.getRestaurant() != null) {
            map.put("restaurant", Map.of(
                    "id", order.getRestaurant().getId(),
                    "name", order.getRestaurant().getName(),
                    "contact", order.getRestaurant().getContact()
            ));
        }
        if (order.getUser() != null) {
            map.put("customer", Map.of(
                    "id", order.getUser().getId(),
                    "name", order.getUser().getName(),
                    "phone", order.getUser().getPhone()
            ));
        }
        map.put("items", order.getItems() == null
                ? List.of()
                : order.getItems().stream().map(item -> Map.of(
                "id", item.getId(),
                "quantity", item.getQuantity(),
                "menuItem", item.getMenuItem() != null ? Map.of(
                        "id", item.getMenuItem().getId(),
                        "name", item.getMenuItem().getName(),
                        "price", item.getMenuItem().getPrice()
                ) : null
        )).collect(Collectors.toList()));
        return map;
    }

    private boolean isTerminalStatus(String status) {
        if (status == null) {
            return false;
        }
        return DRIVER_TERMINAL_STATUSES.contains(status.toUpperCase());
    }
}
