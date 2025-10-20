package com.example.backend.controller;

import com.example.backend.model.MenuItem;
import com.example.backend.model.Order;
import com.example.backend.model.OrderItem;
import com.example.backend.model.Restaurant;
import com.example.backend.model.User;
import com.example.backend.model.DeliveryDriver;
import com.example.backend.service.MenuItemService;
import com.example.backend.service.OrderService;
import com.example.backend.service.RestaurantService;
import com.example.backend.service.UserService;
import com.example.backend.service.DeliveryDriverService;
import com.example.backend.service.QRCodeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;
    private final DeliveryDriverService deliveryDriverService;
    private final QRCodeService qrCodeService;

    private static final Set<String> CANCEL_ALLOWED_STATUSES = Set.of("PENDING", "CONFIRMED");

    public OrderController(OrderService orderService,
                           UserService userService,
                           RestaurantService restaurantService,
                           MenuItemService menuItemService,
                           DeliveryDriverService deliveryDriverService,
                           QRCodeService qrCodeService) {
        this.orderService = orderService;
        this.userService = userService;
        this.restaurantService = restaurantService;
        this.menuItemService = menuItemService;
        this.deliveryDriverService = deliveryDriverService;
        this.qrCodeService = qrCodeService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long restaurantId = Long.valueOf(body.get("restaurantId").toString());
        var items = (List<Map<String, Object>>) body.get("items");

        User user = userService.findById(userId).orElse(null);
        Restaurant restaurant = restaurantService.findById(restaurantId).orElse(null);
        if (user == null || restaurant == null) return ResponseEntity.badRequest().body(Map.of("error", "invalid user or restaurant"));

        Order order = new Order();
        order.setUser(user);
        order.setRestaurant(restaurant);
        order.setOrderDate(LocalDateTime.now());
        order.setDeliveryAddress(body.getOrDefault("deliveryAddress", user.getAddress()).toString());
        order.setStatus("PENDING");

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0.0;
        for (var it : items) {
            Long menuItemId = Long.valueOf(it.get("menuItemId").toString());
            Integer qty = Integer.valueOf(it.get("quantity").toString());
            MenuItem mi = menuItemService.findById(menuItemId).orElse(null);
            if (mi == null) continue;
            OrderItem oi = new OrderItem();
            oi.setMenuItem(mi);
            oi.setQuantity(qty);
            orderItems.add(oi);
            total += mi.getPrice() * qty;
        }
        order.setItems(orderItems);
        order.setTotalAmount(total);
        order.setPaymentStatus("PENDING");
        if (body.containsKey("paymentMethod")) {
            order.setPaymentMethod(body.get("paymentMethod").toString());
        }

        Order savedOrder = orderService.save(order);
        
        // Generate QR code for payment with actual order ID
        String qrCode = "";
        try {
            qrCode = qrCodeService.generatePaymentQRCode(savedOrder.getId(), total);
            savedOrder.setPaymentQrCode(qrCode);
            orderService.save(savedOrder);
            System.out.println("QR Code generated successfully for order: " + savedOrder.getId());
        } catch (Exception e) {
            System.err.println("Failed to generate QR code for order " + savedOrder.getId());
            e.printStackTrace();
            // Don't fail the order, just proceed without QR code
        }

        return ResponseEntity.ok(Map.of(
            "orderId", savedOrder.getId(),
            "paymentQrCode", savedOrder.getPaymentQrCode() != null ? savedOrder.getPaymentQrCode() : "",
            "paymentStatus", savedOrder.getPaymentStatus() != null ? savedOrder.getPaymentStatus() : "PENDING",
            "paymentMethod", savedOrder.getPaymentMethod() != null ? savedOrder.getPaymentMethod() : "-"
        ));
    }

    @GetMapping("/user/{userId}")
    public List<Order> listByUser(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }

    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId, @RequestParam Long userId) {
        var userOpt = userService.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "user not found"));
        }
        var orderOpt = orderService.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "order not found"));
        }
        Order order = orderOpt.get();
        if (!Objects.equals(order.getUser() != null ? order.getUser().getId() : null, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "order does not belong to user"));
        }
        String currentStatus = order.getStatus() != null ? order.getStatus().toUpperCase() : "";
        if (!CANCEL_ALLOWED_STATUSES.contains(currentStatus)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "order cannot be cancelled"));
        }
        order.setStatus("CANCELLED");
        if (order.getDriver() != null) {
            DeliveryDriver driver = order.getDriver();
            driver.setAvailable(Boolean.TRUE);
            deliveryDriverService.save(driver);
            order.setDriver(null);
        }
        orderService.save(order);
        return ResponseEntity.ok(Map.of("orderId", order.getId(), "status", order.getStatus()));
    }
}
