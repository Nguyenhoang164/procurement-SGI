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
    desc: `${R.SALES} lập kế hoạch nhập hàng theo tuần, trình duyệt. ${R.SALES_MANAGER} phê duyệt. ${R.PURCHASING} xem kế hoạch.` },
  { id: 'purchase-order', label: 'Đơn mua hàng', icon: '📄', color: '#059669',
    desc: `${R.SALES} tạo đơn hàng (PO) từ kế hoạch. ${R.SALES_MANAGER} phê duyệt L1. ${R.CEO} gửi kế toán. ${R.PURCHASING} xem đơn hàng.` },
  { id: 'payment-request', label: 'Đề nghị thanh toán', icon: '💰', color: '#d97706',
    desc: `${R.ACCOUNTANT}/${R.CHIEF_ACCOUNTANT}/${R.SALES}/${R.PURCHASING} tạo đề nghị thanh toán. ${R.ACCOUNTANT}/${R.CHIEF_ACCOUNTANT} duyệt L1, chi trả. ${R.CEO} duyệt L2.` },
  { id: 'waybill', label: 'Vận đơn', icon: '🚢', color: '#7c3aed',
    desc: `${R.WAREHOUSE}/${R.SALES}/${R.PURCHASING} tạo vận đơn theo lô hàng. ${R.WAREHOUSE} xác nhận khi hàng về.` },
  { id: 'warehouse-receipt', label: 'Nhập kho', icon: '📦', color: '#dc2626',
    desc: `${R.WAREHOUSE} tạo phiếu nhập kho, nhập hàng, upload hình ảnh biên lai và item.` }
];

const ROLE_DETAILS = {
  ADMIN: {
    desc: 'Quản trị hệ thống, không tham gia trực tiếp vào quy trình mua hàng.',
    functions: ['Quản lý người dùng (thêm, sửa, vô hiệu hóa tài khoản)', 'Cấu hình và bảo trì hệ thống', 'Theo dõi nhật ký hoạt động'],
    tasks: [
      { step: 'Quản lý người dùng', guide: 'Vào menu Quản trị → Người dùng. Điền username, email, chọn role, đặt trạng thái Active/Inactive.' },
      { step: 'Theo dõi hệ thống', guide: 'Kiểm tra nhật ký hoạt động, đảm bảo hệ thống vận hành ổn định.' }
    ]
  },
  CEO: {
    desc: 'Người quản lý cấp cao nhất, phê duyệt các bước quan trọng trong quy trình.',
    functions: ['Phê duyệt cấp cao (L2) cho đơn mua hàng và đề nghị thanh toán', 'Quản lý người dùng (thêm, sửa, vô hiệu hóa)', 'Xem toàn bộ quy trình mua hàng'],
    tasks: [
      { step: 'Đơn mua hàng (PO) — Gửi kế toán', guide: 'Sau khi Trưởng phòng KD duyệt L1, vào chi tiết đơn hàng → bấm "Gửi kế toán" để chuyển sang bộ phận kế toán xử lý.' },
      { step: 'Đề nghị thanh toán — Duyệt L2', guide: 'Vào chi tiết đề nghị thanh toán → xem thông tin → bấm "Duyệt" (L2) hoặc "Từ chối" kèm lý do.' },
      { step: 'Quản lý người dùng', guide: 'Vào menu Quản trị → Người dùng. Điền username, email, chọn role, trạng thái.' }
    ]
  },
  WAREHOUSE: {
    desc: 'Quản lý nhập hàng và tồn kho, đầu mối xử lý hàng về.',
    functions: ['Tạo và xác nhận vận đơn', 'Tạo phiếu nhập kho', 'Upload hình ảnh biên lai và hình ảnh item'],
    tasks: [
      { step: 'Tạo vận đơn', guide: 'Vào Vận đơn → "Thêm vận đơn". Chọn đơn hàng (PO), nhập thông tin vận chuyển, ngày gửi, hãng vận chuyển.' },
      { step: 'Xác nhận hàng về', guide: 'Tại danh sách vận đơn → chọn vận đơn đã gửi → bấm "Xác nhận" khi hàng về đến kho.' },
      { step: 'Tạo phiếu nhập kho', guide: 'Vào Nhập kho → "Thêm phiếu nhập". Chọn vận đơn đã xác nhận, nhập số lượng thực tế nhận được, upload ảnh biên lai và ảnh từng item.' }
    ]
  },
  ACCOUNTANT: {
    desc: 'Quản lý các nghiệp vụ thanh toán cho đơn hàng.',
    functions: ['Tạo đề nghị thanh toán từ PO', 'Phê duyệt L1 đề nghị thanh toán', 'Thực hiện chi trả và xác nhận thanh toán'],
    tasks: [
      { step: 'Tạo đề nghị thanh toán', guide: 'Vào Đề nghị thanh toán → "Thêm đề nghị". Chọn đơn hàng (PO), nhập số tiền, chọn loại thanh toán (Tạm ứng/Thanh toán/Đặt cọc), đính kèm chứng từ PDF.' },
      { step: 'Duyệt L1', guide: 'Tại danh sách đề nghị → bấm vào đề nghị → kiểm tra thông tin → bấm "Duyệt L1" hoặc "Từ chối".' },
      { step: 'Chi trả & Xác nhận TT', guide: 'Sau khi CEO duyệt L2 → bấm "Chi trả" → sau đó bấm "Xác nhận TT" để hoàn tất.' }
    ]
  },
  CHIEF_ACCOUNTANT: {
    desc: 'Quản lý cấp cao bộ phận kế toán, kiểm tra rà soát nghiệp vụ.',
    functions: ['Tất cả chức năng của Kế toán', 'Kiểm tra, rà soát các nghiệp vụ kế toán'],
    tasks: [
      { step: 'Tạo đề nghị thanh toán', guide: 'Vào Đề nghị thanh toán → "Thêm đề nghị". Chọn đơn hàng (PO), nhập số tiền, chọn loại thanh toán, đính kèm chứng từ.' },
      { step: 'Duyệt L1', guide: 'Kiểm tra thông tin đề nghị → bấm "Duyệt L1" hoặc "Từ chối".' },
      { step: 'Chi trả & Xác nhận TT', guide: 'Sau CEO duyệt L2 → "Chi trả" → "Xác nhận TT".' },
      { step: 'Kiểm tra kế toán', guide: 'Rà soát các phiếu chi, đối chiếu chứng từ, đảm bảo khớp đúng số liệu.' }
    ]
  },
  SALES: {
    desc: 'Người đề xuất nhu cầu nhập hàng, đầu mối tạo đơn hàng.',
    functions: ['Lập kế hoạch nhập hàng tuần', 'Tạo đơn hàng (PO) từ kế hoạch đã duyệt', 'Tạo đề nghị thanh toán', 'Tạo vận đơn theo lô hàng'],
    tasks: [
      { step: 'Kế hoạch tuần — Lập mới', guide: 'Vào Kế hoạch tuần → "Thêm kế hoạch". Dùng PosCodeSelector để tìm/chọn sản phẩm. Nhập: Tên SP, Loại SP (Mới/Cũ), Landing, Tuyến hàng, VC (AIR/SEA/LAND), Giá nhập TK, Currency, Mức ưu tiên, Link nguồn. Thêm biến thể & SL → "Lưu kế hoạch".' },
      { step: 'Kế hoạch tuần — Trình duyệt', guide: 'Sau khi lưu (DRAFT), bấm "Trình duyệt" để gửi lên Trưởng phòng KD phê duyệt.' },
      { step: 'Đơn hàng (PO)', guide: 'Vào Đơn hàng → "Thêm đơn hàng". Chọn nguồn từ Kế hoạch tuần đã duyệt. Chọn items, nhập đơn giá, chiết khấu, thuế, thời gian giao hàng, điều kiện TT.' },
      { step: 'Đề nghị thanh toán', guide: 'Vào Đề nghị thanh toán → "Thêm đề nghị". Chọn PO, nhập số tiền, loại TT, đính kèm chứng từ.' },
      { step: 'Vận đơn', guide: 'Vào Vận đơn → "Thêm vận đơn". Chọn PO, nhập thông tin vận chuyển.' }
    ]
  },
  SALES_MANAGER: {
    desc: 'Trưởng phòng kinh doanh, quản lý đội sales và phê duyệt cấp 1.',
    functions: ['Tất cả chức năng của Sales', 'Phê duyệt kế hoạch tuần (L1)', 'Phê duyệt đơn mua hàng (L1)'],
    tasks: [
      { step: 'Kế hoạch tuần — Lập mới', guide: 'Giống Sales: PosCodeSelector + nhập thông tin sản phẩm, biến thể, SL.' },
      { step: 'Kế hoạch tuần — Duyệt L1', guide: 'Vào danh sách kế hoạch → chọn kế hoạch chờ duyệt → bấm "Duyệt" (L1) hoặc "Từ chối".' },
      { step: 'Đơn hàng (PO) — Duyệt L1', guide: 'Vào danh sách đơn hàng → chọn đơn chờ duyệt → kiểm tra thông tin → bấm "Duyệt L1" hoặc "Từ chối".' },
      { step: 'Đơn hàng (PO) — Tạo mới', guide: 'Giống Sales: Chọn kế hoạch, chọn items, nhập giá, chiết khấu, thuế.' },
      { step: 'Đề nghị thanh toán / Vận đơn', guide: 'Giống Sales: tạo đề nghị TT từ PO, tạo vận đơn.' }
    ]
  },
  PURCHASING: {
    desc: 'Nhân viên mua hàng, theo dõi và hỗ trợ quá trình mua hàng.',
    functions: ['Xem kế hoạch nhập hàng tuần', 'Xem đơn hàng (PO)', 'Tạo đề nghị thanh toán', 'Tạo vận đơn'],
    tasks: [
      { step: 'Xem kế hoạch tuần', guide: 'Vào Kế hoạch tuần → danh sách các kế hoạch đã được phê duyệt. Xem thông tin để nắm nhu cầu nhập hàng.' },
      { step: 'Xem đơn hàng (PO)', guide: 'Vào Đơn hàng → danh sách PO đã duyệt. Theo dõi thông tin đơn hàng để phối hợp.' },
      { step: 'Đề nghị thanh toán', guide: 'Vào Đề nghị thanh toán → "Thêm đề nghị". Chọn PO, nhập số tiền, loại TT, đính kèm chứng từ.' },
      { step: 'Vận đơn', guide: 'Vào Vận đơn → "Thêm vận đơn". Chọn PO, nhập thông tin vận chuyển.' }
    ]
  }
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

            {ROLE_DETAILS[role] ? (
              <>
                <div style={{
                  padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe',
                  fontSize: 14, lineHeight: 1.6, marginBottom: 20
                }}>
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>Vai trò trong hệ thống:</div>
                  <div style={{ color: '#1e40af' }}>{ROLE_DETAILS[role].desc}</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 10 }}>Chức năng chính</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ROLE_DETAILS[role].functions.map((fn, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 13
                      }}>
                        <span style={{ color: '#059669', fontWeight: 700, width: 20 }}>✓</span>
                        {fn}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 15, marginBottom: 10 }}>Nhiệm vụ chi tiết & Hướng dẫn nhập liệu</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ROLE_DETAILS[role].tasks.map((t, i) => (
                      <div key={i} style={{
                        border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden'
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 14px', background: '#f1f5f9', fontWeight: 600, fontSize: 13,
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 11, background: '#2563eb', color: '#fff',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, flexShrink: 0
                          }}>{i + 1}</span>
                          {t.step}
                        </div>
                        <div style={{ padding: '10px 14px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                          {t.guide}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
                Chưa có thông tin cho vai trò này.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessGuide;