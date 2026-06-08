import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';
import { bankAccountAPI, resolveFileUrl } from '../services/api';
import { canCrudBankAccount, canDeleteBankAccount, getUser } from '../utils/permissions';

function BankAccountList() {
  const navigate = useNavigate();
  const user = getUser();
  const canCrud = canCrudBankAccount(user);
  const canDelete = canDeleteBankAccount(user);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await bankAccountAPI.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa tài khoản ngân hàng này?')) return;
    try {
      await bankAccountAPI.delete(id);
      fetchAccounts();
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">Danh sách tài khoản ngân hàng</h1>
          <p className="page-subtitle">Quản lý tài khoản thụ hưởng để chuyển khoản</p>
        </div>
        <div className="page-actions">
          {canCrud && (
            <button className="btn btn-primary" onClick={() => navigate('/bank-accounts/new')}>
              + Thêm tài khoản
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Số tài khoản</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Chủ tài khoản</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Ngân hàng</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Mã QR</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>{acc.accountNumber}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{acc.accountHolder}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{acc.bankName}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                    {acc.qrCode ? (
                      <img src={resolveFileUrl(acc.qrCode)} alt="QR" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 4 }} />
                    ) : (
                      <span className="muted-copy">—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                    {canCrud && (
                      <button className="btn btn-secondary" style={{ marginRight: 8 }}
                        onClick={() => navigate(`/bank-accounts/edit/${acc.id}`)}>Sửa</button>
                    )}
                    {canDelete && (
                      <button className="btn btn-danger" onClick={() => handleDelete(acc.id)}>Xóa</button>
                    )}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                    Chưa có tài khoản ngân hàng nào
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

export default BankAccountList;
