# SGI Procurement Backend

## Description
Backend API for SGI Procurement System built with Spring Boot following MVC architecture pattern.

## Architecture
- **Model**: JPA entities representing database tables
- **View**: RESTful API endpoints returning JSON
- **Controller**: REST controllers handling HTTP requests
- **Service**: Business logic and data processing
- **Repository**: Data access layer using Spring Data JPA

## Technologies
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA / Hibernate
- H2 Database (development)
- MySQL (production)
- Maven
- Lombok

## Project Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/sgiprocurement/
│   │   │   ├── controller/    # REST Controllers
│   │   │   ├── service/       # Business Logic
│   │   │   ├── repository/    # Data Access
│   │   │   ├── model/         # JPA Entities
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── exception/     # Custom Exceptions
│   │   │   ├── config/        # Configuration Classes
│   │   │   └── SgiProcurementApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
└── pom.xml
```

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6.0 or higher
- MySQL (optional, for production)

### Installation

1. Clone/Navigate to the project directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

## API Endpoints

### Products
- **GET** `/api/products` - Get all products
- **GET** `/api/products/{id}` - Get product by ID
- **POST** `/api/products` - Create new product
- **PUT** `/api/products/{id}` - Update product
- **DELETE** `/api/products/{id}` - Delete product

## Database
- Default: H2 (in-memory, development)
- H2 Console: `http://localhost:8080/h2-console`

To switch to MySQL, uncomment the MySQL configuration in `application.properties`

## Configuration
Edit `src/main/resources/application.properties` to configure:
- Server port
- Database connection
- Logging level
- JPA/Hibernate settings

## Development

### Add New Entity
1. Create entity class in `model/` package
2. Create repository in `repository/` package extending JpaRepository
3. Create DTO in `dto/` package
4. Create service in `service/` package
5. Create controller in `controller/` package

### Testing
```bash
mvn test
```

## Common Tasks

### Change Database Port
Edit `application.properties`:
```properties
server.port=8081
```

### Enable SQL Logging
Edit `application.properties`:
```properties
spring.jpa.show-sql=true
```

## Frontend Connection
CORS is enabled for `http://localhost:3000` (React frontend)

## License
Copyright © 2024 SGI Procurement
