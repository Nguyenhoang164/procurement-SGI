# SGI Procurement System - Implementation Guide

**Date**: May 19, 2026  
**Status**: Phase 1 Complete - JWT Auth + Core Features Implemented

## ✅ What Has Been Implemented

### Backend (Java Spring Boot)

#### 1. **JWT Authentication**
- JWT token generation and validation using JJWT library
- User login endpoint: `POST /api/v1/auth/login`
- Spring Security configuration with stateless JWT authentication
- Admin user auto-initialization on startup (username: `admin`, password: `admin@123`)

#### 2. **Core Entities**
- **User**: User accounts with roles (ADMIN, MANAGER, USER) and markets
- **WeeklyPlan**: Weekly procurement plans with 9 core fields (PKD1)
- **PurchaseOrder**: Complete purchase orders with ~30 fields (PKD2)
- **PaymentRequest**: Payment requests linked to purchase orders (DNTT)
- **WarehouseReceipt**: Warehouse receipt confirmations

#### 3. **Business Logic**
- **CostCalculatorService**: Automatic cost calculation
  - Converts currency with exchange rate
  - Calculates total lot cost: product cost + all shipping fees
  - Calculates unit cost: total cost / quantity
  - Calculates remaining payment: total - deposit

#### 4. **REST API Endpoints**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | User login | Public |
| GET | `/api/v1/weekly-plans` | List all weekly plans | Required |
| GET | `/api/v1/weekly-plans/{id}` | Get weekly plan detail | Required |
| POST | `/api/v1/weekly-plans` | Create new plan | MANAGER+ |
| PUT | `/api/v1/weekly-plans/{id}` | Update plan | MANAGER+ |
| DELETE | `/api/v1/weekly-plans/{id}` | Delete plan | ADMIN |
| GET | `/api/v1/purchase-orders` | List all orders | Required |
| GET | `/api/v1/purchase-orders/{id}` | Get order detail | Required |
| POST | `/api/v1/purchase-orders` | Create new order | MANAGER+ |
| PUT | `/api/v1/purchase-orders/{id}` | Update order | MANAGER+ |
| DELETE | `/api/v1/purchase-orders/{id}` | Delete order | ADMIN |
| GET | `/api/v1/payment-requests` | List payment requests | Required |
| POST | `/api/v1/payment-requests` | Create payment request | MANAGER+ |
| GET | `/api/v1/warehouse-receipts` | List receipts | Required |
| POST | `/api/v1/warehouse-receipts` | Confirm receipt | MANAGER+ |

#### 5. **Database**
- H2 in-memory database (development, auto-created on startup)
- MySQL support (configured but commented out)
- JPA/Hibernate ORM
- All entities have audit fields: `createdAt`, `updatedAt`, `createdBy`

### Frontend (React.js)

#### 1. **Authentication**
- Login page with demo credentials (admin / admin@123)
- JWT token storage in localStorage
- Protected routes component
- Automatic redirect to login for unauthenticated users

#### 2. **Core Pages**
- **Dashboard**: Overview with statistics
- **WeeklyPlanList**: List and manage weekly plans
- **WeeklyPlanNew**: Create/edit weekly plans
- **PurchaseOrderList**: List all purchase orders
- **PurchaseOrderNew**: Create/edit purchase orders with real-time cost calculation
- **PurchaseOrderDetail**: View complete order details
- **PaymentList**: List and manage payment requests

#### 3. **API Clients**
- Centralized API service with proper error handling
- Automatic JWT token injection in request headers
- Support for all CRUD operations

#### 4. **Styling**
- Responsive design for mobile, tablet, desktop
- Clean, professional UI with consistent color scheme
- Form validation and error display
- Loading states and empty states

#### 5. **Navigation**
- Top navigation bar with user info and logout
- Menu links for main sections
- Responsive mobile menu

## 🚀 How to Run

### Prerequisites
- Java 17+
- Node.js 14+
- Maven 3.6+
- npm 6+

### Backend Setup

```bash
# Navigate to backend
cd backend

# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Backend will start on: http://localhost:8080/api
# H2 Console: http://localhost:8080/api/h2-console
```

**Key URLs:**
- API Base: `http://localhost:8080/api`
- H2 Console: `http://localhost:8080/api/h2-console`
- Login: `POST /api/v1/auth/login`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Frontend will open at: http://localhost:3000
```

**Demo Login Credentials:**
- Username: `admin`
- Password: `admin@123`

## 📋 Key Features

### Weekly Plan (PKD1) - 9 Fields
- Mã POS (Product Code)
- SL dự kiến (Suggested Quantity)
- Quy cách (Specification)
- Quốc gia (Country)
- Phương thức VC (Shipping Method)
- Giá tham khảo (Reference Price)
- Ghi chú (Notes)
- Status: DRAFT, PENDING, APPROVED, REJECTED
- Timestamps: createdAt, updatedAt

### Purchase Order (PKD2) - ~30 Fields
**Product & Order Info:**
- Mã POS, SL đặt, Giá đơn vị
- Đơn vị tiền (Currency), Tỉ giá (Exchange Rate)

**International Shipping:**
- VC quốc tế, VC nội địa
- Phí đặt hàng, Phí giao hàng

**Auto Calculated (CostCalculatorService):**
- Tổng tiền lô (Total Lot Cost)
- GV 1 SP (Unit Cost Full)
- Tiền deposit (Deposit)
- Còn phải thanh toán (Remaining Payment)

**Status:** DRAFT, PENDING, APPROVED, IN_TRANSIT, COMPLETED

### Cost Calculation Formula
```
Giá hàng VND = unitPrice (USD) × exchangeRate
Tổng Chi Phí = (Giá hàng VND × SL) + VC quốc tế + VC nội địa + Phí + Phí giao hàng
GV 1 SP = Tổng Chi Phí / SL
Còn TT = Tổng Chi Phí - Deposit
```

## 🔐 Security

- JWT tokens with 24-hour expiration
- Role-based access control (RBAC)
- Method-level security with @PreAuthorize
- Password hashing with BCrypt
- CORS enabled for localhost:3000

## 📁 Project Structure

```
SGI ProCurement/
├── backend/
│   ├── src/main/java/com/sgiprocurement/
│   │   ├── config/           # JWT, Security, CORS configs
│   │   ├── controller/       # REST endpoints
│   │   ├── model/            # JPA entities
│   │   ├── repository/       # Data access
│   │   ├── service/          # Business logic
│   │   ├── dto/              # Data transfer objects
│   │   ├── exception/        # Custom exceptions
│   │   └── SgiProcurementApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navigation, ProtectedRoute
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   ├── styles/           # CSS files
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── tsconfig.json
│
└── document/
    ├── core_features_plan.md        # Original requirements
    ├── sgi_procurement_prototype_v2.html # UI prototype
    └── SETUP_GUIDE.md
```

## 🧪 Testing

### Manual API Testing

**1. Login**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@123"}'

# Response:
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "username": "admin",
  "role": "ADMIN",
  "market": "All Markets"
}
```

**2. Create Weekly Plan**
```bash
curl -X POST http://localhost:8080/api/v1/weekly-plans \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "posCode": "POS001",
    "suggestedQty": 100,
    "country": "China",
    "shippingMethod": "SEA",
    "spec": "Product Specification",
    "note": "Sample note"
  }'
```

**3. Create Purchase Order**
```bash
curl -X POST http://localhost:8080/api/v1/purchase-orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "posCode": "POS001",
    "orderedQty": 100,
    "unitPrice": 10.50,
    "currency": "USD",
    "exchangeRate": 24000,
    "intlShippingVnd": 5000000,
    "domesticShippingVnd": 1000000,
    "depositVnd": 10000000
  }'
```

## 🔄 Next Steps (Future Phases)

### Phase 2
- [ ] Add more user roles and permissions (TP KD, NV Mua Hàng, Kế Toán, Kho)
- [ ] Implement payment request approval workflow
- [ ] Add warehouse receipt with photo attachments
- [ ] Implement weighted average cost calculation for inventory
- [ ] Add audit log for all transactions

### Phase 3
- [ ] Email notifications for approvals
- [ ] Export to Excel functionality
- [ ] Advanced filtering and search
- [ ] Dashboard with charts and analytics
- [ ] PDF report generation
- [ ] Integration with payment gateway

### Phase 4
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced inventory management
- [ ] Integration with accounting system
- [ ] API documentation (Swagger/OpenAPI)

## 📝 Configuration

### Backend Configuration (application.properties)
```properties
# JWT Secret - Change in production!
jwt.secret=sgi-procurement-secret-key-2024-spring-boot-jwt-authentication

# JWT Token Expiration (24 hours in milliseconds)
jwt.expiration=86400000

# Database
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop
```

### Frontend Configuration (api.js)
```javascript
const API_BASE_URL = 'http://localhost:8080/api/v1';
// Update for production deployment
```

## ⚠️ Important Notes

1. **Change JWT Secret in Production**: The current secret is hardcoded. Use environment variables in production.
2. **Database**: H2 in-memory database loses data on restart. Use MySQL for persistence.
3. **CORS**: Currently set to `localhost:3000`. Update for production domains.
4. **Password Security**: The admin default password should be changed after first login.
5. **SSL/HTTPS**: Not enabled. Configure in production.

## 📞 Support

For issues or questions, check:
- Backend README: [backend/README.md](backend/README.md)
- Frontend README: [frontend/README.md](frontend/README.md)
- Core Features Plan: [document/core_features_plan.md](document/core_features_plan.md)

---

**Version**: 1.0.0 - Phase 1  
**Last Updated**: May 19, 2026
