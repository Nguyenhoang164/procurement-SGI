import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Form.css';
import { bankAccountAPI } from '../services/api';

function BankAccountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [previewQr, setPreviewQr] = useState('');
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountHolder: '',
    bankName: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bankAccountAPI.getById(id)
      .then(data => {
        setFormData({
          accountNumber: data.accountNumber || '',
          accountHolder: data.accountHolder || '',
          bankName: data.bankName || ''
        });
        if (data.qrCode) setPreviewQr(data.qrCode);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewQr(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountNumber.trim()) { setError('Vui lòng nhập số tài khoản.'); return; }
    if (!formData.accountHolder.trim()) { setError('Vui lòng nhập tên chủ tài khoản.'); return; }
    if (!formData.bankName.trim()) { setError('Vui lòng nhập tên ngân hàng.'); return; }

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        createdBy: user?.username
      };

      let accountId = id;
      if (isEdit) {
        await bankAccountAPI.update(id, payload);
        accountId = id;
      } else {
        const created = await bankAccountAPI.create(payload);
        accountId = created.id;
      }

      if (qrFile) {
        await bankAccountAPI.uploadQrCode(accountId, qrFile);
      }

      navigate('/bank-accounts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-screen">
      <div className="page-topbar">
        <div className="page-title-group">
          <h1 className="page-title">{isEdit ? 'Cập nhật tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}</h1>
          <p className="page-subtitle">Thông tin tài khoản thụ hưởng để chuyển khoản</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/bank-accounts')}>Hủy</button>
        </div>
      </div>

      <div className="page-content">
        {error ? <div className="error-message">{error}</div> : null}

        <form className="app-form" onSubmit={handleSubmit}>
          <fieldset disabled={loading}>
            <legend>Thông tin tài khoản</legend>

            <div className="form-group">
              <label htmlFor="accountNumber">Số tài khoản *</label>
              <input id="accountNumber" name="accountNumber" value={formData.accountNumber}
                onChange={handleChange} placeholder="VD: 1234567890" required />
            </div>

            <div className="form-group">
              <label htmlFor="accountHolder">Tên chủ tài khoản *</label>
              <input id="accountHolder" name="accountHolder" value={formData.accountHolder}
                onChange={handleChange} placeholder="VD: NGUYEN VAN A" required />
            </div>

            <div className="form-group">
              <label htmlFor="bankName">Tên ngân hàng *</label>
              <input id="bankName" name="bankName" value={formData.bankName}
                onChange={handleChange} placeholder="VD: Vietcombank - Chi nhánh Hoàn Kiếm" required />
            </div>

            <div className="form-group">
              <label>Mã QR chuyển khoản</label>
              <input type="file" accept="image/*" onChange={handleQrFileChange} />
              <p className="muted-copy" style={{ marginTop: 4 }}>Tải lên ảnh mã QR để thuận tiện cho việc chuyển khoản</p>
              {previewQr && (
                <div style={{ marginTop: 8 }}>
                  <img src={previewQr.startsWith('data:') ? previewQr : (qrFile ? previewQr : `/api${previewQr}`)}
                    alt="QR preview" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm tài khoản'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default BankAccountForm;
