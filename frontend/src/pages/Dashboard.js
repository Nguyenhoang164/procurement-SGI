import React from 'react';

function Dashboard() {
  const bars = [2, 3, 4, 5, 3, 6, 4, 7];
  const sources = [
    { label: 'Trung Quốc', value: 62, color: '#2563eb' },
    { label: 'PHI nội địa', value: 21, color: '#059669' },
    { label: 'Việt Nam', value: 11, color: '#d97706' },
    { label: 'Malaysia', value: 6, color: '#7c3aed' }
  ];

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Bảng điều khiển tổng quan</h1>
          <p className="page-subtitle">Bố cục và thông tin tổng quan theo prototype</p>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Đơn tháng này</div>
            <div className="stat-value" style={{ color: '#2563eb' }}>24</div>
            <div className="stat-sub">+3 so với tuần trước</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Đang vận chuyển</div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>7</div>
            <div className="stat-sub">Lô hàng đang trên đường</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tổng tiền hàng</div>
            <div className="stat-value" style={{ color: '#d97706' }}>4.2 tỷ</div>
            <div className="stat-sub">VNĐ - T5/2026</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Chờ phê duyệt</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>5</div>
            <div className="stat-sub">DNTT cần xử lý</div>
          </div>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <div className="surface-title">Xu hướng 8 tuần</div>
            <div className="mini-bars">
              {bars.map((value, index) => (
                <div
                  key={index}
                  className="mini-bar"
                  style={{ height: `${value * 9}px` }}
                />
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="surface-title">Theo nguồn nhập</div>
            <div className="source-list">
              {sources.map((item) => (
                <div className="source-row" key={item.label}>
                  <div className="source-meta">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="source-track">
                    <div
                      className="source-fill"
                      style={{ width: `${item.value}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <h2>Đơn hàng gần đây</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Mã đơn</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: 100 }}>Mã POS</th>
                  <th style={{ width: 90 }}>SL</th>
                  <th style={{ width: 140 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PO-2026-0024</td>
                  <td>Luxurious Tablecloths 60x80cm</td>
                  <td>TC-PH-0001</td>
                  <td>500</td>
                  <td><span className="badge badge-in_transit">Đang VC</span></td>
                </tr>
                <tr>
                  <td>PO-2026-0023</td>
                  <td>3-in-1 Wig Headband</td>
                  <td>WG-PH-0001</td>
                  <td>1,200</td>
                  <td><span className="badge badge-pending">Chờ duyệt L2</span></td>
                </tr>
                <tr>
                  <td>PO-2026-0022</td>
                  <td>Self-Locking Cabinet Hinges</td>
                  <td>HW-GL-0001</td>
                  <td>2,000</td>
                  <td><span className="badge badge-completed">Hoàn thành</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
