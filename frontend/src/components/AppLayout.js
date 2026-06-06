import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import NotificationBell from './NotificationBell';

function AppLayout({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Navigation user={user} onLogout={onLogout} />
      <div className="app-main">
        <div className="app-topbar">
          <NotificationBell />
        </div>
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
