package com.sgiprocurement.service;

import com.sgiprocurement.dto.DashboardKpiResponse;
import com.sgiprocurement.dto.DashboardKpiResponse.*;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private WaybillRepository waybillRepository;

    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Autowired
    private WeeklyPlanRepository weeklyPlanRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    private static final List<String> COLORS = List.of(
        "#2563eb", "#059669", "#d97706", "#7c3aed",
        "#dc2626", "#0891b2", "#db2777", "#65a30d"
    );

    public DashboardKpiResponse getDashboard(String period, String date) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");

        String periodType = normalizePeriod(period);
        LocalDate targetDate = parseTargetDate(date);

        LocalDateTime periodStart = getPeriodStart(periodType, targetDate);
        LocalDateTime periodEnd = getPeriodEnd(periodType, targetDate);
        String periodLabel = getPeriodLabel(periodType);

        LocalDateTime startOfWeek = targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime endOfWeek = startOfWeek.plusDays(7);

        long totalProducts = productRepository.countActiveProducts();
        long poInPeriod = purchaseOrderRepository.countByCreatedAtBetween(periodStart, periodEnd);
        long poPendingApproval = purchaseOrderRepository.countByStatus("PENDING_L1");
        long totalPO = purchaseOrderRepository.count();
        long prPendingL1 = paymentRequestRepository.countByStatus("PENDING_L1");
        long prAccountingCheck = paymentRequestRepository.countByStatus("ACCOUNTING_CHECK");
        long prPendingL2 = paymentRequestRepository.countByStatus("PENDING_L2");
        long prApproved = paymentRequestRepository.countByStatus("APPROVED");
        long prInPeriod = paymentRequestRepository.countByCreatedAtBetween(periodStart, periodEnd);
        long waybillsInTransit = waybillRepository.countByStatusNot("DELIVERED");
        long waybillsInPeriod = waybillRepository.countByCreatedAtBetween(periodStart, periodEnd);
        long totalWarehouseReceipts = warehouseReceiptRepository.count();
        long wpPendingApproval = weeklyPlanRepository.countByStatus("PENDING_L1");
        long wpInPeriod = weeklyPlanRepository.countByCreatedAtBetween(periodStart, periodEnd);

        BigDecimal totalGoodsCost = purchaseOrderRepository.sumTotalGoodsCostVnd();
        BigDecimal totalGoodsCostInPeriod = purchaseOrderRepository.sumTotalGoodsCostVndBetween(periodStart, periodEnd);
        BigDecimal totalPaymentAmount = paymentRequestRepository.sumTotalAmountVndBetween(periodStart, periodEnd);

        long totalPendingApproval = poPendingApproval + prPendingL1;

        List<PurchaseOrder> recentPOs = purchaseOrderRepository.findTop5ByOrderByCreatedAtDesc();

        List<StatCard> statCards = buildStatCards(role, periodLabel, poInPeriod, waybillsInTransit,
                totalGoodsCost, totalPendingApproval, totalProducts, totalPO,
                prPendingL1, prAccountingCheck, prPendingL2, prApproved,
                prInPeriod, totalGoodsCostInPeriod, totalPaymentAmount,
                waybillsInPeriod, totalWarehouseReceipts, wpPendingApproval, wpInPeriod,
                poPendingApproval, startOfWeek, endOfWeek);

        List<RecentOrder> recentOrders = recentPOs.stream()
                .map(this::toRecentOrder)
                .collect(Collectors.toList());

        List<WeeklyTrend> weeklyTrend = buildTrendByPeriod("purchaseOrder", periodType, targetDate);
        List<WeeklyTrend> planTrend = buildTrendByPeriod("weeklyPlan", periodType, targetDate);
        List<WeeklyTrend> paymentTrend = buildTrendByPeriod("paymentRequest", periodType, targetDate);
        List<SourceData> sourceBreakdown = buildSourceBreakdown();
        List<ProductTrend> topProducts = buildTopProducts();

        return new DashboardKpiResponse(role, statCards, recentOrders, weeklyTrend, planTrend, paymentTrend, sourceBreakdown, topProducts);
    }

    private String normalizePeriod(String period) {
        if (period == null || period.isBlank()) {
            return "month";
        }
        String normalized = period.trim().toLowerCase();
        if ("date".equals(normalized)) {
            return "day";
        }
        return normalized;
    }

    private LocalDate parseTargetDate(String date) {
        if (date == null || date.isBlank()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(date.trim());
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private LocalDateTime getPeriodStart(String periodType, LocalDate targetDate) {
        switch (periodType) {
            case "day":
                return targetDate.atStartOfDay();
            case "week":
                return targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
            case "year":
                return targetDate.withDayOfYear(1).atStartOfDay();
            case "month":
            default:
                return targetDate.withDayOfMonth(1).atStartOfDay();
        }
    }

    private LocalDateTime getPeriodEnd(String periodType, LocalDate targetDate) {
        switch (periodType) {
            case "day":
                return targetDate.plusDays(1).atStartOfDay();
            case "week":
                return targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).plusWeeks(1).atStartOfDay();
            case "year":
                return targetDate.withDayOfYear(1).plusYears(1).atStartOfDay();
            case "month":
            default:
                return targetDate.withDayOfMonth(1).plusMonths(1).atStartOfDay();
        }
    }

    private String getPeriodLabel(String periodType) {
        switch (periodType) {
            case "day":
                return "hôm nay";
            case "week":
                return "tuần này";
            case "year":
                return "năm nay";
            case "month":
            default:
                return "tháng này";
        }
    }

    private List<StatCard> buildStatCards(String role, String periodLabel,
            long poInPeriod, long waybillsInTransit, BigDecimal totalGoodsCost,
            long totalPendingApproval, long totalProducts, long totalPO,
            long prPendingL1, long prAccountingCheck, long prPendingL2, long prApproved,
            long prInPeriod, BigDecimal totalGoodsCostInPeriod, BigDecimal totalPaymentAmount,
            long waybillsInPeriod, long totalWarehouseReceipts, long wpPendingApproval,
            long wpInPeriod, long poPendingApproval,
            LocalDateTime startOfWeek, LocalDateTime endOfWeek) {

        List<StatCard> cards = new ArrayList<>();
        DecimalFormat df = new DecimalFormat("#,###");
        String poLabel = "Đơn " + periodLabel;
        String prLabel = "DNTT " + periodLabel;
        String waybillLabel = "Vận đơn " + periodLabel;
        String wpLabel = "KH tuần " + periodLabel;

        switch (role) {
            case "ADMIN":
            case "CEO":
                cards.add(new StatCard(poLabel, String.valueOf(poInPeriod),
                        "Tổng số đơn hàng: " + df.format(totalPO), "#2563eb"));
                cards.add(new StatCard("Đang vận chuyển", String.valueOf(waybillsInTransit),
                        "Lô hàng đang trên đường", "#7c3aed"));
                cards.add(new StatCard("Tổng tiền hàng", formatVnd(totalGoodsCostInPeriod),
                        "VNĐ - giá trị hàng " + periodLabel, "#d97706"));
                cards.add(new StatCard("Chờ phê duyệt", String.valueOf(totalPendingApproval),
                        "PO và DNTT cần xử lý", "#dc2626"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm đang kinh doanh", "#0891b2"));
                cards.add(new StatCard(prLabel, String.valueOf(prInPeriod),
                        "Yêu cầu thanh toán", "#059669"));
                break;

            case "WAREHOUSE":
                cards.add(new StatCard("Đang vận chuyển", String.valueOf(waybillsInTransit),
                        "Lô hàng đang trên đường", "#7c3aed"));
                cards.add(new StatCard(waybillLabel, String.valueOf(waybillsInPeriod),
                        "Tổng số vận đơn", "#2563eb"));
                cards.add(new StatCard("Phiếu nhập kho", String.valueOf(totalWarehouseReceipts),
                        "Tổng số phiếu nhập kho", "#059669"));
                cards.add(new StatCard(poLabel, String.valueOf(poInPeriod),
                        "Đơn hàng cần xử lý", "#d97706"));
                break;

            case "ACCOUNTANT":
                cards.add(new StatCard("DNTT chờ duyệt L1", String.valueOf(prPendingL1),
                        "Cần phê duyệt", "#dc2626"));
                cards.add(new StatCard(prLabel, String.valueOf(prInPeriod),
                        "Yêu cầu thanh toán", "#2563eb"));
                cards.add(new StatCard("Tổng tiền DNTT", formatVnd(totalPaymentAmount),
                        "VNĐ - tổng giá trị " + periodLabel, "#059669"));
                cards.add(new StatCard("Đã phê duyệt L2", String.valueOf(prApproved),
                        "Chờ thanh toán", "#d97706"));
                break;

            case "CHIEF_ACCOUNTANT":
                cards.add(new StatCard("Chờ kiểm tra KT", String.valueOf(prAccountingCheck),
                        "Cần kiểm tra kế toán", "#dc2626"));
                cards.add(new StatCard("DNTT chờ duyệt L1", String.valueOf(prPendingL1),
                        "Cần phê duyệt", "#7c3aed"));
                cards.add(new StatCard(prLabel, String.valueOf(prInPeriod),
                        "Yêu cầu thanh toán", "#2563eb"));
                cards.add(new StatCard("Tổng tiền DNTT", formatVnd(totalPaymentAmount),
                        "VNĐ - tổng giá trị " + periodLabel, "#059669"));
                cards.add(new StatCard("Chờ duyệt L2", String.valueOf(prPendingL2),
                        "ADMIN cần phê duyệt", "#d97706"));
                break;

            case "SALES":
                cards.add(new StatCard(poLabel, String.valueOf(poInPeriod),
                        "Đơn hàng đã tạo", "#2563eb"));
                cards.add(new StatCard("Chờ duyệt PO", String.valueOf(poPendingApproval),
                        "Cần TP.KD phê duyệt", "#dc2626"));
                cards.add(new StatCard(wpLabel, String.valueOf(wpInPeriod),
                        "Kế hoạch tuần", "#059669"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm đang kinh doanh", "#0891b2"));
                break;

            case "PURCHASING":
                cards.add(new StatCard(poLabel, String.valueOf(poInPeriod),
                        "Đơn hàng đã tạo", "#2563eb"));
                cards.add(new StatCard("Chờ duyệt PO", String.valueOf(poPendingApproval),
                        "Cần phê duyệt", "#dc2626"));
                cards.add(new StatCard(prLabel, String.valueOf(prInPeriod),
                        "Đề nghị thanh toán", "#059669"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm trong hệ thống", "#0891b2"));
                break;

            case "SALES_MANAGER":
                cards.add(new StatCard("Chờ duyệt PO", String.valueOf(poPendingApproval),
                        "Cần phê duyệt L1", "#dc2626"));
                cards.add(new StatCard(poLabel, String.valueOf(poInPeriod),
                        "Đơn hàng đã tạo", "#2563eb"));
                cards.add(new StatCard("KH tuần chờ duyệt", String.valueOf(wpPendingApproval),
                        "Kế hoạch tuần cần duyệt", "#7c3aed"));
                cards.add(new StatCard(wpLabel, String.valueOf(wpInPeriod),
                        "Kế hoạch tuần", "#059669"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm đang kinh doanh", "#0891b2"));
                break;

            default:
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm trong hệ thống", "#2563eb"));
                break;
        }

        return cards;
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) amount = BigDecimal.ZERO;
        double billions = amount.divide(BigDecimal.valueOf(1_000_000_000), 2, RoundingMode.HALF_UP).doubleValue();
        if (billions >= 1) {
            return String.format("%.1f tỷ", billions);
        }
        double millions = amount.divide(BigDecimal.valueOf(1_000_000), 2, RoundingMode.HALF_UP).doubleValue();
        return String.format("%.0f tr", millions);
    }

    private RecentOrder toRecentOrder(PurchaseOrder po) {
        String productName = po.getProductName();
        if (productName == null && po.getItems() != null && !po.getItems().isEmpty()) {
            productName = po.getItems().get(0).getProductName();
        }
        return new RecentOrder(
                po.getPoCode(),
                productName != null ? productName : "N/A",
                po.getPosCode(),
                po.getOrderedQty(),
                po.getStatus(),
                getStatusLabel(po.getStatus())
        );
    }

    private String getStatusLabel(String status) {
        if (status == null) return "N/A";
        switch (status) {
            case "DRAFT": return "Nháp";
            case "PENDING_L1": return "Chờ duyệt L1";
            case "APPROVED": return "Đã duyệt";
            case "SENT_TO_ACCOUNTING": return "Đã gửi KT";
            case "REJECTED": return "Từ chối";
            case "IN_TRANSIT": return "Đang VC";
            case "PAID": return "Đã thanh toán";
            case "DELIVERED": return "Hoàn thành";
            default: return status;
        }
    }

    private List<WeeklyTrend> buildTrendByPeriod(String entityType, String periodType, LocalDate targetDate) {
        List<WeeklyTrend> trends = new ArrayList<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM");

        switch (periodType) {
            case "day":
                for (int i = 6; i >= 0; i--) {
                    LocalDate day = targetDate.minusDays(i);
                    LocalDateTime start = day.atStartOfDay();
                    LocalDateTime end = day.plusDays(1).atStartOfDay();
                    trends.add(new WeeklyTrend(day.format(dayFormatter), countByEntity(entityType, start, end)));
                }
                break;
            case "week":
                LocalDate weekStart = targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                for (int i = 3; i >= 0; i--) {
                    LocalDate ws = weekStart.minusWeeks(i);
                    LocalDateTime start = ws.atStartOfDay();
                    LocalDateTime end = ws.plusWeeks(1).atStartOfDay();
                    String label = ws.format(dayFormatter) + " - " + ws.plusDays(6).format(dayFormatter);
                    trends.add(new WeeklyTrend(label, countByEntity(entityType, start, end)));
                }
                break;
            case "year":
                for (int i = 11; i >= 0; i--) {
                    LocalDate monthStart = targetDate.minusMonths(i).withDayOfMonth(1);
                    LocalDate monthEnd = monthStart.plusMonths(1);
                    trends.add(new WeeklyTrend(getMonthLabel(monthStart), countByEntity(entityType, monthStart.atStartOfDay(), monthEnd.atStartOfDay())));
                }
                break;
            case "month":
            default:
                for (int i = 5; i >= 0; i--) {
                    LocalDate monthStart = targetDate.minusMonths(i).withDayOfMonth(1);
                    LocalDate monthEnd = monthStart.plusMonths(1);
                    trends.add(new WeeklyTrend(getMonthLabel(monthStart), countByEntity(entityType, monthStart.atStartOfDay(), monthEnd.atStartOfDay())));
                }
                break;
        }

        return trends;
    }

    private long countByEntity(String entityType, LocalDateTime start, LocalDateTime end) {
        switch (entityType) {
            case "weeklyPlan":
                return weeklyPlanRepository.countByCreatedAtBetween(start, end);
            case "paymentRequest":
                return paymentRequestRepository.countByCreatedAtBetween(start, end);
            case "purchaseOrder":
            default:
                return purchaseOrderRepository.countByCreatedAtBetween(start, end);
        }
    }

    private String getMonthLabel(LocalDate monthStart) {
        String[] monthNames = {"T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"};
        return monthNames[monthStart.getMonthValue() - 1];
    }

    private List<ProductTrend> buildTopProducts() {
        List<com.sgiprocurement.model.PurchaseOrderItem> allItems = purchaseOrderItemRepository.findAll();
        Map<String, ProductTrend> map = new LinkedHashMap<>();
        for (com.sgiprocurement.model.PurchaseOrderItem item : allItems) {
            String key = item.getPosCode();
            if (key == null || key.isBlank()) continue;
            ProductTrend existing = map.get(key);
            if (existing == null) {
                map.put(key, new ProductTrend(key, item.getProductName(), item.getOrderedQty() != null ? item.getOrderedQty() : 0));
            } else {
                existing.setTotalQty(existing.getTotalQty() + (item.getOrderedQty() != null ? item.getOrderedQty() : 0));
                if (item.getProductName() != null) existing.setProductName(item.getProductName());
            }
        }
        return map.values().stream()
                .sorted((a, b) -> Long.compare(b.getTotalQty(), a.getTotalQty()))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<SourceData> buildSourceBreakdown() {
        List<PurchaseOrder> allPOs = purchaseOrderRepository.findAll();
        Map<String, List<PurchaseOrder>> byCountry = allPOs.stream()
                .filter(po -> po.getCountry() != null && !po.getCountry().isBlank())
                .collect(Collectors.groupingBy(PurchaseOrder::getCountry));

        List<SourceData> sources = new ArrayList<>();
        long totalCount = byCountry.values().stream().mapToLong(List::size).sum();

        int colorIdx = 0;
        for (Map.Entry<String, List<PurchaseOrder>> entry : byCountry.entrySet()) {
            long count = entry.getValue().size();
            BigDecimal totalCost = entry.getValue().stream()
                    .map(po -> po.getTotalGoodsCostVnd() != null ? po.getTotalGoodsCostVnd() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            double pct = totalCount > 0 ? (count * 100.0 / totalCount) : 0;
            pct = Math.round(pct * 10.0) / 10.0;
            sources.add(new SourceData(
                    entry.getKey(), count, totalCost, pct,
                    COLORS.get(colorIdx % COLORS.size())
            ));
            colorIdx++;
        }

        sources.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return sources;
    }
}
