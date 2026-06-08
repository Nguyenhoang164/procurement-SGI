import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './styles/App.css';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentList from './pages/PaymentList';
import PaymentRequestDetail from './pages/PaymentRequestDetail';
import PaymentRequestNew from './pages/PaymentRequestNew';
import PlaceholderPage from './pages/PlaceholderPage';
import WarehouseList from './pages/WarehouseList';
import ProductCostList from './pages/ProductCostList';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderNew from './pages/PurchaseOrderNew';
import WeeklyPlanList from './pages/WeeklyPlanList';
import WeeklyPlanNew from './pages/WeeklyPlanNew';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import NotificationsPage from './pages/NotificationsPage';
import ExchangeRateConfig from './pages/ExchangeRateConfig';
import TradeRouteConfig from './pages/TradeRouteConfig';
import BankAccountList from './pages/BankAccountList';
import BankAccountForm from './pages/BankAccountForm';
import WaybillList from './pages/WaybillList';
import WaybillNew from './pages/WaybillNew';
import WaybillDetail from './pages/WaybillDetail';
import CostAlertsList from './pages/CostAlertsList';
import WarehouseReceiptDetail from './pages/WarehouseReceiptDetail';
import WarehouseReceiptList from './pages/WarehouseReceiptList';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import UserDetail from './pages/UserDetail';
import ProcessGuide from './pages/ProcessGuide';
import { authAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivateCountdown, setDeactivateCountdown] = useState(null);
  const [roleChanged, setRoleChanged] = useState(false);
  const countdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const data = await authAPI.checkSession();
        if (!data.active) {
          if (countdownRef.current === null) {
            countdownRef.current = 15;
            setDeactivateCountdown(15);
          }
        } else {
          if (countdownRef.current !== null) {
            countdownRef.current = null;
            setDeactivateCountdown(null);
          }
        }
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (data.role && data.role !== stored.role) {
          const updated = { ...stored, role: data.role, active: data.active };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          setRoleChanged(true);
          setTimeout(() => setRoleChanged(false), 5000);
        }
      } catch (e) { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (deactivateCountdown === null) return;
    if (deactivateCountdown <= 0) { handleLogout(); return; }
    const timer = setTimeout(() => setDeactivateCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [deactivateCountdown]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    countdownRef.current = null;
    setDeactivateCountdown(null);
  };

  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }

  return (
    <>
      {deactivateCountdown !== null && (
        <div className="deactivation-banner">
          Tài khoản đã bị vô hiệu hóa. Đăng xuất sau {deactivateCountdown} giây...
        </div>
      )}
      {roleChanged && (
        <div className="role-changed-banner">
          Vai trò của bạn đã được cập nhật.
        </div>
      )}
      <Router>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
          />
          <Route
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/process-guide" element={<ProcessGuide />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/weekly-plans" element={<WeeklyPlanList />} />
            <Route path="/weekly-plans/new" element={<WeeklyPlanNew />} />        
            <Route path="/weekly-plans/edit/:id" element={<WeeklyPlanNew />} />   
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/purchase-orders" element={<PurchaseOrderList />} />     
            <Route path="/purchase-orders/new" element={<PurchaseOrderNew />} />  
            <Route path="/purchase-orders/edit/:id" element={<PurchaseOrderNew />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/payments/new" element={<PaymentRequestNew />} />
            <Route path="/payments/edit/:id" element={<PaymentRequestNew />} />
            <Route path="/payments/:id" element={<PaymentRequestDetail />} />
            <Route path="/warehouse" element={<WarehouseList />} />
            <Route path="/warehouse/receipts" element={<WarehouseReceiptList />} />
            <Route path="/warehouse/receipts/:id" element={<WarehouseReceiptDetail />} />
            <Route path="/waybills" element={<WaybillList />} />
            <Route path="/waybills/new" element={<WaybillNew />} />
            <Route path="/waybills/edit/:id" element={<WaybillNew />} />
            <Route path="/waybills/:id" element={<WaybillDetail />} />
            <Route path="/costs" element={<ProductCostList />} />
            <Route path="/cost-alerts" element={<CostAlertsList />} />
            <Route path="/admin/exchange-rates" element={<ExchangeRateConfig />} />
            <Route path="/admin/trade-routes" element={<TradeRouteConfig />} />
            <Route path="/bank-accounts" element={<BankAccountList />} />
            <Route path="/bank-accounts/new" element={<BankAccountForm />} />
            <Route path="/bank-accounts/edit/:id" element={<BankAccountForm />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/edit/:id" element={<UserForm />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route
              path="/admin"
              element={
                <PlaceholderPage
                  title="Cấu hình hệ thống"
                  subtitle="Người dùng, dropdown, cấu hình vận hành"     
                  rows={[
                    { label: 'Người dùng', value: '8 tài khoản' },
                    { label: 'Dropdown', value: '22 giá trị' },
                    { label: 'Phạm vi', value: 'UI đã khớp cấu trúc prototype' }
                  ]}
                />
              }
            />
          </Route>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
