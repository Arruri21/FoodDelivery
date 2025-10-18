# Backend - FoodDeliveryApp

This README explains how to switch the backend from the in-memory H2 database to MySQL and how to load the provided `db.sql` schema/seed file.

## Quick steps (using local MySQL)

1. Create a database `fooddb` and a user, or use the supplied docker-compose to run MySQL locally.

2. If using Docker Compose (recommended for dev):

```powershell
cd <project-root>
docker compose up -d db
```

The compose file creates a MySQL server with:
- host: localhost
- port: 3306
- database: fooddb
- user: appuser
- password: apppass

3. Apply the SQL schema/seed:

```powershell
# from the backend folder or where db.sql is located
mysql -h 127.0.0.1 -P 3306 -u appuser -papppass fooddb < src/main/resources/db.sql
```

4. Update `src/main/resources/application.properties` to use MySQL (uncomment and set credentials):

```
spring.datasource.url=jdbc:mysql://localhost:3306/fooddb?useSSL=false&serverTimezone=UTC
spring.datasource.username=appuser
spring.datasource.password=apppass
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

5. Build and run backend:

```powershell
cd backend
.\mvnw.cmd -DskipTests package
.\mvnw.cmd spring-boot:run
```

6. Use the API endpoints (examples):

- GET http://localhost:8080/api/restaurants
- GET http://localhost:8080/api/restaurants/{id}/menu
- POST http://localhost:8080/api/auth/login  (body: {"email":"user@example.com","password":"password"})

Notes:
- The seed user password in `db.sql` is a placeholder bcrypt hash; either sign up via the `/api/auth/signup` endpoint to create a proper hashed password, or replace that value with a real bcrypt hash.
- For production use, configure environment variables for DB credentials and JWT secrets. Use Flyway or Liquibase for migrations.
