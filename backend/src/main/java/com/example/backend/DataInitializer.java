package com.example.backend;

import com.example.backend.model.DeliveryDriver;
import com.example.backend.model.MenuItem;
import com.example.backend.model.Restaurant;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.DeliveryDriverRepository;
import com.example.backend.repository.MenuItemRepository;
import com.example.backend.repository.RestaurantRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(RestaurantRepository restaurantRepository,
                          MenuItemRepository menuItemRepository,
                          UserRepository userRepository,
                          DeliveryDriverRepository deliveryDriverRepository) {
        return args -> {
            if (restaurantRepository.count() == 0) {
                Restaurant r1 = new Restaurant();
                r1.setName("Pasta Palace");
                r1.setCuisine("Italian");
                r1.setAddress("123 Main St");
                r1.setContact("555-0100");
                r1.setRating(4.5);
                restaurantRepository.save(r1);

                MenuItem m1 = new MenuItem();
                m1.setName("Spaghetti Carbonara");
                m1.setDescription("Classic with egg and pancetta");
                m1.setPrice(12.5);
                m1.setRestaurant(r1);
                menuItemRepository.save(m1);

                MenuItem m2 = new MenuItem();
                m2.setName("Margherita Pizza");
                m2.setDescription("Tomato, mozzarella, basil");
                m2.setPrice(10.0);
                m2.setRestaurant(r1);
                menuItemRepository.save(m2);
            }

            BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
            userRepository.findByEmail("user@example.com").ifPresentOrElse(existing -> {
                boolean updated = false;
                if (!enc.matches("password", existing.getPassword())) {
                    existing.setPassword(enc.encode("password"));
                    updated = true;
                }
                Set<Role> roles = existing.getRoles() == null ? new HashSet<>() : new HashSet<>(existing.getRoles());
                if (roles.add(Role.ROLE_USER)) {
                    existing.setRoles(roles);
                    updated = true;
                }
                if (updated) {
                    userRepository.save(existing);
                }
            }, () -> {
                User u = new User();
                u.setName("Test User");
                u.setEmail("user@example.com");
                u.setPassword(enc.encode("password"));
                u.setPhone("555-0001");
                u.setAddress("456 Elm St");
                u.setRoles(Set.of(Role.ROLE_USER));
                userRepository.save(u);
            });

            userRepository.findByEmail("admin@example.com").ifPresentOrElse(existing -> {
                boolean updated = false;
                if (!enc.matches("admin123", existing.getPassword())) {
                    existing.setPassword(enc.encode("admin123"));
                    updated = true;
                }
                Set<Role> roles = existing.getRoles() == null ? new HashSet<>() : new HashSet<>(existing.getRoles());
                if (roles.add(Role.ROLE_ADMIN)) {
                    existing.setRoles(roles);
                    updated = true;
                }
                if (updated) {
                    userRepository.save(existing);
                }
            }, () -> {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@example.com");
                admin.setPassword(enc.encode("admin123"));
                admin.setPhone("555-9999");
                admin.setAddress("HQ");
                admin.setRoles(Set.of(Role.ROLE_ADMIN));
                userRepository.save(admin);
            });

            userRepository.findByEmail("driver@example.com").ifPresentOrElse(existing -> {
                boolean updated = false;
                if (!enc.matches("driver123", existing.getPassword())) {
                    existing.setPassword(enc.encode("driver123"));
                    updated = true;
                }
                Set<Role> roles = existing.getRoles() == null ? new HashSet<>() : new HashSet<>(existing.getRoles());
                if (roles.add(Role.ROLE_DRIVER)) {
                    existing.setRoles(roles);
                    updated = true;
                }
                if (updated) {
                    userRepository.save(existing);
                }
                ensureDriverProfile(existing, deliveryDriverRepository);
            }, () -> {
                User driverUser = new User();
                driverUser.setName("Delivery Driver");
                driverUser.setEmail("driver@example.com");
                driverUser.setPassword(enc.encode("driver123"));
                driverUser.setPhone("555-2000");
                driverUser.setAddress("Warehouse");
                driverUser.setRoles(Set.of(Role.ROLE_DRIVER));
                User saved = userRepository.save(driverUser);
                ensureDriverProfile(saved, deliveryDriverRepository);
            });
        };
    }

    private void ensureDriverProfile(User user, DeliveryDriverRepository deliveryDriverRepository) {
        deliveryDriverRepository.findByUserId(user.getId()).ifPresentOrElse(driver -> {
            boolean updated = false;
            if (driver.getName() == null || driver.getName().isBlank()) {
                driver.setName(user.getName());
                updated = true;
            }
            if (driver.getContact() == null || driver.getContact().isBlank()) {
                driver.setContact(user.getPhone());
                updated = true;
            }
            if (driver.getAvailable() == null) {
                driver.setAvailable(Boolean.TRUE);
                updated = true;
            }
            if (updated) {
                deliveryDriverRepository.save(driver);
            }
        }, () -> {
            DeliveryDriver driver = new DeliveryDriver();
            driver.setName(user.getName());
            driver.setContact(user.getPhone());
            driver.setAvailable(Boolean.TRUE);
            driver.setUser(user);
            deliveryDriverRepository.save(driver);
        });
    }
}
