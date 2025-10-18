package com.example.backend;

import com.example.backend.model.MenuItem;
import com.example.backend.model.Restaurant;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.MenuItemRepository;
import com.example.backend.repository.RestaurantRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository, UserRepository userRepository) {
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

            if (userRepository.count() == 0) {
                BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
                User u = new User();
                u.setName("Test User");
                u.setEmail("user@example.com");
                u.setPassword(enc.encode("password"));
                u.setPhone("555-0001");
                u.setAddress("456 Elm St");
                u.setRoles(Set.of(Role.ROLE_USER));
                userRepository.save(u);
            }
        };
    }
}
