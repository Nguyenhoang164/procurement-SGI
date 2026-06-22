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
      { step: 'Quản lý người dùng', guide: 'Vào menu Quản trị → Người dùng. Điền username, chọn role (xem danh sách role ở dưới), đặt trạng thái Active/Inactive. Lưu ý: Username không được trùng.' },
      { step: 'Theo dõi hệ thống', guide: 'Kiểm tra nhật ký hoạt động (nếu có), đảm bảo hệ thống vận hành ổn định. Báo cáo lỗi cho bộ phận kỹ thuật nếu phát hiện bất thường.' }
    ]
  },
  CEO: {
    desc: 'Người quản lý cấp cao nhất, phê duyệt các bước quan trọng trong quy trình.',
    functions: ['Phê duyệt cấp cao (L2) cho đơn mua hàng và đề nghị thanh toán', 'Quản lý người dùng (thêm, sửa, vô hiệu hóa)', 'Xem toàn bộ quy trình mua hàng'],
    tasks: [
      { step: 'Quản lý người dùng', guide: 'Vào menu Quản trị → Người dùng → "Thêm người dùng". Nhập username, mật khẩu (tự tạo), chọn role phù hợp. Có thể vô hiệu hóa tài khoản bằng cách chuyển trạng thái Inactive. Lưu ý: Username phải là duy nhất.' },
      { step: 'Đơn mua hàng (PO) — Gửi kế toán', guide: 'Sau khi Trưởng phòng KD duyệt L1 (PO ở trạng thái APPROVED):\n→ Vào danh sách Đơn hàng → chọn PO cần xử lý.\n→ Xem chi tiết PO, kiểm tra thông tin.\n→ Bấm "Gửi kế toán" để chuyển PO sang bộ phận kế toán.\n→ Kế toán nhận được và tiến hành tạo DNTT thanh toán.' },
      { step: 'Đề nghị thanh toán — Duyệt L2', guide: 'Vào danh sách Đề nghị thanh toán → lọc DNTT có trạng thái PENDING_L2.\n→ Bấm vào DNTT để xem chi tiết:\n  - Kiểm tra số tiền, PO liên quan, chứng từ kèm theo.\n  - Xem lịch sử duyệt L1 (ai duyệt, khi nào).\n→ Bấm "Duyệt" (L2) để phê duyệt, hoặc "Từ chối" kèm lý do.\n→ Sau khi duyệt L2, DNTT chuyển sang APPROVED — kế toán có thể chi trả.' }
    ]
  },
  WAREHOUSE: {
    desc: 'Quản lý nhập hàng và tồn kho, đầu mối xử lý hàng về.',
    functions: ['Tạo và xác nhận vận đơn', 'Tạo phiếu nhập kho', 'Upload hình ảnh biên lai và hình ảnh item'],
    tasks: [
      {
        step: 'Tạo vận đơn (Waybill)',
        guide: `Vào menu "Vận đơn" → "Thêm vận đơn".

Các trường nhập:
• Mã vận đơn (bắt buộc): VD: DHL123456, FedEx789, mã do hãng VC cung cấp.
• Đơn vị vận chuyển (bắt buộc): Tên hãng VC (DHL, FedEx, đường biển...).
• Trạng thái: Chờ VC / Đang VC / Đã giao / Đã hủy.
• Địa chỉ gửi: Nơi đi (VD: Quảng Châu, Trung Quốc).
• Địa chỉ nhận: Nơi đến (VD: Kho SGI Hà Nội).
• Tổng số kiện (tự động tính): Tổng các kiện hàng từ các sản phẩm.
• Tổng cước VC (tự động tính): Dựa trên KL × Đơn giá VC × tỷ giá.
• SL thực tế: Nhập khi hàng về đến kho.

Chọn sản phẩm từ đơn hàng:
→ Bước 1: Chọn PO từ danh sách (có thể chọn nhiều PO để gộp).
→ Bước 2: Tích chọn sản phẩm cần gửi trong vận đơn.
→ Bước 3: Bấm "ADD (N) sản phẩm vào vận đơn".
→ Bước 4: Nhập KL (thể tích) + Đơn giá VC + Số kiện cho từng SP.
  - KL/Thể tích: Số kg hoặc m³ của SP đó trong lô hàng.
  - Đơn giá VC: Giá VC tính trên 1 đơn vị KL (VD: 5 CNY/kg).
  - Số kiện: Số thùng/kiện của SP đó.

Ghi chú: Nhập ghi chú vận đơn → "Tạo vận đơn".`
      },
      {
        step: 'Xác nhận hàng về',
        guide: `Tại danh sách Vận đơn:
→ Chọn vận đơn có trạng thái "Đang vận chuyển" (IN_TRANSIT).
→ Bấm vào chi tiết → bấm nút "Xác nhận" (hoặc chuyển trạng thái thành DELIVERED).
→ Hệ thống ghi nhận hàng đã về kho.
→ Hàng về → Có thể tiến hành nhập kho (kiểm đếm).

Lưu ý: Chỉ xác nhận khi hàng đã thực sự về đến kho.`
      },
      {
        step: 'Nhập kho — Kiểm đếm & Nhận hàng',
        guide: `Vào menu "Nhập hàng & Kiểm đếm" (Warehouse).

Bước 1: Xem danh sách lô hàng chờ nhập.
→ Hệ thống hiển thị các lô hàng đã có vận đơn DELIVERED.
→ Cột "SL còn lại": số lượng chưa nhập kho.

Bước 2: Bấm "Nhận hàng" trên lô cần nhập.
→ Modal nhập kho hiện lên với thông tin đối chiếu:
  - Vận đơn, SL theo vận đơn, Mã PO, SL theo đơn, SL đã nhận, SL còn lại.

Bước 3: Nhập số lượng & tình trạng từng sản phẩm:
→ Nếu SP có biến thể: nhập số lượng thực nhận cho từng biến thể.
→ Nếu SP không biến thể: nhập SL thực tế + chọn tình trạng:
  - "Nguyên vẹn" / "Móp méo" / "Thiếu hàng" / "Hỏng hóc".
→ Nhập ghi chú tình trạng nếu cần.

Bước 4: Upload ảnh (tối đa 3 ảnh, tổng < 20MB):
→ Ảnh lô hàng (biên lai, chứng từ).
→ Ảnh từng sản phẩm (chụp thực tế hàng nhận được).
  - Nếu SP có biến thể: có thể upload ảnh riêng cho từng biến thể.

Bước 5: Nhập người kiểm → "Xác nhận nhận hàng".

Lưu ý quan trọng:
- SL nhập không được vượt quá SL còn lại.
- Upload ảnh là bắt buộc để minh chứng hàng thực tế.
- Sau khi nhập kho, hệ thống tự động cập nhật tồn kho.`
      },
    ]
  },
  ACCOUNTANT: {
    desc: 'Quản lý các nghiệp vụ thanh toán cho đơn hàng.',
    functions: ['Tạo đề nghị thanh toán từ PO', 'Phê duyệt L1 đề nghị thanh toán', 'Thực hiện chi trả và xác nhận thanh toán'],
    tasks: [
      {
        step: 'Tạo đề nghị thanh toán',
        guide: `Vào menu "Đề nghị thanh toán" → "Thêm đề nghị".

Chi tiết các trường:
• Loại thanh toán: MUA_HANG (thanh toán tiền hàng cho nhà cung cấp) / VAN_CHUYEN (cước vận chuyển).
• Nếu MUA_HANG:
  - Chọn đơn hàng (PO): Chọn PO đã được duyệt từ danh sách. Có thể chọn nhiều PO.
  - Mỗi PO hiển thị chi tiết: tiền hàng, VC nội địa, cước VC QT, phí đặt hàng, ship nội địa.
  - Loại tiền tệ + Số tiền: tự động gợi ý từ PO, có thể sửa.
  - Biểu mẫu giấy: chọn "Thanh toán" / "Hoàn ứng", nhập phòng ban, lý do TT (bắt buộc).
  - Tài khoản NH: chọn từ danh sách đã lưu hoặc nhập mới (số TK + chủ TK + tên NH).
  - Chênh lệch tỷ giá: tra cứu DNTT trước để lấy chênh lệch.
  - Chi phí phát sinh: thêm tên phí + số tiền nếu có.
• Nếu VAN_CHUYEN: Chọn vận đơn → tự động load sản phẩm + tính tổng cước.
• File đính kèm: Tối đa 8 file (ảnh, PDF, DOC, XLS).

Yêu cầu đặc biệt:
- Bắt buộc chọn ít nhất 1 PO (nếu MUA_HANG).
- Số tiền phải > 0.
- Lý do thanh toán không được để trống.
- Sau khi tạo, DNTT ở trạng thái PENDING_L1 — chờ duyệt.`
      },
      {
        step: 'Duyệt L1',
        guide: `Vào danh sách Đề nghị thanh toán → bấm vào DNTT có trạng thái PENDING_L1.
→ Xem chi tiết: loại TT, PO liên quan, số tiền, lý do, tài khoản NH, chứng từ.
→ Kiểm tra tính hợp lệ của số tiền và chứng từ.
→ Bấm "Duyệt L1" để duyệt cấp 1 → chuyển lên CEO duyệt L2.
→ Bấm "Từ chối" kèm lý do nếu thông tin sai.

Lưu ý: Sau khi duyệt L1, DNTT chuyển sang PENDING_L2. CEO sẽ xem xét và duyệt L2.`
      },
      {
        step: 'Chi trả & Xác nhận TT',
        guide: `Sau khi CEO duyệt L2, DNTT chuyển sang trạng thái APPROVED.

QUY TRÌNH CHI TRẢ:
→ Vào chi tiết DNTT → bấm "Chi trả".
  - Hệ thống ghi nhận đã thực hiện chuyển khoản.
  - DNTT chuyển sang trạng thái PAYING (đang chi trả).
→ Bấm "Xác nhận TT" sau khi đã nhận được xác nhận từ ngân hàng.
  - DNTT chuyển sang PAID (hoàn tất).
  - Cập nhật trạng thái thanh toán trên PO và Waybill (nếu có).

Yêu cầu: Chỉ bấm "Xác nhận TT" khi tiền đã thực sự đến tài khoản người thụ hưởng.`
      },
    ]
  },
  CHIEF_ACCOUNTANT: {
    desc: 'Quản lý cấp cao bộ phận kế toán, kiểm tra rà soát nghiệp vụ.',
    functions: ['Tất cả chức năng của Kế toán', 'Kiểm tra, rà soát các nghiệp vụ kế toán'],
    tasks: [
      {
        step: 'Tạo đề nghị thanh toán',
        guide: `Giống hướng dẫn của Kế toán (xem tab Kế toán).
→ Vào "Đề nghị thanh toán" → "Thêm đề nghị".
→ Chọn PO, nhập số tiền, loại TT, tài khoản NH, lý do, đính kèm chứng từ.`
      },
      {
        step: 'Duyệt L1',
        guide: `Vào danh sách DNTT → chọn DNTT PENDING_L1.
→ Rà soát kỹ: số tiền khớp với PO? Chứng từ hợp lệ? Tài khoản NH chính xác?
→ Bấm "Duyệt L1" hoặc "Từ chối".

Vai trò KT trưởng: Kiểm tra kỹ hơn về mặt đối chiếu chứng từ và tính hợp lệ.`
      },
      {
        step: 'Chi trả & Xác nhận TT',
        guide: `Sau CEO duyệt L2 (APPROVED):
→ Vào chi tiết DNTT → "Chi trả" → chuyển PAYING.
→ Sau khi NH xác nhận → "Xác nhận TT" → chuyển PAID.`
      },
      {
        step: 'Kiểm tra kế toán (soát xét)',
        guide: `Rà soát định kỳ các nghiệp vụ kế toán:
→ Vào danh sách Đề nghị thanh toán → lọc DNTT đã PAID.
→ Kiểm tra: số tiền khớp với chứng từ gốc? Kiểm tra tỷ giá quy đổi?
→ Đối chiếu PO — DNTT — Waybill — Nhập kho: đảm bảo số liệu đồng bộ.
→ Xem báo cáo tổng hợp nếu cần.

Lưu ý: KT trưởng có thể xem tất cả DNTT của mọi phòng ban.`
      },
    ]
  },
  SALES: {
    desc: 'Người đề xuất nhu cầu nhập hàng, đầu mối tạo đơn hàng.',
    functions: ['Lập kế hoạch nhập hàng tuần', 'Tạo đơn hàng (PO) từ kế hoạch đã duyệt', 'Tạo đề nghị thanh toán', 'Tạo vận đơn theo lô hàng'],
    tasks: [
      {
        step: 'Kế hoạch tuần — Lập mới',
        guide: `Vào menu "Kế hoạch tuần" → "Thêm kế hoạch".

Các trường nhập liệu chi tiết:
• Chọn sản phẩm (bắt buộc): Dùng ô tìm kiếm (PosCodeSelector) để tra cứu sản phẩm đã có trong hệ thống. Nếu là SP mới, nhập trực tiếp tên và mã POS.
• Tên sản phẩm (bắt buộc): Nhập tên tiếng Việt đầy đủ của sản phẩm.
• Loại SP: "Hàng mới" (NEW) = chưa từng nhập khẩu; "Hàng cũ" (USED) = đã từng nhập trước đây.
• Landing page: Link sản phẩm trên website bán hàng (Shopee, Tiki, Facebook...) để đối chiếu thông tin sau này.
• Tuyến hàng: Chọn tuyến vận chuyển từ nước ngoài về kho Việt Nam (d/s được quản trị viên cấu hình sẵn).
• Hình thức VC: AIR (hàng không) / SEA (đường biển) / LAND (đường bộ) / AIR PHI / Đi hàng.
• Giá nhập tham khảo: Giá từ nhà cung cấp (có thể lấy từ báo giá, đơn cũ). Chọn loại tiền tệ tương ứng (CNY, USD, VND...).
• Mức độ ưu tiên: "Cao" = nhập gấp, "Trung bình" = nhập trong tháng, "Thấp" = có thể chờ.
• Link nguồn: URL sản phẩm trên trang thương mại điện tử (Taobao, 1688, Alibaba...).
• Biến thể & Số lượng (bắt buộc): Khai báo biến thể (size/màu sắc/phiên bản) và số lượng tương ứng. Bấm "+ Thêm biến thể" nếu có nhiều loại.

Yêu cầu đặc biệt:
- Phải thêm ít nhất 1 sản phẩm vào danh sách trước khi lưu.
- SL đề xuất tự động tính tổng từ các biến thể.
- Sau khi lưu (trạng thái DRAFT), vào chi tiết KH tuần → bấm "Trình duyệt" để gửi duyệt.`
      },
      {
        step: 'Kế hoạch tuần — Trình duyệt',
        guide: `Sau khi lưu KH tuần (trạng thái DRAFT):
→ Vào danh sách Kế hoạch tuần → chọn phiếu KH vừa tạo.
→ Bấm nút "Trình duyệt" ở góc phải (hoặc trong chi tiết).
→ Hệ thống chuyển trạng thái thành PENDING và gửi thông báo cho Trưởng phòng KD.

Lưu ý: Chỉ có thể trình duyệt nếu KH tuần đang ở trạng thái DRAFT. Sau khi trình duyệt, không thể sửa — muốn sửa phải chờ bị từ chối.`
      },
      {
        step: 'Đơn hàng (PO) — Tạo mới',
        guide: `Vào menu "Đơn hàng" → "Thêm đơn hàng".
Có thể tạo từ Kế hoạch tuần đã duyệt: tại danh sách KH tuần, bấm "Tạo PO" để tự động copy thông tin.

Các trường nhập chi tiết:
PHẦN 1 — NHẬP THÔNG TIN SẢN PHẨM:
• Chọn sản phẩm (bắt buộc): Tra cứu sản phẩm. Khi chọn, thông tin giá vốn TB & giá vốn gần nhất tự động hiện (nếu SP đã có).
• Tên sản phẩm (bắt buộc): Tên in trên đơn hàng.
• Đơn giá (bắt buộc): Giá theo từng đơn vị sản phẩm, chọn đúng tiền tệ giao dịch.
• Tiền tệ: CNY/USD/VND — tự động gợi ý tỷ giá tương ứng.
• Tỷ giá: Mặc định theo hệ thống, có thể sửa tay nếu cần.
• Biến thể & SL: Giống KH tuần — thêm biến thể và số lượng.
• Nguồn nhập: Trung Quốc (mặc định) / Việt Nam / Khác.
• Hình thức VC: Chọn phương thức vận chuyển quốc tế (SEA PHI, AIR PHI, SEA MALAY...).
• Ưu tiên: Thường / Cao / Khẩn cấp.
• Quy cách: Mô tả quy cách đóng gói (VD: "Hộp 10 cái", "Thùng 50 cái").

Giá vốn tham khảo (tự động hiện nếu SP đã có trong hệ thống):
• Giá vốn trung bình (VNĐ): Bình quân từ các đơn hàng trước.
• Giá vốn gần nhất + Mã đơn gần nhất + Ngày gần nhất.

PHẦN 2 — THÔNG TIN CHUNG:
• Nhà cung cấp: Tên nhà cung cấp nước ngoài.
• Ngày đặt hàng: Chọn ngày tạo PO.
• Landing page: Link tham khảo (không bắt buộc).
• Phòng ban thực hiện: Tự động nếu tạo từ kế hoạch.
• Nguồn kế hoạch: Hiển thị mã KH đã duyệt nếu tạo từ kế hoạch.

PHẦN 3 — CHI PHÍ (CHỈ HIỆN KHI TRẠNG THÁI IN_TRANSIT):
• VC nội địa (VNĐ): Chi phí vận chuyển trong nước.
• Đơn giá VC QT (đ/kg): Giá vận chuyển quốc tế theo kg.
• Khối lượng / Thể tích: Cân nặng hoặc thể tích lô hàng.
• Phí đặt hàng: Phí dịch vụ đặt hàng.
• Phí giao hàng địa phương: Ship từ cảng/bưu cục về kho.
• Ngày TT cước VC: Ngày thanh toán cước vận chuyển.

TỔNG HỢP & GIÁ VỐN:
• Tổng tiền lô (VNĐ): Tự động tính.
• GV đầy đủ 1 SP: Tổng tiền / số lượng.
• Phương thức thanh toán: CNY qua CK bank / USD qua CK bank / VND.
• Đã cọc / Còn phải TT: Nhập số tiền đã cọc (nếu có), tự động tính còn lại.

GHI CHÚ: Nhập ghi chú chung cho đơn hàng.`
      },
      {
        step: 'Đơn hàng (PO) — Trình duyệt & gửi kế toán',
        guide: `Sau khi tạo PO thành công:
→ Vào danh sách Đơn hàng → chọn PO cần duyệt.
→ Người tạo: bấm "Trình duyệt" để gửi lên Trưởng phòng KD (L1).
→ Sau khi duyệt L1, CEO vào chi tiết → bấm "Gửi kế toán".
→ Kế toán nhận được và xử lý thanh toán.

Trạng thái PO: DRAFT → PENDING_L1 → APPROVED (hoặc REJECTED) → ...`
      },
      {
        step: 'Đề nghị thanh toán',
        guide: `Vào menu "Đề nghị thanh toán" → "Thêm đề nghị".

Hai loại thanh toán:

LOẠI 1 — MUA_HÀNG (Thanh toán tiền hàng):
• Chọn đơn hàng (PO): Chọn từ danh sách PO đã được phê duyệt. Có thể chọn nhiều PO cùng lúc.
  - Mỗi PO hiển thị: Tiền hàng + VC nội địa + Cước VC QT + Phí đặt hàng + Ship nội địa.
  - Nếu chọn nhiều PO, tổng tự động tính.
• Loại tiền tệ: VND (mặc định) / USD / CNY.
• Số tiền (bắt buộc): Tự động gợi ý từ các PO đã chọn, có thể sửa tay.
• Biểu mẫu giấy đề nghị TT:
  - Loại phiếu: "Thanh toán" (thường) / "Hoàn ứng" (hoàn lại tiền tạm ứng).
  - Phòng ban / Bộ phận: Nhập tên phòng ban (VD: Kinh doanh).
  - Số tiền tạm ứng (nếu có): Nhập nếu đã tạm ứng trước đó.
  - Số tiền đã chi (nếu có): Nhập nếu đã chi tiêu một phần.
  - Lý do thanh toán (bắt buộc): Mô tả nội dung/nhập lý do thanh toán.
• Thông tin tài khoản chuyển khoản:
  - Chọn tài khoản có sẵn (đã lưu trong hệ thống) HOẶC nhập tài khoản mới.
  - Số tài khoản, Chủ TK, Ngân hàng + QR Code (ảnh).
• Chênh lệch tỷ giá & CP phát sinh (Mở rộng):
  - TK chênh lệch TG tham chiếu: Nhập mã DNTT trước đó để tra cứu chênh lệch tỷ giá.
  - Chênh lệch TG (VNĐ): Nhập số tiền chênh lệch.
  - Phí vận chuyển bổ sung.
  - Chi phí phát sinh khác: "Thêm chi phí" → nhập tên phí + số tiền.
• File đính kèm: Tối đa 8 file (hỗ trợ ảnh, PDF, DOC, XLS).

LOẠI 2 — VẬN_CHUYỂN (Thanh toán cước vận chuyển):
• Chọn Vận đơn: Chọn từ danh sách waybill → tự động load sản phẩm của vận đơn đó.
• Sản phẩm từ vận đơn tự động được thêm vào danh sách bên dưới.
• Hoặc mở rộng "Chọn từ DNTT Mua hàng đã thanh toán" để chọn sản phẩm từ DNTT trước.
• Tổng phí vận chuyển tự động tính từ các sản phẩm.

SAU KHI LƯU: Trạng thái ban đầu là PENDING_L1 — trình kế toán duyệt.`
      },
      {
        step: 'Vận đơn (Waybill)',
        guide: `Vào menu "Vận đơn" → "Thêm vận đơn".

Các trường nhập:
• Mã vận đơn (bắt buộc): Mã do hãng vận chuyển cung cấp (VD: DHL123456).
• Đơn vị vận chuyển (bắt buộc): Tên hãng vận chuyển (DHL, FedEx, đường biển...).
• Trạng thái: Chờ VC / Đang VC / Đã giao / Đã hủy.
• Địa chỉ gửi: Nơi xuất phát (VD: Quảng Châu, Trung Quốc).
• Địa chỉ nhận: Nơi giao hàng (VD: Kho Hà Nội).
• Tổng số kiện: Tự động tính từ các sản phẩm.
• Tổng cước VC (VNĐ): Tự động tính (KL × Đơn giá VC × Tỷ giá).
• SL thực tế: Nhập tay khi hàng về.

Chọn đơn hàng (PO) và sản phẩm:
• Chọn đơn hàng từ danh sách PO đã duyệt.
• Tích chọn các sản phẩm muốn gộp vào vận đơn (hỗ trợ gộp nhiều PO).
• Nhập KL/thể tích + Đơn giá VC + Số kiện cho từng sản phẩm.

Ghi chú: Nhập ghi chú nếu cần.`
      },
    ]
  },
  SALES_MANAGER: {
    desc: 'Trưởng phòng kinh doanh, quản lý đội sales và phê duyệt cấp 1.',
    functions: ['Tất cả chức năng của Sales', 'Phê duyệt kế hoạch tuần (L1)', 'Phê duyệt đơn mua hàng (L1)'],
    tasks: [
      {
        step: 'Kế hoạch tuần — Lập mới',
        guide: `Giống hướng dẫn của Sales (xem tab Sales):
→ Vào Kế hoạch tuần → "Thêm kế hoạch".
→ PosCodeSelector tìm/chọn sản phẩm; nhập tên SP, loại (Mới/Cũ), landing, tuyến hàng, VC, giá TK, tiền tệ, ưu tiên, link nguồn.
→ Thêm biến thể & số lượng → "Thêm vào danh sách" → "Lưu kế hoạch".`
      },
      {
        step: 'Kế hoạch tuần — Duyệt L1',
        guide: `Vào menu "Kế hoạch tuần" → danh sách.
→ Lọc/bấm vào phiếu có trạng thái PENDING (chờ duyệt).
→ Xem chi tiết từng sản phẩm: kiểm tra tên, giá, số lượng, biến thể.
→ Bấm "Duyệt" (L1) để phê duyệt, hoặc "Từ chối" kèm lý do.

Nguyên tắc duyệt: Chỉ duyệt nếu thông tin sản phẩm, giá cả và số lượng chính xác. Nếu thiếu thông tin, từ chối và yêu cầu bổ sung.`
      },
      {
        step: 'Đơn hàng (PO) — Duyệt L1',
        guide: `Vào menu "Đơn hàng" → danh sách PO.
→ Lọc PO có trạng thái PENDING_L1 (chờ duyệt cấp 1).
→ Bấm vào PO để xem chi tiết:
  - Kiểm tra danh sách sản phẩm, đơn giá, tiền tệ, tỷ giá.
  - Kiểm tra thông tin chung: nhà cung cấp, ngày đặt, phòng ban.
  - Kiểm tra tổng tiền lô, giá vốn.
→ Nhấn "Duyệt L1" hoặc "Từ chối" kèm lý do.

Lưu ý: Sau khi duyệt L1, PO chuyển sang trạng thái APPROVED — CEO có thể gửi cho kế toán.`
      },
      {
        step: 'Đơn hàng (PO) — Tạo mới',
        guide: `Vào "Đơn hàng" → "Thêm đơn hàng".
→ Chọn nguồn từ Kế hoạch tuần đã duyệt hoặc tạo mới hoàn toàn.
→ Nhập thông tin sản phẩm: tên, SL, đơn giá, tiền tệ, tỷ giá, nguồn nhập, hình thức VC, quy cách.
→ Thêm vào danh sách → nhập thông tin chung (nhà cung cấp, ngày đặt, landing, phòng ban).
→ Lưu đơn → tự động gửi duyệt L1 lên Trưởng phòng KD (nếu là SM, có thể tự duyệt L1).`
      },
      {
        step: 'Đề nghị thanh toán — Lập mới',
        guide: `Vào "Đề nghị thanh toán" → "Thêm đề nghị".
→ Chọn loại: MUA_HANG (thanh toán tiền hàng) hoặc VAN_CHUYEN (cước vận chuyển).
→ MUA_HANG: Chọn PO đã duyệt → nhập số tiền → lý do TT → chọn tài khoản NH → đính kèm chứng từ.
→ VAN_CHUYEN: Chọn vận đơn → sản phẩm tự động load → kiểm tra tổng phí.
→ Chi tiết các trường xem ở tab Sales (giống nhau).`
      },
      {
        step: 'Vận đơn (Waybill)',
        guide: `Vào "Vận đơn" → "Thêm vận đơn".
→ Nhập mã vận đơn, hãng VC, trạng thái, địa chỉ.
→ Chọn PO → tích sản phẩm → ADD vào vận đơn.
→ Nhập KL (thể tích) + Đơn giá VC + Số kiện cho từng SP.
→ Tổng cước tự động tính.
→ Lưu ý: Có thể gộp nhiều PO vào một vận đơn.`
      },
    ]
  },
  PURCHASING: {
    desc: 'Nhân viên mua hàng, theo dõi và hỗ trợ quá trình mua hàng.',
    functions: ['Xem kế hoạch nhập hàng tuần', 'Xem đơn hàng (PO)', 'Tạo đề nghị thanh toán', 'Tạo vận đơn'],
    tasks: [
      {
        step: 'Xem kế hoạch tuần',
        guide: `Vào menu "Kế hoạch tuần" → xem danh sách các kế hoạch đã được phê duyệt.
→ Xem thông tin chi tiết từng kế hoạch: sản phẩm, số lượng, tuyến hàng, VC, giá TK.
→ Dùng để nắm bắt nhu cầu nhập hàng của phòng KD.
→ Không có quyền tạo/sửa kế hoạch — chỉ xem.`
      },
      {
        step: 'Xem đơn hàng (PO)',
        guide: `Vào menu "Đơn hàng" → danh sách PO đã duyệt.
→ Xem thông tin: sản phẩm, đơn giá, tổng tiền, tỷ giá, nhà cung cấp.
→ Theo dõi trạng thái PO để phối hợp với Sales và Kho.
→ Không có quyền tạo/sửa PO — chỉ xem.`
      },
      {
        step: 'Đề nghị thanh toán',
        guide: `Vào "Đề nghị thanh toán" → "Thêm đề nghị".
→ Chọn loại MUA_HANG (mua hàng) hoặc VAN_CHUYEN (vận chuyển).
→ MUA_HANG: Chọn PO (đã duyệt) → nhập số tiền → lý do → tài khoản NH → file đính kèm.
→ VAN_CHUYEN: Chọn vận đơn → tự động load sản phẩm.
→ Chi tiết các trường xem ở tab Sales/Kế toán.
→ Lưu ý: Nhân viên Mua hàng cũng có thể tạo DNTT để đề xuất thanh toán.`
      },
      {
        step: 'Vận đơn (Waybill)',
        guide: `Vào "Vận đơn" → "Thêm vận đơn".
→ Nhập mã vận đơn, hãng VC, địa chỉ gửi/nhận.
→ Chọn PO → tích sản phẩm → ADD vào vận đơn.
→ Nhập KL, đơn giá VC, số kiện từng SP.
→ Có thể gộp nhiều PO vào một vận đơn.
→ Chi tiết xem ở tab Warehouse.`
      },
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