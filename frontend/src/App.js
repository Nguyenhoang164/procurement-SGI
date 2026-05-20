import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WeeklyPlanList from './pages/WeeklyPlanList';
import WeeklyPlanNew from './pages/WeeklyPlanNew';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderNew from './pages/PurchaseOrderNew';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import PaymentList from './pages/PaymentList';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

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
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} 
        />
        
        <Route 
          path="/weekly-plans" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><WeeklyPlanList /></ProtectedRoute>} 
        />
        
        <Route 
          path="/weekly-plans/new" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><WeeklyPlanNew /></ProtectedRoute>} 
        />
        
        <Route 
          path="/weekly-plans/edit/:id" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><WeeklyPlanNew /></ProtectedRoute>} 
        />
        
        <Route 
          path="/purchase-orders" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><PurchaseOrderList /></ProtectedRoute>} 
        />
        
        <Route 
          path="/purchase-orders/new" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><PurchaseOrderNew /></ProtectedRoute>} 
        />
        
        <Route 
          path="/purchase-orders/:id" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><PurchaseOrderDetail /></ProtectedRoute>} 
        />
        
        <Route 
          path="/payments" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><PaymentList /></ProtectedRoute>} 
        />
        
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
