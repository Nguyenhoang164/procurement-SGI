import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Đơn hàng tuần này</div>
          <div className="stat-value">5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chờ duyệt</div>
          <div className="stat-value">2</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đang vận chuyển</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hoàn thành</div>
          <div className="stat-value">12</div>
        </div>
      </div>

      <div style={{ marginTop: '20px', color: '#666' }}>
        <p>Chào mừng đến với SGI Procurement System!</p>
        <p>Sử dụng menu trên để bắt đầu quản lý kế hoạch tuần, đơn hàng và thanh toán.</p>
      </div>
    </div>
  );
}

export default Dashboard;
