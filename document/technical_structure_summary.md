# Tóm tắt cấu trúc Frontend và Backend

Dựa trên `document/02_Tai_lieu_ky_thuat_Mua_hang_v3.docx` (Technical Design Document v3.0), hệ thống SGI Procurement được thiết kế theo kiến trúc:
- Frontend: ReactJS SPA (Vite)
- Backend: Java Spring Boot REST API
- Database: MySQL 8
- Reverse proxy: Nginx

## 1. Kiến trúc tổng quan
- Nginx chịu trách nhiệm serve static files React từ `/dist` và proxy request `/api/*` về Spring Boot trên `:8080`.
- Frontend giao tiếp với Backend qua REST API JSON.
- Backend thực hiện JWT authentication, RBAC, xử lý business logic và truy vấn MySQL.
- MySQL được quản trị bởi phpMyAdmin.

## 2. Cấu trúc thư mục Backend
Root project: `sgi-backend/`

### Các file gốc
- `pom.xml` - Maven dependencies và build config
- `Dockerfile` - Multi-stage build
- `.env.example` - Template biến môi trường

### Source chính
- `src/main/java/com/sgi/procurement/`
  - `SgiProcurementApplication.java` - entrypoint Spring Boot

#### config/
- `SecurityConfig.java`
- `JwtConfig.java`
- `OpenApiConfig.java`
- `MailConfig.java`

#### common/
- `exception/`
  - `GlobalExceptionHandler.java`
  - `BusinessException.java`
  - `ResourceNotFoundException.java`
- `response/`
  - `ApiResponse.java`
  - `PageResponse.java`
- `enums/`
  - `Role.java`
  - `OrderStatus.java`
  - `PaymentStatus.java`
  - `ShippingMethod.java`
  - `Market.java`
- `validator/`
- `audit/`
  - `AuditableEntity.java`

#### security/
- `JwtTokenProvider.java`
- `JwtAuthFilter.java`
- `UserPrincipal.java`
- `RbacAspect.java`

#### auth/
- `AuthController.java`
- `AuthService.java`
- `dto/`
  - `LoginRequest.java`
  - `LoginResponse.java`
  - `ChangePasswordRequest.java`

#### user/
- `UserController.java`
- `UserService.java`
- `UserRepository.java`
- `User.java`
- `UserMapper.java`
- `dto/`
  - `UserDto.java`
  - `CreateUserRequest.java`
  - `UpdateUserRequest.java`

#### dropdown/
- `DropdownController.java`
- `DropdownService.java`
- `DropdownRepository.java`
- `DropdownValue.java`
- `dto/`

#### weeklyplan/ (PKD1)
- `WeeklyPlanController.java`
- `WeeklyPlanService.java`
- `WeeklyPlanRepository.java`
- `WeeklyPlan.java`
- `dto/`

#### purchaseorder/ (PKD2)
- `PurchaseOrderController.java`
- `PurchaseOrderService.java`
- `CostCalculatorService.java`
- `PurchaseOrderRepository.java`
- `PurchaseOrder.java`
- `PurchaseOrderMapper.java`
- `dto/`
  - `PurchaseOrderDto.java`
  - `CreateOrderRequest.java`
  - `UpdateOrderInfoRequest.java`
  - `UpdateShippingCostRequest.java`

#### payment/ (DNTT)
- `PaymentRequestController.java`
- `PaymentRequestService.java`
- `PaymentRequestRepository.java`
- `PaymentRequest.java`
- `dto/`

#### warehouse/
- `WarehouseReceiptController.java`
- `WarehouseReceiptService.java`
- `WarehouseReceiptRepository.java`
- `WarehouseReceipt.java`
- `dto/`

#### productcost/
- `ProductCostController.java`
- `ProductCostService.java`
- `ProductCostRepository.java`
- `ProductCost.java`
- `dto/`

#### attachment/
- `AttachmentController.java`
- `AttachmentService.java`
- `Attachment.java`

#### notification/
- `NotificationController.java`
- `NotificationService.java`
- `Notification.java`

#### report/
- `ReportController.java`
- `DashboardService.java`
- `dto/`
  - `DashboardKpiDto.java`

#### auditlog/
- `AuditLogService.java`
- `AuditLog.java`

### Resources
- `src/main/resources/application.yml`
- `src/main/resources/application-dev.yml`
- `src/main/resources/application-prod.yml`
- `src/main/resources/db/migration/`
  - `V1__create_users.sql`
  - `V2__create_dropdown_values.sql`
  - `V3__create_weekly_plans.sql`
  - `V4__create_purchase_orders.sql`
  - `V5__create_payment_requests.sql`
  - `V6__create_warehouse_receipts.sql`
  - `V7__create_product_costs.sql`
  - `V8__create_attachments.sql`
  - `V9__create_notifications.sql`
  - `V10__create_audit_logs.sql`
  - `V11__seed_dropdown_values.sql`

### Tests
- `src/test/java/com/sgi/procurement/`
  - `auth/AuthControllerTest.java`
  - `purchaseorder/PurchaseOrderServiceTest.java`
  - `purchaseorder/CostCalculatorServiceTest.java`

## 3. Cấu trúc thư mục Frontend
Root project: `sgi-frontend/`

### Các file gốc
- `package.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `.env.example` (VITE_API_BASE_URL=http://localhost:8080)
- `Dockerfile`
- `nginx.conf`

### Static assets
- `public/`
  - `favicon.ico`

### Source chính
- `src/main.tsx`
- `src/App.tsx`
- `src/vite-env.d.ts`

#### lib/
- `axios.ts` - Axios instance với baseURL và JWT interceptor
- `queryClient.ts` - TanStack Query client config
- `utils.ts` - helper chung như `cn()`, `formatMoney()`, `formatDate()`

#### types/
- `auth.types.ts`
- `order.types.ts`
- `payment.types.ts`
- `warehouse.types.ts`
- `cost.types.ts`
- `common.types.ts` (ApiResponse<T>, PageResponse<T>, Role ...)

#### constants/
- `routes.ts`
- `queryKeys.ts`
- `permissions.ts`

#### store/
- `authStore.ts`
- `notificationStore.ts`

#### components/
- `ui/` (Button, Input, Select, Table, Badge, Dialog, Toast, ...)
- `layout/` (AppShell, Sidebar, Topbar, AuthLayout)
- `shared/` (DataTable, StatusBadge, ProgressStepper, FileUpload, ConfirmDialog, PageHeader, LoadingSpinner, ErrorBoundary)
- `forms/` (FormField, SelectField, MoneyInput)

#### hooks/
- `useAuth.ts`
- `usePermission.ts`
- `useToast.ts`

#### router/
- `AppRouter.tsx`
- `ProtectedRoute.tsx`
- `RoleRoute.tsx`

#### features/
- `auth/`
  - `LoginPage.tsx`
  - `useLogin.ts`
  - `authApi.ts`

- `dashboard/`
  - `DashboardPage.tsx`
  - components: `KpiCard.tsx`, `TrendChart.tsx`, `SourcePieChart.tsx`
  - `useDashboard.ts`
  - `dashboardApi.ts`

- `weeklyPlan/`
  - `WeeklyPlanListPage.tsx`
  - `WeeklyPlanNewPage.tsx`
  - `WeeklyPlanTable.tsx`
  - `WeeklyPlanForm.tsx`
  - `useWeeklyPlans.ts`
  - `useCreateWeeklyPlan.ts`
  - `weeklyPlanApi.ts`

- `purchaseOrder/`
  - `OrderListPage.tsx`
  - `OrderNewPage.tsx`
  - `OrderDetailPage.tsx`
  - components: `OrderTable.tsx`, `OrderFormGroup1.tsx`, `OrderFormGroup2.tsx`, `OrderFormGroup3.tsx`, `CostSummaryBox.tsx`, `OrderProgressBar.tsx`
  - hooks: `useOrders.ts`, `useOrderDetail.ts`, `useCreateOrder.ts`, `useApproveOrder.ts`, `useComputedCosts.ts`
  - `purchaseOrderApi.ts`

- `payment/`
  - `PaymentListPage.tsx`
  - `PaymentDetailPage.tsx`
  - components: `PaymentTable.tsx`, `ApprovalPanel.tsx`, `AttachmentPanel.tsx`
  - hooks: `usePayments.ts`, `useApprovePayment.ts`, `useMarkPaid.ts`
  - `paymentApi.ts`

- `warehouse/`
  - `WarehouseListPage.tsx`
  - `ReceiveFormPage.tsx`
  - `warehouseApi.ts`

- `productCost/`
  - `ProductCostPage.tsx`
  - components: `CostVarianceCell.tsx`
  - `productCostApi.ts`

- `productCatalog/`
  - `ProductCatalogPage.tsx`
  - `catalogApi.ts`

- `notification/`
  - `NotificationPage.tsx`
  - `NotificationItem.tsx`
  - `notificationApi.ts`

- `admin/`
  - `AdminPage.tsx`
  - `UserManagementPage.tsx`
  - `DropdownManagementPage.tsx`
  - `AuditLogPage.tsx`

## 4. Ghi nhớ triển khai
- Backend theo package-by-feature và Layered Architecture.
- Frontend theo Feature-based folder structure.
- API base: `/api/v1`.
- Auth: Bearer JWT.
- Nginx serve React static và proxy `/api/*`.
- `CostCalculatorService` tính toán tự động các cột computed trước khi lưu `PurchaseOrder`.
- `ProductCostService` cập nhật giá vốn bình quân gia quyền sau khi nhập kho hoàn thành.

---
Nội dung này đủ để bắt đầu triển khai dự án theo cấu trúc FE/BE đã định nghĩa trong tài liệu kỹ thuật.