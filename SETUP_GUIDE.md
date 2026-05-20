# SGI Procurement System - Complete Setup Guide

## Project Overview
A complete procurement management system with:
- **Backend**: Java Spring Boot MVC application
- **Frontend**: React.js responsive web application

## Quick Start

### 1. Backend Setup (Java Spring Boot)

#### Prerequisites
- Java 17 or higher
- Maven 3.6.0 or higher
- MySQL (optional)

#### Setup Steps

```bash
# Navigate to backend directory
cd backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

**Backend URL**: `http://localhost:8080/api`
**H2 Database Console**: `http://localhost:8080/h2-console`

#### Database Configuration
- Default: **H2 (in-memory)** - perfect for development
- Production: **MySQL** - uncomment MySQL config in `application.properties`

### 2. Frontend Setup (React.js)

#### Prerequisites
- Node.js 14.0 or higher
- npm 6.0 or higher

#### Setup Steps

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Frontend URL**: `http://localhost:3000`
**API Proxy**: `http://localhost:8080`

## Project Structure

### Backend - Java MVC Architecture
```
backend/
├── src/main/java/com/sgiprocurement/
│   ├── controller/           # HTTP Endpoints
│   │   └── ProductController.java
│   ├── service/              # Business Logic
│   │   └── ProductService.java
│   ├── repository/           # Data Access (JPA)
│   │   └── ProductRepository.java
│   ├── model/                # JPA Entities
│   │   └── Product.java
│   ├── dto/                  # Data Transfer Objects
│   │   └── ProductDTO.java
│   ├── exception/            # Custom Exceptions
│   │   └── ResourceNotFoundException.java
│   ├── config/               # Configuration & Exception Handler
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ErrorDetails.java
│   │   └── ValidationErrorDetails.java
│   └── SgiProcurementApplication.java  # Main Application
├── src/main/resources/
│   └── application.properties
├── pom.xml                   # Maven Dependencies
└── README.md
```

### Frontend - React Structure
```
frontend/
├── src/
│   ├── components/           # Reusable Components
│   │   ├── Navigation.js
│   │   └── ProductItem.js
│   ├── pages/                # Page Components
│   │   ├── ProductList.js
│   │   ├── ProductForm.js
│   │   └── ProductDetail.js
│   ├── styles/               # CSS Files
│   ├── App.js                # Main App Component
│   └── index.js              # Entry Point
├── public/
│   └── index.html
├── package.json
└── README.md
```

## API Endpoints

### Product Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/{id}` | Get product by ID |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |

### Request/Response Example

**Create Product (POST /api/products)**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 100.00,
  "quantity": 50
}
```

**Response**
```json
{
  "id": 1,
  "name": "Product Name",
  "description": "Product Description",
  "price": 100.00,
  "quantity": 50,
  "createdAt": "2024-05-19T10:30:00",
  "updatedAt": "2024-05-19T10:30:00"
}
```

## Features

### Product Management
✅ View all products with pagination and search
✅ Create new products with validation
✅ Edit existing products
✅ Delete products with confirmation
✅ View detailed product information
✅ Real-time inventory tracking

### Technical Features
✅ RESTful API architecture
✅ MVC design pattern
✅ Data validation and error handling
✅ Responsive UI design
✅ Cross-origin resource sharing (CORS)
✅ Database abstraction with JPA

## Development Workflow

### 1. Adding a New Entity

**Backend:**
1. Create model class in `model/` package
2. Create repository in `repository/` package
3. Create DTO in `dto/` package
4. Create service in `service/` package
5. Create controller in `controller/` package

**Frontend:**
1. Create components in `components/` if reusable
2. Create page component in `pages/`
3. Create service method in `services/`
4. Add route in `App.js`

### 2. Database Switching

**Switch from H2 to MySQL:**

Edit `backend/src/main/resources/application.properties`:
```properties
# Uncomment MySQL lines and comment H2 lines

spring.datasource.url=jdbc:mysql://localhost:3306/sgi_procurement
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

### 3. Enable SQL Logging (Development)

Edit `application.properties`:
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

## Docker Support (Optional)

### Build Backend Docker Image
```bash
cd backend
docker build -t sgi-procurement-backend .
docker run -p 8080:8080 sgi-procurement-backend
```

### Build Frontend Docker Image
```bash
cd frontend
docker build -t sgi-procurement-frontend .
docker run -p 3000:3000 sgi-procurement-frontend
```

## Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Production Build

### Backend
```bash
cd backend
mvn clean package
java -jar target/sgi-procurement-backend-1.0.0.jar
```

### Frontend
```bash
cd frontend
npm run build
# Deploy 'build' folder to web server
```

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```properties
# Change port in application.properties
server.port=8081
```

**Database connection error:**
- Check MySQL is running (for MySQL config)
- H2 is embedded, no setup needed

**CORS errors:**
- Ensure CORS is enabled in ProductController
- Check frontend URL matches @CrossOrigin value

### Frontend Issues

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 already in use:**
```bash
# Unix/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**API connection failed:**
- Ensure backend is running on port 8080
- Check proxy setting in package.json
- Verify CORS configuration

## Performance Tips

### Backend
- Add database indexes for frequently queried fields
- Implement pagination for large result sets
- Use lazy loading for relationships
- Cache frequently accessed data

### Frontend
- Implement React.memo for expensive components
- Use useMemo and useCallback for optimization
- Lazy load routes with React.lazy()
- Implement virtual scrolling for large lists

## Security Considerations

1. **Backend:**
   - Add Spring Security for authentication
   - Validate all input data
   - Use HTTPS in production
   - Implement rate limiting

2. **Frontend:**
   - Sanitize user input
   - Store sensitive data securely
   - Implement proper error handling
   - Use environment variables for API URLs

## Next Steps

1. ✅ Backend and Frontend setup complete
2. 📋 Add more entities (Orders, Customers, etc.)
3. 🔐 Implement user authentication
4. 📊 Add advanced filtering and reporting
5. 🚀 Deploy to production environment

## Useful Commands

```bash
# Backend
mvn clean install        # Clean build
mvn spring-boot:run     # Run application
mvn test                # Run tests
mvn package             # Create JAR file

# Frontend
npm install             # Install dependencies
npm start               # Development server
npm run build           # Production build
npm test                # Run tests
npm run eject           # Eject from CRA
```

## Contact & Support
For issues or questions, check the README files in backend/ and frontend/ directories.

---
**Created**: May 19, 2024
**Version**: 1.0.0
**Last Updated**: May 19, 2024
