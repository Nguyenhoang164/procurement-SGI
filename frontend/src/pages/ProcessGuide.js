import React, { useState } from 'react';
import { getUser } from '../utils/permissions';

const ROLE_LABELS = {
  ADMIN: 'Admin', CEO: 'CEO', WAREHOUSE: 'Thủ kho',
  ACCOUNTANT: 'Kế toán', CHIEF_ACCOUNTANT: 'Kế toán trưởng',
  SALES: 'Lead kinh doanh', SALES_MANAGER: 'Trưởng phòng kinh doanh',
  PURCHASING: 'Nhân viên mua hàng', PENDING: 'Chờ phân quyền'
};

const R = ROLE_LABELS;

const STEPS = [
  { id: 'weekly-plan', label: 'Kế hoạch tuần', icon: '📋', color: '#2563eb',
    desc: `${R.SALES}/${R.PURCHASING} lập kế hoạch nhập hàng theo tuần, trình duyệt. ${R.SALES_MANAGER} phê duyệt.` },
  { id: 'purchase-order', label: 'Đơn mua hàng', icon: '📄', color: '#059669',
    desc: `${R.SALES}/${R.PURCHASING} tạo đơn hàng (PO) từ kế hoạch. ${R.SALES_MANAGER} phê duyệt L1. ${R.ADMIN} gửi kế toán.` },
  { id: 'payment-request', label: 'Đề nghị thanh toán', icon: '💰', color: '#d97706',
    desc: `${R.ACCOUNTANT}/${R.CHIEF_ACCOUNTANT}/${R.SALES}/${R.PURCHASING} tạo đề nghị thanh toán. ${R.ACCOUNTANT}/${R.CHIEF_ACCOUNTANT} duyệt L1, chi trả. ${R.ADMIN} duyệt L2.` },
  { id: 'waybill', label: 'Vận đơn', icon: '🚢', color: '#7c3aed',
    desc: `${R.WAREHOUSE}/${R.SALES}/${R.PURCHASING} tạo vận đơn theo lô hàng. ${R.WAREHOUSE} xác nhận khi hàng về.` },
  { id: 'warehouse-receipt', label: 'Nhập kho', icon: '📦', color: '#dc2626',
    desc: `${R.WAREHOUSE} tạo phiếu nhập kho, nhập hàng, upload hình ảnh biên lai và item.` }
];

const ROLE_TASKS = {
  ADMIN: 'Toàn quyền: xem, tạo, sửa, xóa, phê duyệt tất cả các bước.',
  CEO: 'Xem toàn bộ quy trình. Quản lý người dùng (thêm/sửa/vô hiệu).',
  WAREHOUSE: 'Tạo vận đơn → Xác nhận vận đơn → Tạo phiếu nhập kho → Nhập hàng.',
  ACCOUNTANT: 'Tạo đề nghị thanh toán → Phê duyệt L1 → Chi trả → Xác nhận TT.',
  CHIEF_ACCOUNTANT: `Giống ${R.ACCOUNTANT} + Kiểm tra kế toán.`,
  SALES: 'Lập kế hoạch tuần → Tạo đơn hàng (PO) → Tạo đề nghị thanh toán → Tạo vận đơn.',
  SALES_MANAGER: `Giống ${R.SALES} + Phê duyệt PO L1 + Phê duyệt kế hoạch tuần.`,
  PURCHASING: 'Lập kế hoạch tuần → Tạo đơn hàng (PO) → Tạo đề nghị thanh toán → Tạo vận đơn.'
};

function ProcessGuide() {
  const user = getUser();
  const role = user?.role || 'PENDING';
  const [tab, setTab] = useState('overview');

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Quy trình mua hàng</h1>
          <p className="page-subtitle">Sơ đồ quy trình nghiệp vụ hệ thống SGI Procurement</p>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab('overview')}>Tổng quan quy trình</button>
          <button className={`btn ${tab === 'myrole' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab('myrole')}>Quy trình của tôi</button>
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', padding: '24px 0' }}>
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div style={{
                    flex: 1, minWidth: 140, background: '#fff', borderRadius: 12, padding: 16,
                    border: `2px solid ${step.color}20`, textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{step.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: step.color, marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{step.desc}</div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#d1d5db', fontSize: 24, paddingTop: 20 }}>
                      →
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginTop: 16 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>Chi tiết các bước</h3>
              {STEPS.map(step => (
                <div key={step.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 24 }}>{step.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: step.color, marginBottom: 2 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'myrole' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 24, background: '#2563eb', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18
              }}>
                {(user?.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.username}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{ROLE_LABELS[role] || role}</div>
              </div>
            </div>

            <div style={{
              padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe',
              fontSize: 14, lineHeight: 1.6, marginBottom: 20
            }}>
              <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>Nhiệm vụ của bạn:</div>
              <div style={{ color: '#1e40af' }}>{ROLE_TASKS[role] || 'Chưa có thông tin cho vai trò này.'}</div>
            </div>

            <div>
              <h3 style={{ marginBottom: 12, fontSize: 15 }}>Các bước bạn có thể thực hiện:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STEPS
                  .filter(step => {
                    if (role === 'ADMIN' || role === 'CEO') return true;
                    if (role === 'WAREHOUSE') return ['waybill', 'warehouse-receipt'].includes(step.id);
                    if (role === 'ACCOUNTANT' || role === 'CHIEF_ACCOUNTANT') return ['payment-request'].includes(step.id);
                    if (role === 'SALES' || role === 'SALES_MANAGER' || role === 'PURCHASING') return ['weekly-plan', 'purchase-order', 'payment-request', 'waybill'].includes(step.id);
                    return false;
                  })
                  .map((step, idx) => (
                    <div key={step.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 14, background: step.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0
                      }}>{idx + 1}</div>
                      <div style={{ fontSize: 20 }}>{step.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: step.color }}>{step.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{step.desc}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessGuide;