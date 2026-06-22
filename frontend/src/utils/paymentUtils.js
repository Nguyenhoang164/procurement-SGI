export const PAYMENT_TYPES = [
  { value: 'MUA_HANG', label: 'Mua hàng' },
  { value: 'VAN_CHUYEN', label: 'Vận chuyển' }
];

export const PAPER_TYPES = [
  { value: 'THANH_TOAN', label: 'Thanh toán' },
  { value: 'HOAN_UNG', label: 'Hoàn ứng' }
];

const STATUS_LABELS = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ xử lý',
  PENDING_L1: 'Chờ duyệt L1',
  ACCOUNTING_CHECK: 'Kế toán duyệt chi',
  PENDING_L2: 'Chờ duyệt L2',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã thanh toán'
};

export function getPaymentTypeLabel(type) {
  return PAYMENT_TYPES.find((item) => item.value === type)?.label || type || '-';
}

export function getPaymentStatusLabel(status) {
  return STATUS_LABELS[status] || status || '-';
}

export function getPaymentStatusBadgeClass(status) {
  if (!status) return 'badge-draft';
  const key = status.toLowerCase();
  if (key === 'pending_l1' || key === 'pending_l2' || key === 'accounting_check') return 'badge-pending';
  if (key === 'paid') return 'badge-completed';
  return `badge-${key}`;
}

export function formatDnttCode(id) {
  return `DNTT-${String(id).padStart(4, '0')}`;
}

export function formatPoCode(id) {
  return `PO-${id}`;
}

export function suggestAmountForType(type, order) {
  if (!order) return '';
  const num = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
  if (type === 'MUA_HANG') return num(order.remainingPaymentVnd) || num(order.totalLotCostVnd);
  return 0;
}

export function canCreatePayment(user) {
  return ['ADMIN', 'PURCHASING'].includes(user?.role);
}

export function isPaymentEligibleOrder(order) {
  return order?.status === 'APPROVED' && (!order?.paymentStatus || order.paymentStatus === 'REJECTED');
}

export function canCreatePaymentForOrder(user, order) {
  return canCreatePayment(user) && isPaymentEligibleOrder(order);
}

export function canEditPayment(request) {
  return ['DRAFT', 'PENDING_L1', 'REJECTED'].includes(request?.status);
}
export function canAccountingCheck(user) {
  return user?.role === 'ADMIN' || user?.role === 'CHIEF_ACCOUNTANT';
}

export function parseAttachmentUrls(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

export function getAttachmentFileName(url) {
  if (!url) return 'file';
  const parts = url.split('/');
  return decodeURIComponent(parts[parts.length - 1] || 'file');
}

function readThreeDigits(n, isFirst) {
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const result = [];
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  const ten = Math.floor(remainder / 10);
  const one = remainder % 10;
  if (hundred > 0) {
    result.push(ones[hundred] + ' trăm');
    if (remainder === 0) return result.join(' ');
  } else if (!isFirst) {
    result.push('không trăm');
  }
  if (ten > 1) {
    result.push(ones[ten] + ' mươi');
    if (one === 1) result.push('mốt');
    else if (one === 5) result.push('lăm');
    else if (one > 0) result.push(ones[one]);
  } else if (ten === 1) {
    result.push('mười');
    if (one === 1) result.push('một');
    else if (one === 5) result.push('lăm');
    else if (one > 0) result.push(ones[one]);
  } else if (ten === 0 && one > 0) {
    if (!isFirst) result.push('linh');
    result.push(ones[one]);
  }
  return result.join(' ');
}

export function numberToWords(num) {
  if (num === 0) return 'Không';
  const negative = num < 0;
  num = Math.abs(num);
  const integerPart = Math.floor(num);
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  if (integerPart === 0) return 'Không';
  let result = [];
  let unitIndex = 0;
  let remaining = integerPart;
  while (remaining > 0) {
    const digits = remaining % 1000;
    if (digits > 0 || (unitIndex > 0 && remaining >= 1000)) {
      const chunk = readThreeDigits(digits, remaining === digits);
      if (chunk) {
        result.unshift(chunk + (units[unitIndex] ? ' ' + units[unitIndex] : ''));
      }
    }
    remaining = Math.floor(remaining / 1000);
    unitIndex++;
  }
  let words = result.join(' ');
  words = words.replace(/một mươi/g, 'mười');
  if (negative) words = 'Âm ' + words;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatMoney(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toLocaleString('vi-VN') : '0';
}
