package com.example.backend.controller;

import com.example.backend.model.DeliveryDriver;
import com.example.backend.model.MenuItem;
import com.example.backend.model.Order;
import com.example.backend.model.OrderItem;
import com.example.backend.model.Restaurant;
import com.example.backend.service.DeliveryDriverService;
import com.example.backend.service.MenuItemService;
import com.example.backend.service.OrderService;
import com.example.backend.service.RestaurantService;
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
@RequestMapping("/api/admin")
public class AdminController {

    private static final Set<String> ADMIN_ALLOWED_STATUSES = Set.of("PENDING", "CONFIRMED");

    private final UserService userService;
    private final OrderService orderService;
    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;
    private final DeliveryDriverService deliveryDriverService;

    public AdminController(UserService userService,
                           OrderService orderService,
                           RestaurantService restaurantService,
                           MenuItemService menuItemService,
                           DeliveryDriverService deliveryDriverService) {
        this.userService = userService;
        this.orderService = orderService;
        this.restaurantService = restaurantService;
        this.menuItemService = menuItemService;
        this.deliveryDriverService = deliveryDriverService;
    }

    @GetMapping("/orders")
    public ResponseEntity<?> listOrders(@RequestParam Long userId) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        List<Map<String, Object>> payload = orderService.findAll()
                .stream()
                .map(this::toOrderView)
                .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/drivers")
    public ResponseEntity<?> listDrivers(@RequestParam Long userId) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        List<Order> allOrders = orderService.findAll();
    Map<Long, List<Order>> ordersByDriver = allOrders.stream()
        .filter(order -> order.getDriver() != null)
        .collect(Collectors.groupingBy(order -> order.getDriver().getId()));
        List<Map<String, Object>> payload = deliveryDriverService.findAll().stream()
                .map(driver -> {
                    Map<String, Object> driverView = toDriverView(driver);
            List<Order> driverOrders = ordersByDriver.getOrDefault(driver.getId(), List.of());
            driverView.put("assignedOrderCount", driverOrders.size());
            long activeOrders = driverOrders.stream().filter(this::isOrderActive).count();
            driverView.put("activeOrderCount", activeOrders);
                    return driverView;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @PatchMapping("/orders/{orderId}")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId,
                                               @RequestParam Long userId,
                                               @RequestBody Map<String, Object> body) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Optional<Order> orderOpt = orderService.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "order not found"));
        }
        Order order = orderOpt.get();
    DeliveryDriver previousDriver = order.getDriver();
    DeliveryDriver nextDriver = null;

        if (body.containsKey("driverId")) {
            Object driverValue = body.get("driverId");
            if (driverValue != null && !driverValue.toString().isBlank()) {
                try {
                    Long driverId = Long.valueOf(driverValue.toString());
                    Optional<DeliveryDriver> driverOpt = deliveryDriverService.findById(driverId);
                    if (driverOpt.isEmpty()) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "driver not found"));
                    }
                    nextDriver = driverOpt.get();
                } catch (NumberFormatException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "invalid driverId"));
                }
            }

            if (previousDriver != null && (nextDriver == null || !Objects.equals(previousDriver.getId(), nextDriver.getId()))) {
                previousDriver.setAvailable(Boolean.TRUE);
                deliveryDriverService.save(previousDriver);
            }

            if (nextDriver != null && (previousDriver == null || !Objects.equals(previousDriver.getId(), nextDriver.getId()))) {
                nextDriver.setAvailable(Boolean.FALSE);
                deliveryDriverService.save(nextDriver);
            }

            order.setDriver(nextDriver);
        }

        if (body.containsKey("status")) {
            Object statusValue = body.get("status");
            if (statusValue != null) {
                String nextStatus = statusValue.toString().trim().toUpperCase();
                if (!ADMIN_ALLOWED_STATUSES.contains(nextStatus)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "status change not allowed"));
                }
                order.setStatus(nextStatus);
            }
        }

        if (order.getDriver() != null && isTerminalStatus(order.getStatus())) {
            DeliveryDriver assignedDriver = order.getDriver();
            if (!Boolean.TRUE.equals(assignedDriver.getAvailable())) {
                assignedDriver.setAvailable(Boolean.TRUE);
                deliveryDriverService.save(assignedDriver);
            }
        }

        orderService.save(order);
        return ResponseEntity.ok(toOrderView(order));
    }

    @GetMapping("/restaurants")
    public ResponseEntity<?> listRestaurants(@RequestParam Long userId) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        List<Map<String, Object>> payload = restaurantService.findAll().stream()
                .map(restaurant -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("restaurant", restaurant);
                    entry.put("menuItems", menuItemService.findByRestaurantId(restaurant.getId()));
                    return entry;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/restaurants")
    public ResponseEntity<?> createRestaurant(@RequestParam Long userId, @RequestBody Restaurant payload) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Restaurant saved = restaurantService.save(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/restaurants/{restaurantId}")
    public ResponseEntity<?> updateRestaurant(@PathVariable Long restaurantId,
                                              @RequestParam Long userId,
                                              @RequestBody Restaurant payload) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Optional<Restaurant> restaurantOpt = restaurantService.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "restaurant not found"));
        }
        Restaurant restaurant = restaurantOpt.get();
        restaurant.setName(payload.getName());
        restaurant.setCuisine(payload.getCuisine());
        restaurant.setAddress(payload.getAddress());
        restaurant.setContact(payload.getContact());
        restaurant.setRating(payload.getRating());
        Restaurant saved = restaurantService.save(restaurant);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/restaurants/{restaurantId}")
    public ResponseEntity<?> deleteRestaurant(@PathVariable Long restaurantId, @RequestParam Long userId) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        if (restaurantService.findById(restaurantId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "restaurant not found"));
        }
        restaurantService.delete(restaurantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restaurants/{restaurantId}/menu")
    public ResponseEntity<?> createMenuItem(@PathVariable Long restaurantId,
                                            @RequestParam Long userId,
                                            @RequestBody MenuItem payload) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Optional<Restaurant> restaurantOpt = restaurantService.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "restaurant not found"));
        }
        payload.setId(null);
        payload.setRestaurant(restaurantOpt.get());
        MenuItem saved = menuItemService.save(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/menu/{menuItemId}")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long menuItemId,
                                            @RequestParam Long userId,
                                            @RequestBody MenuItem payload) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Optional<MenuItem> menuItemOpt = menuItemService.findById(menuItemId);
        if (menuItemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "menu item not found"));
        }
        MenuItem menuItem = menuItemOpt.get();
        menuItem.setName(payload.getName());
        menuItem.setDescription(payload.getDescription());
        menuItem.setPrice(payload.getPrice());
        menuItem.setImage(payload.getImage());
        MenuItem saved = menuItemService.save(menuItem);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/menu/{menuItemId}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long menuItemId, @RequestParam Long userId) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        if (menuItemService.findById(menuItemId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "menu item not found"));
        }
        menuItemService.delete(menuItemId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/orders/{orderId}/payment")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long orderId,
                                                 @RequestParam Long userId,
                                                 @RequestBody Map<String, String> body) {
        if (!userService.isAdmin(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "admin privileges required"));
        }
        Optional<Order> orderOpt = orderService.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "order not found"));
        }
        Order order = orderOpt.get();
        String paymentStatus = body.get("paymentStatus");
        if (paymentStatus != null && !paymentStatus.isBlank()) {
            order.setPaymentStatus(paymentStatus.toUpperCase());
            orderService.save(order);
        }
        return ResponseEntity.ok(toOrderView(order));
    }

    private Map<String, Object> toDriverView(DeliveryDriver driver) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", driver.getId());
        map.put("name", driver.getName());
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
        map.put("totalAmount", order.getTotalAmount());
        map.put("deliveryAddress", order.getDeliveryAddress());
        map.put("orderDate", order.getOrderDate());
    map.put("paymentStatus", order.getPaymentStatus());
    map.put("paymentMethod", order.getPaymentMethod());
    map.put("paymentQrCode", order.getPaymentQrCode());
        if (order.getRestaurant() != null) {
            map.put("restaurant", Map.of(
                    "id", order.getRestaurant().getId(),
                    "name", order.getRestaurant().getName()
            ));
        }
        if (order.getUser() != null) {
            map.put("user", Map.of(
                    "id", order.getUser().getId(),
                    "name", order.getUser().getName(),
                    "email", order.getUser().getEmail()
            ));
        }
        if (order.getDriver() != null) {
            map.put("driver", Map.of(
                    "id", order.getDriver().getId(),
                    "name", order.getDriver().getName(),
                    "available", order.getDriver().getAvailable()
            ));
        }
        List<Map<String, Object>> items = order.getItems() == null ? List.of() : order.getItems().stream()
                .map(this::toOrderItemView)
                .collect(Collectors.toList());
        map.put("items", items);
        return map;
    }

    private Map<String, Object> toOrderItemView(OrderItem item) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", item.getId());
        map.put("quantity", item.getQuantity());
        if (item.getMenuItem() != null) {
            map.put("menuItem", Map.of(
                    "id", item.getMenuItem().getId(),
                    "name", item.getMenuItem().getName(),
                    "price", item.getMenuItem().getPrice()
            ));
        }
        return map;
    }

    private boolean isOrderActive(Order order) {
        return !isTerminalStatus(order.getStatus());
    }

    private boolean isTerminalStatus(String status) {
        if (status == null) {
            return false;
        }
        return "DELIVERED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status);
    }
}
