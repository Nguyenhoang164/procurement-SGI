# Đặc tả hệ thống — SGI Procurement System

> **Phiên bản:** 1.1.0  
> **Cập nhật lần cuối:** 19/06/2026  
> **Tổng số commits:** 30+ | **Controllers:** 15 | **Services:** 17 | **Entities:** 22 | **Migrations:** 44 | **Tests:** 19

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Chức năng đã hoàn thành](#4-chức-năng-đã-hoàn-thành)
5. [Phân quyền & Vai trò (RBAC)](#5-phân-quyền--vai-trò-rbac)
6. [Cấu trúc Database](#6-cấu-trúc-database)
7. [API Endpoints](#7-api-endpoints)
8. [Cấu trúc Backend](#8-cấu-trúc-backend)
9. [Cấu trúc Frontend](#9-cấu-trúc-frontend)
10. [Triển khai (Deployment)](#10-triển-khai-deployment)
11. [Quy tắc đặt tên & sinh mã](#11-quy-tắc-đặt-tên-sản-phẩm-mã-sản-phẩm--mã-sku)
12. [Kiểm thử](#12-kiểm-thử)
13. [Vấn đề tồn đọng](#13-vấn-đề-tồn-đọng)
14. [Lộ trình phát triển](#14-lộ-trình-phát-triển)
    - [Phụ lục A — File tài liệu liên quan](#a-file-tài-liệu-liên-quan)
    - [Phụ lục B — Liên kết](#b-liên-kết)

---

## 1. Tổng quan hệ thống

Hệ thống Mua hàng SGI (SGI Procurement System) là nền tảng quản lý quy trình mua hàng tập trung, thay thế quy trình thủ công bằng Excel/email. Hệ thống bao gồm:

- **Quản lý kế hoạch tuần** (Weekly Plan)
- **Quản lý đơn hàng** (Purchase Order)
- **Quản lý yêu cầu thanh toán** (Payment Request / DNTT)
- **Quản lý kho & nhập hàng** (Warehouse Receipt)
- **Quản lý vận đơn & theo dõi lô hàng** (Waybill / Shipment Tracking)
- **Quản lý sản phẩm & giá vốn** (Product / Product Cost)
- **Quản lý tỷ giá, tuyến đường, tài khoản ngân hàng**
- **Dashboard & Thống kê**
- **Thông báo & Tìm kiếm toàn cục**

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│          http://localhost:3000 (dev)             │
│           /procurement (production)             │
└──────────────────┬──────────────────────────────┘
                   │ REST API (JSON)
                   ▼
┌─────────────────────────────────────────────────┐
│           Backend (Spring Boot 3.x)              │
│          http://localhost:8080/api               │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Controller│  │ Service  │  │Security  │      │
│  │   Layer  │→ │   Layer  │  │  (JWT)   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│       │              │                            │
│       ▼              ▼                            │
│  ┌──────────┐  ┌──────────┐                      │
│  │   JPA    │  │ Flyway  │                       │
│  │Repositary│  │Migration│                       │
│  └──────────┘  └──────────┘                      │
└──────────────────┬──────────────────────────────┘
                   │ JDBC
                   ▼
┌─────────────────────────────────────────────────┐
│              MySQL 8.0                           │
│         sgi_procurement_db                       │
│         44 migrations (V1-V44)                   │
└─────────────────────────────────────────────────┘
```

### Production

```
Apache Reverse Proxy (procurement.sgiholding.com.vn)
       │
       ├── /api → Docker: backend:8080
       └── / → Docker: frontend:80 (Nginx)
```

---

## 3. Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản |
|-----------|-----------|
| Java | 17+ |
| Spring Boot | 3.5.14 |
| Spring Security + JWT | — |
| Spring Data JPA | — |
| Flyway | — |
| MySQL | 8.x |
| Gradle | — |
| JUnit 5 + Mockito | — |

### Frontend
| Công nghệ | Phiên bản |
|-----------|-----------|
| React | 18.2.0 |
| React Router DOM | 6.20.0 |
| Axios | 1.6.2 |
| Recharts | — (Dashboard charts) |
| CSS3 | — |

### Triển khai
| Công nghệ | Mô tả |
|-----------|-------|
| Docker Compose | 3 services: MySQL + Backend + Frontend |
| Apache / Caddy | Reverse proxy |
| VPS | 103.90.225.141 |

---

## 4. Chức năng đã hoàn thành

### 4.1. Quản lý sản phẩm (Product Catalog)
- CRUD sản phẩm
- Import sản phẩm từ Excel
- Tự động sinh mã POS code
- Xoá hàng loạt / xoá toàn bộ
- Product Combos (nhóm sản phẩm) — Combo Code tự động
- Thư viện hình ảnh sản phẩm (image gallery)
- Validate trùng tên sản phẩm
- Bộ lọc phòng ban (department filter)
- Regenerate toàn bộ mã SP

### 4.2. Kế hoạch tuần (Weekly Plan)
- Danh sách kế hoạch nhập hàng tuần
- Thêm kế hoạch mới (9 fields)
- Chuyển từ kế hoạch → tạo đơn hàng

### 4.3. Đơn hàng (Purchase Order)
- CRUD đơn hàng (~30 fields)
- Import Excel đơn hàng (tự động sinh poCode `IMP-YYYYMMDD-NNN`)
- Map 18+ cột: ngày thanh toán, phí order, VC nội địa/quốc tế, tỷ giá, phương thức TT, nguồn nhập...
- Tự động tạo sản phẩm mới khi import (nếu chưa có)
- Lookup posCode từ productName
- Gửi duyệt / phê duyệt / từ chối

### 4.4. Yêu cầu thanh toán (Payment Request / DNTT)
- Liên kết nhiều PO và nhiều vận đơn trong 1 DNTT
- Ma trận phí tùy chỉnh (custom fees matrix)
- Quy trình duyệt 4 bước: L1 → L2 → Kế toán kiểm tra → Chi trả
- Upload file đính kèm (chứng từ thanh toán)
- Chênh lệch tỷ giá

### 4.5. Phiếu nhập kho (Warehouse Receipt)
- Nhập kho theo từng item (WarehouseReceiptItem)
- Kiểm tra số lượng PO → số lượng nhập
- Upload hình ảnh cho từng item
- Cập nhật giá vốn bình quân gia quyền

### 4.6. Quản lý vận đơn & theo dõi lô hàng
- CRUD vận đơn (Waybill)
- Xác nhận giao hàng
- Liên kết vận đơn với DNTT
- Sự kiện theo dõi theo từng vận đơn
- Cập nhật vị trí lô hàng

### 4.7. Theo dõi giá vốn (Product Cost)
- Giá vốn bình quân gia quyền (weighted average cost)
- Cảnh báo biến động giá > 20% (Cost Alerts)
- Theo dõi số lô nhập
- Chi phí & nhận xét (Cost Comments) gắn với PO

### 4.8. Dashboard & Thống kê
- KPIs theo vai trò
- Biểu đồ xu hướng (đơn hàng/kế hoạch/thanh toán theo tháng)
- Biểu đồ tròn phân tích nguồn (source breakdown)
- Biểu đồ cột top sản phẩm
- Danh sách đơn hàng gần đây (Recharts)

### 4.9. Quản lý hệ thống
- Quản lý tài khoản ngân hàng (CRUD + upload QR)
- Quản lý tuyến đường vận chuyển (Trade Routes)
- Quản lý tỷ giá ngoại tệ (ExchangeRateConfig)
- Quản lý người dùng (UserList, UserForm, UserDetail)
- Thông báo (Notifications) — chuông + auto refresh 15s
- Tìm kiếm toàn cục (Global Search)
- Import Excel (PO & Products)
- Docker Compose + Deploy script + Caddyfile reverse proxy

---

## 5. Phân quyền & Vai trò (RBAC)

### 5.1. Danh sách vai trò (9 roles)

| # | Role | Mô tả |
|---|------|-------|
| 1 | ADMIN | Quản trị hệ thống — toàn quyền |
| 2 | CEO | Giám đốc — duyệt cấp cao |
| 3 | WAREHOUSE | Thủ kho — nhập kho, kiểm hàng |
| 4 | ACCOUNTANT | Kế toán — xử lý thanh toán |
| 5 | CHIEF_ACCOUNTANT | Kế toán trưởng — duyệt thanh toán |
| 6 | SALES | Nhân viên kinh doanh |
| 7 | SALES_MANAGER | Trưởng phòng kinh doanh |
| 8 | MANAGER | Quản lý |
| 9 | USER | Người dùng cơ bản (quyền đọc) |

### 5.2. Quyền theo module (14 modules)

| Module | Quyền hỗ trợ |
|--------|-------------|
| Products | R, C, U, D, I |
| Purchase Orders | R, C, U, D, S, AP, RJ |
| Payment Requests | R, C, U, D, S, AP, RJ, PY |
| Exchange Rates | R, C, U, D |
| Cost Comments | R, C, U, D |
| Product Costs | R, C, U, D |
| Shipment Tracking | R, C, U, D |
| Trade Routes | R, C, U, D |
| Bank Accounts | R, C, U, D |
| Waybills | R, C, U, D, CF |
| Warehouse Receipts | R, C, U, D |
| Weekly Plans | R, C, U, D, S, AP, RJ |
| Global Search | R |
| Users | R, C, U, D |

**Chú thích quyền:** R(ead), C(reate), U(pdate), D(elete), I(mport), S(ubmit), AP(prove), RJ(eject), CF(confirm), PY(pay)

> **Chi tiết:** Xem file `backend/role_permission_matrix.txt` (422 dòng)

---

## 6. Cấu trúc Database

### 6.1. Danh sách Entity (22 entities)

| Entity | Table | Mô tả |
|--------|-------|-------|
| User | users | Người dùng |
| Product | products | Sản phẩm |
| ProductCombo | product_combos | Combo/Nhóm sản phẩm |
| ProductImage | product_images | Hình ảnh sản phẩm |
| WeeklyPlan | weekly_plans | Kế hoạch tuần |
| WeeklyPlanItem | weekly_plan_items | Chi tiết kế hoạch tuần |
| PurchaseOrder | purchase_orders | Đơn hàng |
| PurchaseOrderItem | purchase_order_items | Chi tiết đơn hàng |
| PaymentRequest | payment_requests | Yêu cầu thanh toán |
| PaymentRequestPO | payment_request_pos | Liên kết DNTT-PO |
| PaymentRequestWaybill | payment_request_waybills | Liên kết DNTT-vận đơn |
| Waybill | waybills | Vận đơn |
| ShipmentEvent | shipment_events | Sự kiện lô hàng |
| WarehouseReceipt | warehouse_receipts | Phiếu nhập kho |
| WarehouseReceiptItem | warehouse_receipt_items | Chi tiết nhập kho |
| BankAccount | bank_accounts | Tài khoản ngân hàng |
| CostComment | cost_comments | Chi phí & nhận xét |
| CostAlert | cost_alerts | Cảnh báo giá vốn |
| ExchangeRateConfig | exchange_rate_configs | Tỷ giá |
| TradeRoute | trade_routes | Tuyến đường VC |
| Notification | notifications | Thông báo |
| Category | categories | Danh mục |

### 6.2. Flyway Migrations

- **Tổng cộng:** 44 migrations (V1 → V44)
- **Vị trí:** `backend/src/main/resources/db/migration/`
- **Gần đây:**
  - V44: Thêm `old_pos_code` vào products
  - V43: Thêm index hiệu suất (pos_code trên purchase_order_items)
  - Trước đó: Thêm trường department, nullable pos_code, ...

---

## 7. API Endpoints

### 7.1. Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký (USER) |

### 7.2. Products
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/products` | — |
| GET | `/api/v1/products/{id}` | — |
| GET | `/api/v1/products/search` | — |
| GET | `/api/v1/products/by-pos-code/{posCode}` | — |
| GET | `/api/v1/products/generate-code` | — |
| GET | `/api/v1/products/{id}/combos` | — |
| POST | `/api/v1/products` | ADMIN |
| POST | `/api/v1/products/import` | ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, PURCHASING |
| POST | `/api/v1/products/batch-delete` | ADMIN |
| POST | `/api/v1/products/regenerate-codes` | ADMIN |
| POST | `/api/v1/products/{id}/combos` | ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, PURCHASING |
| PUT | `/api/v1/products/{id}` | ADMIN |
| PUT | `/api/v1/products/{id}/combos/{comboId}` | ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, PURCHASING |
| DELETE | `/api/v1/products/{id}` | ADMIN |
| DELETE | `/api/v1/products/delete-all` | ADMIN |
| DELETE | `/api/v1/products/{id}/combos/{comboId}` | ADMIN, CEO, WAREHOUSE, ACCOUNTANT, CHIEF_ACCOUNTANT, SALES, SALES_MANAGER, PURCHASING |

### 7.3. Weekly Plans
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/weekly-plans` |
| GET | `/api/v1/weekly-plans/{id}` |
| POST | `/api/v1/weekly-plans` |
| PUT | `/api/v1/weekly-plans/{id}` |
| DELETE | `/api/v1/weekly-plans/{id}` |
| POST | `/api/v1/weekly-plans/{id}/submit` |
| POST | `/api/v1/weekly-plans/{id}/approve` |
| POST | `/api/v1/weekly-plans/{id}/reject` |

### 7.4. Purchase Orders
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/orders` |
| GET | `/api/v1/orders/import-history` |
| GET | `/api/v1/orders/{id}` |
| POST | `/api/v1/orders` |
| POST | `/api/v1/orders/import` |
| PUT | `/api/v1/orders/{id}` |
| DELETE | `/api/v1/orders/{id}` |
| POST | `/api/v1/orders/{id}/submit` |
| POST | `/api/v1/orders/{id}/approve` |
| POST | `/api/v1/orders/{id}/reject` |

### 7.5. Payment Requests (DNTT)
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/payment-requests` |
| GET | `/api/v1/payment-requests/{id}` |
| POST | `/api/v1/payment-requests` |
| PUT | `/api/v1/payment-requests/{id}` |
| DELETE | `/api/v1/payment-requests/{id}` |
| Upload chứng từ | `/api/v1/payment-requests/{id}/attachments` |

### 7.6. Warehouse
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/warehouse-receipts` |
| GET | `/api/v1/warehouse-receipts/{id}` |
| POST | `/api/v1/warehouse-receipts` |

### 7.7. Waybills
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/waybills` |
| GET | `/api/v1/waybills/{id}` |
| POST | `/api/v1/waybills` |
| POST | `/api/v1/waybills/{id}/confirm` |

### 7.8. Product Costs
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/product-costs` |
| GET | `/api/v1/cost-alerts` |

### 7.9. Global Search
| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/search?q=...` |

### 7.10. Config
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET/POST/PUT/DELETE | `/api/v1/bank-accounts` | Tài khoản NH |
| GET/POST/PUT/DELETE | `/api/v1/trade-routes` | Tuyến đường VC |
| GET/POST/PUT/DELETE | `/api/v1/exchange-rates` | Tỷ giá |
| GET/POST/PUT/DELETE | `/api/v1/users` | Quản lý user |
| GET/POST/PUT/DELETE | `/api/v1/categories` | Danh mục |

---

## 8. Cấu trúc Backend

### Package-by-feature:

```
com.sgiprocurement/
├── config/           # SecurityConfig, JwtConfig, CorsConfig...
├── common/           # Base classes, constants, utils
├── security/         # JwtTokenProvider, JwtAuthFilter, UserDetailsServiceImpl
├── auth/             # AuthController, AuthService, LoginRequest...
├── user/             # UserController, UserService, UserDTO, User entity
├── dropdown/         # DropdownController, CategoryController
├── weeklyplan/       # WeeklyPlanController, WeeklyPlanService, WeeklyPlan entity
├── purchaseorder/    # PurchaseOrderController, PurchaseOrderService, PO entity
├── payment/          # PaymentRequestController, PaymentRequestService, PR entity
├── warehouse/        # WarehouseReceiptController, WarehouseReceiptService
├── productcost/      # ProductCostController, ProductCostService
├── attachment/       # File upload/download
├── notification/     # NotificationController, NotificationService
├── report/           # ReportController (Dashboard/Statistics)
├── auditlog/         # AuditLog (planned)
└── exception/        # GlobalExceptionHandler, ResourceNotFoundException
```

---

## 9. Cấu trúc Frontend

```
src/
├── components/       # Shared: Navigation, PosCodeSelector, NotificationBell...
├── pages/            # Screen components:
│   ├── Login.js / Register.js
│   ├── Dashboard.js
│   ├── WeeklyPlanList.js / WeeklyPlanNew.js
│   ├── PurchaseOrderList.js / PurchaseOrderNew.js / PurchaseOrderDetail.js
│   ├── PaymentRequestList.js / PaymentRequestNew.js / PaymentRequestDetail.js
│   ├── WarehouseList.js / WarehouseReceiptList.js / WarehouseReceiptDetail.js
│   ├── WaybillList.js / WaybillNew.js / WaybillDetail.js
│   ├── ProductList.js / ProductForm.js / ProductDetail.js
│   ├── ProductCostList.js / CostAlertsList.js
│   ├── BankAccountList.js / BankAccountForm.js
│   ├── TradeRouteConfig.js / ExchangeRateConfig.js
│   ├── UserList.js / UserForm.js / UserDetail.js
│   └── NotificationsPage.js
├── services/         # api.js (Axios instance + API calls)
├── App.js            # Router & Layout
└── App.css           # Global styles
```

### Điều hướng (Sidebar):
- Dashboard
- Kế hoạch tuần
- Đơn hàng (→ Tạo đơn, Chi tiết)
- Đề nghị TT (DNTT)
- Nhận hàng / Kho
- Giá vốn SP
- Danh mục SP
- Quản lý vận đơn
- Cấu hình (→ Tài khoản NH, Tuyến đường, Tỷ giá, Người dùng)

---

## 10. Triển khai (Deployment)

### Docker Compose (3 services)
| Service | Image | Port |
|---------|-------|------|
| MySQL 8.0 | mysql:8.0 | 3307 (host) |
| Backend (Spring Boot) | — | 8080 |
| Frontend (React/Nginx) | — | 80 |

### Scripts
| Script | Mô tả |
|--------|-------|
| `deploy.ps1` | PowerShell deploy (Windows) |
| `deploy.sh` | Bash deploy (Linux) |
| `deploy_vps.bat` | SSH deploy từ Windows lên VPS |
| `server-setup-ubuntu.sh` | Setup Ubuntu server từ đầu |

### Domain
- **URL:** `https://procurement.sgiholding.com.vn`
- **Reverse proxy:** Apache → Docker containers

### Môi trường
| File | Mô tả |
|------|-------|
| `.env.example` | Template biến môi trường |
| `docker-compose.yml` | Docker Compose config |
| `Caddyfile` | Caddy proxy config |

### Port allocation
| Port | Dịch vụ |
|------|---------|
| 80 | Frontend (Nginx) |
| 8080 | Backend (Spring Boot) |
| 3307 | MySQL 8.0 |

---

## 11. Quy tắc đặt tên sản phẩm, mã sản phẩm & mã SKU

> **Cập nhật lần cuối:** 19/06/2026

### 11.1. Mã sản phẩm (POS Code) — Chuẩn

**Format:**
```
{DEPT_PREFIX}-{NAME_PREFIX}-{SEQUENCE:03d}
```
*Ví dụ:* `KIN-DURE-001`, `DP-VN-0005`

#### Lưu ý: tham số `market`
- API `GET /api/v1/products/generate-code` nhận tham số `market` nhưng **không được sử dụng** trong logic sinh mã hiện tại.
- Chỉ có `productName`, `department` và `iteration` ảnh hưởng đến kết quả.
- Dự phòng cho phiên bản sau (có thể đưa mã thị trường vào format mã SP).

#### DEPT_PREFIX — Tiền tố phòng ban
- Lấy **tối đa 3 ký tự đầu** của tên phòng ban, viết HOA.
- Nếu phòng ban null/rỗng → dùng `"XXX"`.

| Department | DEPT_PREFIX |
|-----------|-------------|
| KINHDOANH | KIN |
| SALE | SAL |
| (rỗng) | XXX |

#### NAME_PREFIX — Tiền tố tên sản phẩm
- Tách tên sản phẩm theo ranh giới **ký tự không phải chữ/số** (regex: `[^\p{L}\p{N}]+`).
- Lấy **ký tự đầu tiên của mỗi từ**, viết HOA.
- Gom tối đa **4 ký tự**.
- Nếu thiếu → đệm `'X'` cho đủ 4.

| Tên sản phẩm | Các từ | NAME_PREFIX |
|-------------|--------|-------------|
| C-JESUS CAR | C, JESUS, CAR | CJCH |
| DUREX | DUREX | DURE |
| Bột ngọt | Bột, ngọt | BNXX |
| (rỗng) | — | XXXX |

#### SEQUENCE — Số thứ tự
- Đếm số sản phẩm có cùng `{DEPT_PREFIX}-{NAME_PREFIX}-` trong DB.
- `seq = count + 1 + iteration` (iteration mặc định = 0).
- Format: **3 chữ số**, zero-padded (`String.format("%03d", seq)`).

**API:** `GET /api/v1/products/generate-code?productName=&market=&department=&category=&iteration=`

### 11.2. Mã sản phẩm nhập khẩu (Import POS Code)

**Format:**
```
IMP-{NAME_PREFIX}-{SEQUENCE:04d}
```
*Ví dụ:* `IMP-DURE-0001`, `IMP-CJCH-0001`

- **NAME_PREFIX**: Giống quy tắc chuẩn (lấy 4 ký tự đầu mỗi từ, viết HOA).
- **SEQUENCE**: 4 chữ số zero-padded (khác với chuẩn là 3 số).
- Dùng khi import Excel đơn hàng (PO) mà tên sản phẩm không khớp với SP có sẵn → tự động tạo SP mới.

### 11.3. Mã Combo / SKU (Combo Code)

**Format:**
```
CB-{NORMALIZED_POS_CODE}-{SEQUENCE:02d}
```
*Ví dụ:* `CB-DP-VN-0001-01`, `CB-KIN-DURE-001-02`

- **CB**: prefix cố định cho combo.
- **NORMALIZED_POS_CODE**: POS code của SP gốc → viết HOA, thay ký tự đặc biệt bằng `-`, xóa `-` đầu/cuối.
- **SEQUENCE**: 2 chữ số zero-padded, tự động tăng dần.
- Nếu POS code null → fallback: `SP-{productId}`.

**API:** `GET/POST /api/v1/products/{id}/combos`

### 11.4. Mã đơn hàng nhập khẩu (Import PO Code)

**Format:**
```
IMP-{YYYYMMDD}-{SEQUENCE:03d}
```
*Ví dụ:* `IMP-20260618-001`

- **YYYYMMDD**: Ngày import.
- **SEQUENCE**: 3 chữ số zero-padded, tăng dần trong ngày.

### 11.5. Quy tắc đặt tên sản phẩm

#### Validation
- **Tên sản phẩm là bắt buộc** (không được null/rỗng).
- **Tên sản phẩm phải là duy nhất** — không trùng với SP đã tồn tại.
- Tên được trim trước khi lưu.

#### Các trường metadata
| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `productName` | ✅ | Tên tiếng Anh / tên chính |
| `vietnameseName` | ❌ | Tên tiếng Việt |
| `posCode` | ✅ (auto) | Mã SP chính, unique |
| `oldPosCode` | ❌ | Mã SP cũ (khi đổi tên) |
| `marketCode` | ❌ | Mã thị trường (VD: VN, US) |
| `department` | ❌ | Phòng ban quản lý |
| `spec` | ❌ | Quy cách đóng gói |
| `unit` | ❌ | Đơn vị tính |
| `sku` | ❌ (chưa có) | Mã SKU — **chưa được implement ở backend** (xem ghi chú §11.9) |
| `status` | ❌ (default: ACTIVE) | ACTIVE / INACTIVE |
| `categoryId` | ❌ | ID danh mục |
| `sourceLink` | ❌ | Link nguồn hàng |
| `productType` | ❌ | Loại sản phẩm |

### 11.6. Tổng hợp các format mã

| Loại mã | Format | Độ dài sequence | Ví dụ |
|---------|--------|----------------|-------|
| POS Code (chuẩn) | `{DEPT}-{NAME}-{NNN}` | 3 số | `KIN-DURE-001` |
| POS Code (import) | `IMP-{NAME}-{NNNN}` | 4 số | `IMP-DURE-0001` |
| Combo Code | `CB-{POSCODE}-{NN}` | 2 số | `CB-KIN-DURE-001-01` |
| PO Code (import) | `IMP-{YYYYMMDD}-{NNN}` | 3 số | `IMP-20260618-001` |
| SKU | **Chưa implement** | — | — |

### 11.7. Tiện ích khác

- **Regenerate toàn bộ mã SP:** `POST /api/v1/products/regenerate-codes` (Admin) — duyệt tất cả SP, tính lại mã theo quy tắc chuẩn, dùng `saveAndFlush` tránh trùng sequence.
- **Batch delete:** `POST /api/v1/products/batch-delete`, `DELETE /api/v1/products/delete-all`

### 11.8. Ví dụ thực tế

| Tên SP | Department | DEPT_PREFIX | POS Code | Combo Code |
|--------|-----------|-------------|----------|------------|
| C-JESUS CAR | Kinh doanh | KIN | `KIN-CJCH-001` | `CB-KIN-CJCH-001-01` |
| DUREX | Sale | SAL | `SAL-DURE-001` | `CB-SAL-DURE-001-01` |
| Bột ngọt | (rỗng) | XXX | `XXX-BNXX-001` | `CB-XXX-BNXX-001-01` |
| (import) | — | — | `IMP-DURE-0001` | — |

### 11.9. Ghi chú hiện trạng mã SKU

> **SKU chưa được implement ở backend.** Dưới đây là hiện trạng chi tiết:

| Khía cạnh | Trạng thái |
|-----------|-----------|
| Trường `sku` trong Entity `Product.java` | ❌ **Chưa có** |
| Cột `sku` trong database | ❌ **Chưa có** (không có trong 44 migrations) |
| API sinh mã SKU | ❌ **Chưa có** |
| Logic nghiệp vụ SKU | ❌ **Chưa có** |
| UI hiển thị cột SKU (frontend) | ⚠️ Có hiển thị cột "Mã biến thể (SKU)" ở màn hình danh sách, nhưng đang dùng `posCode` làm dữ liệu tạm |
| Kế hoạch | 📋 Đã có yêu cầu: format dự kiến `{Mã SP}-{Tên biến thể}` (VD: `KIN-CJCH-001-MauDen`) |

### 11.10. Lưu ý kỹ thuật từ code thực tế

1. **Tham số `market` không được dùng**: API `generate-code` nhận `market` nhưng logic sinh mã POS bỏ qua tham số này.
2. **Logic `getNamePrefix` bị duplicate**: Cùng một logic lấy tiền tố tên SP được copy ở cả `ProductNamingService` và `PurchaseOrderService` — cần extract thành shared utility.
3. **Fallback `category`**: API `generate-code` dùng tham số `category` làm tên dự phòng nếu `productName` rỗng.
4. **Không có SKU**: Chức năng SKU (mã biến thể) chưa có trong backend — chỉ có POS Code (mã sản phẩm chính) và Combo Code (mã nhóm sản phẩm).

---

## 12. Kiểm thử

- **Framework:** JUnit 5 + Mockito
- **Tổng số:** 19 file test
- **Loại test:** Controller tests, Service tests, Security tests
- **File test chính:**
  - `ProductNamingServiceTest.java` — Test sinh mã POS
  - `ProductServiceTest.java` — Test CRUD + import sản phẩm
  - `ProductControllerTest.java` — Test REST endpoints

### Chạy test
```bash
cd backend
./gradlew test           # Linux/Mac
.\gradlew.bat test       # Windows PowerShell
```

---

## 13. Vấn đề tồn đọng

| # | Vấn đề | Mô tả |
|---|--------|-------|
| 1 | Form thông tin NH bị `[Object Object]` | Trường thông tin ngân hàng trong form tạo DNTT hiển thị sai |
| 2 | Nút tạo đơn hiển thị cho mọi role | Chỉ nên hiển thị với role có thẩm quyền |
| 3 | Dashboard thiếu biến thể | Cột mã đơn, mã POS, số lượng chưa hiển thị biến thể tốt |
| 4 | Search nâng cao chưa hoàn thiện | Cần search đa thực thể (PO, DNTT, Waybill) |
| 5 | Bỏ link đăng ký & chữ Demo ở trang login | Chưa thực hiện |
| 6 | Hiển thị quy trình mua hàng | Chia 2 màn: sơ đồ tổng thể + quy trình theo vai trò user |
| 7 | Đơn giá - Thành tiền - Quy đổi VND | Cần thống nhất theo mẫu phiếu mua hàng (nhân dân tệ) |
| 8 | Cột "Ngày về thực tế", "Người check", "SL kho nhận" | Chưa map trong import Excel |

---

## 14. Lộ trình phát triển

### 🔴 Ưu tiên cao
1. **Audit Log** — Ghi lại tất cả thay đổi dữ liệu
2. **Email Notifications** — Gửi email khi cần duyệt (SMTP + template)

### 🟡 Ưu tiên trung bình
3. **Export Excel** — Xuất dữ liệu ra Excel (PO, DNTT, sản phẩm, kho)
4. **Báo cáo PDF** — Tạo PDF cho đơn hàng, phiếu thanh toán, phiếu nhập kho
5. **Swagger / OpenAPI** — Tự động tạo tài liệu API
6. **Quản lý kho nâng cao** — Nhập/xuất/tồn, cảnh báo tồn tối thiểu
7. **Lọc & tìm kiếm nâng cao** — Nhiều tiêu chí lọc hơn

### 🟢 Ưu tiên thấp
8. **Cổng thanh toán** — Tích hợp thanh toán trực tuyến
9. **Đa ngôn ngữ (i18n)** — Hỗ trợ Anh, Việt, Trung...
10. **Mobile App (React Native)** — Ứng dụng di động
11. **Tích hợp phần mềm kế toán** — Kết nối với hệ thống kế toán hiện có

---

## Phụ lục

### A. File tài liệu liên quan

| File | Mô tả |
|------|-------|
| `SETUP_GUIDE.md` | Hướng dẫn cài đặt & chạy |
| `IMPLEMENTATION_GUIDE.md` | Hướng dẫn implement chi tiết |
| `KICH_BAN_DEMO.txt` | Kịch bản demo + Postman API |
| `tong-hop-chuc-nang.txt` | Tổng hợp chức năng (07/06/2026) |
| `backend/tong-hop-nang-cap.md` | Tổng hợp nâng cấp (14/06/2026) |
| `backend/role_permission_matrix.txt` | Ma trận phân quyền chi tiết |
| `document/sgi_procurement_prototype_v2_summary.md` | Tóm tắt prototype & case chức năng |
| `document/01_Tai_lieu_nghiep_vu_Mua_hang_v3.docx` | Tài liệu nghiệp vụ mua hàng |
| `document/02_Tai_lieu_ky_thuat_Mua_hang_v3.docx` | Tài liệu kỹ thuật mua hàng |
| *(Nhúng trong SPEC_SYSTEM.md §11)* | Quy tắc đặt tên SP, mã SP (+ ghi chú SKU) |

### B. Liên kết
- **Production:** https://procurement.sgiholding.com.vn
- **VPS:** 103.90.225.141
- **Frontend port (dev):** 3000
- **Backend port (dev):** 8080
