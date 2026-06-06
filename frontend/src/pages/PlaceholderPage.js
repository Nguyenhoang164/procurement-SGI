import React from 'react';

function PlaceholderPage({ title, subtitle, cards = [], rows = [] }) {
  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
      </div>

      <div className="page-content">
        {cards.length > 0 ? (
          <div className="stats-grid">
            {cards.map((card) => (
              <div className="stat-card" key={card.label}>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
                {card.sub ? <div className="stat-sub">{card.sub}</div> : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="surface-card">
          <div className="surface-title">Thông tin</div>
          <p className="muted-copy" style={{ marginBottom: rows.length ? 16 : 0 }}>
            Màn này đã được đưa vào đúng cấu trúc giao diện theo prototype và có thể nối tiếp dữ liệu thật sau.
          </p>
          {rows.length > 0 ? (
            <div className="info-list">
              {rows.map((row) => (
                <div className="info-row" key={row.label}>
                  <span className="label">{row.label}</span>
                  <span className="value">{row.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
