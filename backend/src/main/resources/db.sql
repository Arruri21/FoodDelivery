-- MySQL schema + sample data for Food Delivery App
CREATE DATABASE IF NOT EXISTS fooddb;
USE fooddb;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS delivery_drivers;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles (
  name VARCHAR(50) PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, role_name),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_name) REFERENCES roles(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE restaurants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  address TEXT,
  contact VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE menu_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image VARCHAR(1024),
  CONSTRAINT fk_menu_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE delivery_drivers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNIQUE,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  restaurant_id BIGINT,
  driver_id BIGINT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_address TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING',
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_order_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_order_driver FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  menu_item_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  restaurant_id BIGINT,
  rating SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_review_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_menu_restaurant ON menu_items (restaurant_id);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_orders_restaurant ON orders (restaurant_id);

INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_RESTAURANT'), ('ROLE_DRIVER'), ('ROLE_ADMIN');

-- Insert a test user (password currently placeholder; see options below to set real hash)
INSERT INTO users (id, name, email, password, phone, address)
VALUES (1, 'Test User', 'user@example.com', '$2a$10$dev-placeholder-hash', '555-0001', '456 Elm St'),
       (2, 'Delivery Driver', 'driver@example.com', '$2a$10$driver-placeholder-hash', '555-2000', 'Warehouse');

-- Map the user to ROLE_USER explicitly
INSERT INTO user_roles (user_id, role_name) VALUES (1, 'ROLE_USER');
INSERT INTO user_roles (user_id, role_name) VALUES (2, 'ROLE_DRIVER');

-- Insert restaurants with explicit ids
INSERT INTO restaurants (id, name, cuisine, address, contact, rating)
VALUES (1, 'Pasta Palace', 'Italian', '123 Main St', '555-0100', 4.5),
       (2, 'Sushi Central', 'Japanese', '88 Ocean Ave', '555-0200', 4.7);

-- Insert menu items referencing the explicit restaurant ids
INSERT INTO menu_items (id, restaurant_id, name, description, price, image)
VALUES (1, 1, 'Spaghetti Carbonara', 'Classic with egg and pancetta', 12.50, NULL),
       (2, 1, 'Margherita Pizza', 'Tomato, mozzarella, basil', 10.00, NULL),
       (3, 2, 'Salmon Nigiri', 'Fresh salmon on rice', 3.50, NULL),
       (4, 2, 'Miso Soup', 'Warm miso soup', 2.50, NULL);

-- Insert a delivery driver with explicit id
INSERT INTO delivery_drivers (id, user_id, name, contact, available) VALUES (1, 2, 'Driver One', '555-1000', TRUE);

-- Reset AUTO_INCREMENT values to avoid collisions for subsequent inserts
ALTER TABLE users AUTO_INCREMENT = 3;
ALTER TABLE restaurants AUTO_INCREMENT = 3;
ALTER TABLE menu_items AUTO_INCREMENT = 5;
ALTER TABLE delivery_drivers AUTO_INCREMENT = 2;

-- Example order insert (recommended to do from application to capture order id and insert items)