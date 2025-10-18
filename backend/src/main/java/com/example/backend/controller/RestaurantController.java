package com.example.backend.controller;

import com.example.backend.model.MenuItem;
import com.example.backend.model.Restaurant;
import com.example.backend.service.MenuItemService;
import com.example.backend.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final MenuItemService menuItemService;

    public RestaurantController(RestaurantService restaurantService, MenuItemService menuItemService) {
        this.restaurantService = restaurantService;
        this.menuItemService = menuItemService;
    }

    @GetMapping
    public List<Restaurant> list() { return restaurantService.findAll(); }

    @GetMapping("/{id}/menu")
    public ResponseEntity<?> menu(@PathVariable Long id) {
        List<MenuItem> items = menuItemService.findByRestaurantId(id);
        return ResponseEntity.ok(items);
    }
}
