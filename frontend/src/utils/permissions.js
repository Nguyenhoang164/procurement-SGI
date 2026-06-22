export const ROLES = {
  ADMIN: 'ADMIN',
  CEO: 'CEO',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTANT: 'ACCOUNTANT',
  CHIEF_ACCOUNTANT: 'CHIEF_ACCOUNTANT',
  SALES: 'SALES',
  SALES_MANAGER: 'SALES_MANAGER',
  PURCHASING: 'PURCHASING',
  PENDING: 'PENDING'
};

export function getUser() {
  const data = localStorage.getItem('user');
  return data ? JSON.parse(data) : null;
}

export function hasRole(user, ...roles) {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

export function isAdmin(user) { return user?.role === ROLES.ADMIN; }

export function isCeo(user) { return user?.role === ROLES.CEO; }

export function isAdminOrCeo(user) { return isAdmin(user) || isCeo(user); }

// Users
export function canManageUsers(user) { return isAdminOrCeo(user); }
export function canDeleteUsers(user) { return isAdmin(user); }

// Products
export function canCrudProducts(user) { return isAdmin(user); }
export function canImportProducts(user) { return hasRole(user, ROLES.ADMIN, ROLES.CEO, ROLES.WAREHOUSE, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT, ROLES.SALES_MANAGER, ROLES.PURCHASING); }

// Purchase Orders
export function canCreatePO(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.PURCHASING); }
export function canEditPO(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.PURCHASING); }
export function canDeletePO(user) { return isAdmin(user); }
export function canImportPO(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canSubmitPO(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canApprovePO_L1(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canRejectPO(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canSendPOToAccounting(user) { return isAdmin(user); }

// Payment Requests
export function canCreatePayment(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT, ROLES.SALES_MANAGER, ROLES.PURCHASING); }
export function canEditPaymentByRole(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT, ROLES.SALES_MANAGER, ROLES.PURCHASING); }
export function canDeletePayment(user) { return isAdmin(user); }
export function canApprovePR_L1(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }
export function canApprovePR_L2(user) { return isAdmin(user); }
export function canAccountingCheck(user) { return hasRole(user, ROLES.ADMIN, ROLES.CHIEF_ACCOUNTANT); }
export function canRejectPR(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }
export function canPayPR(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }
export function canConfirmPaymentPR(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }

// Exchange Rates
export function canUpdateExchangeRates(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }

// Cost Comments
export function canAddCostComment(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT, ROLES.SALES_MANAGER, ROLES.PURCHASING); }

// Waybills
export function canCrudWaybill(user) { return hasRole(user, ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.SALES_MANAGER, ROLES.PURCHASING); }
export function canConfirmWaybill(user) { return hasRole(user, ROLES.ADMIN, ROLES.WAREHOUSE); }

// Warehouse Receipts
export function canCrudWarehouseReceipt(user) { return hasRole(user, ROLES.ADMIN, ROLES.WAREHOUSE); }

// Weekly Plans
export function canCrudWeeklyPlan(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES, ROLES.SALES_MANAGER); }
export function canDeleteWeeklyPlan(user) { return isAdmin(user); }
export function canApproveWP_L1(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES, ROLES.SALES_MANAGER); }
export function canApproveWP_L2(user) { return isAdmin(user); }
export function canRejectWP(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }

// Trade Routes
export function canCreateTradeRoute(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canEditTradeRoute(user) { return hasRole(user, ROLES.ADMIN, ROLES.SALES_MANAGER); }
export function canDeleteTradeRoute(user) { return isAdmin(user); }

// Bank Accounts
export function canCrudBankAccount(user) { return hasRole(user, ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.CHIEF_ACCOUNTANT); }
export function canDeleteBankAccount(user) { return isAdmin(user); }

// Product Costs
export function canDeleteProductCost(user) { return isAdmin(user); }

// Shipment Tracking
export function canCreateShipmentTracking(user) { return hasRole(user, ROLES.ADMIN, ROLES.WAREHOUSE); }
