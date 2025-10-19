package com.example.backend.service;

import com.example.backend.model.MenuItem;
import com.example.backend.repository.MenuItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MenuItemService {
    private final MenuItemRepository menuItemRepository;

    public MenuItemService(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    public List<MenuItem> findByRestaurantId(Long restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    public Optional<MenuItem> findById(Long id) { return menuItemRepository.findById(id); }

    public MenuItem save(MenuItem menuItem) { return menuItemRepository.save(menuItem); }

    public void delete(Long id) { menuItemRepository.deleteById(id); }
}
