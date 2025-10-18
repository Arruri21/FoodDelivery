package com.example.backend.controller;

import com.example.backend.model.MenuItem;
import com.example.backend.model.Order;
import com.example.backend.model.OrderItem;
import com.example.backend.model.Restaurant;
import com.example.backend.model.User;
import com.example.backend.service.MenuItemService;
import com.example.backend.service.OrderService;
import com.example.backend.service.RestaurantService;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;

    public OrderController(OrderService orderService, UserService userService, RestaurantService restaurantService, MenuItemService menuItemService) {
        this.orderService = orderService;
        this.userService = userService;
        this.restaurantService = restaurantService;
        this.menuItemService = menuItemService;
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

        orderService.save(order);
        return ResponseEntity.ok(Map.of("orderId", order.getId()));
    }

    @GetMapping("/user/{userId}")
    public List<Order> listByUser(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }
}
