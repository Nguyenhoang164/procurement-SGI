import React, { useEffect, useState } from 'react';
import '../styles/Form.css';
import { exchangeRateAPI } from '../services/api';

function ExchangeRateConfig() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editCurrency, setEditCurrency] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [newRate, setNewRate] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await exchangeRateAPI.getAll();
      setRates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAdd = async () => {
    if (!newCurrency || !newRate) return;
    try {
      await exchangeRateAPI.save(newCurrency, { currency: newCurrency, rate: parseFloat(newRate) });
      setNewCurrency('');
      setNewRate('');
      fetchRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (currency) => {
    try {
      await exchangeRateAPI.save(currency, { currency, rate: parseFloat(editValue) });
      setEditCurrency(null);
      setEditValue('');
      fetchRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNumberBeforeInput = (e) => {
    if (e.data === null) return;
    if (e.data === '.' || e.data === ',') return;
    if (/^[0-9]$/.test(e.data)) return;
    e.preventDefault();
  };

  const handleNumberPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/^-?\d*\.?\d*$/.test(text)) {
      e.preventDefault();
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Cấu hình tỷ giá</h1>
          <p className="page-subtitle">Quản lý tỷ giá quy đổi tiền tệ sang VND</p>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Thêm loại tiền tệ</label>
            <input value={newCurrency} onChange={e => setNewCurrency(e.target.value.toUpperCase())}
              placeholder="VD: PHP" maxLength={10}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Tỷ giá (1 {newCurrency || 'X'} = ? VND)</label>
            <input type="number" step="0.0001" value={newRate} onChange={e => setNewRate(e.target.value)}
              placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!newCurrency || !newRate}
            style={{ height: 40, whiteSpace: 'nowrap' }}>Thêm</button>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Loại tiền tệ</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Tỷ giá (VND)</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{r.currency}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                    {editCurrency === r.currency ? (
                      <input
                        type="number"
                        step="0.0001"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBeforeInput={handleNumberBeforeInput}
                        onPaste={handleNumberPaste}
                        style={{ width: 160, textAlign: 'right' }}
                      />
                    ) : (
                      <span>{Number(r.rate).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                    {editCurrency === r.currency ? (
                      <>
                        <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleSave(r.currency)}>Lưu</button>
                        <button className="btn btn-secondary" onClick={() => { setEditCurrency(null); setEditValue(''); }}>Hủy</button>
                      </>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => { setEditCurrency(r.currency); setEditValue(String(r.rate)); }}>
                        Sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có cấu hình tỷ giá nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ExchangeRateConfig;
