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
import java.time.LocalTime;
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

    public DashboardKpiResponse getDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");

        LocalDate now = LocalDate.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = now.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        LocalDateTime startOfWeek = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime endOfWeek = startOfWeek.plusDays(7);

        long totalProducts = productRepository.countActiveProducts();
        long poThisMonth = purchaseOrderRepository.countByCreatedAtBetween(startOfMonth, startOfNextMonth);
        long poPendingApproval = purchaseOrderRepository.countByStatus("PENDING_L1");
        long totalPO = purchaseOrderRepository.count();
        long prPendingL1 = paymentRequestRepository.countByStatus("PENDING_L1");
        long prAccountingCheck = paymentRequestRepository.countByStatus("ACCOUNTING_CHECK");
        long prPendingL2 = paymentRequestRepository.countByStatus("PENDING_L2");
        long prApproved = paymentRequestRepository.countByStatus("APPROVED");
        long prThisMonth = paymentRequestRepository.countByCreatedAtBetween(startOfMonth, startOfNextMonth);
        long waybillsInTransit = waybillRepository.countByStatusNot("DELIVERED");
        long waybillsThisMonth = waybillRepository.countByCreatedAtBetween(startOfMonth, startOfNextMonth);
        long totalWarehouseReceipts = warehouseReceiptRepository.count();
        long wpPendingApproval = weeklyPlanRepository.countByStatus("PENDING_L1");
        long wpThisMonth = weeklyPlanRepository.countByCreatedAtBetween(startOfMonth, startOfNextMonth);

        BigDecimal totalGoodsCost = purchaseOrderRepository.sumTotalGoodsCostVnd();
        BigDecimal totalGoodsCostThisMonth = purchaseOrderRepository.sumTotalGoodsCostVndBetween(startOfMonth, startOfNextMonth);
        BigDecimal totalPaymentAmount = paymentRequestRepository.sumTotalAmountVnd();

        long totalPendingApproval = poPendingApproval + prPendingL1;

        List<PurchaseOrder> recentPOs = purchaseOrderRepository.findTop5ByOrderByCreatedAtDesc();

        List<StatCard> statCards = buildStatCards(role, poThisMonth, waybillsInTransit,
                totalGoodsCost, totalPendingApproval, totalProducts, totalPO,
                prPendingL1, prAccountingCheck, prPendingL2, prApproved,
                prThisMonth, totalGoodsCostThisMonth, totalPaymentAmount,
                waybillsThisMonth, totalWarehouseReceipts, wpPendingApproval, wpThisMonth,
                poPendingApproval, startOfWeek, endOfWeek);

        List<RecentOrder> recentOrders = recentPOs.stream()
                .map(this::toRecentOrder)
                .collect(Collectors.toList());

        List<WeeklyTrend> weeklyTrend = buildMonthlyTrend();
        List<WeeklyTrend> planTrend = buildMonthlyPlanTrend();
        List<WeeklyTrend> paymentTrend = buildMonthlyPaymentTrend();
        List<SourceData> sourceBreakdown = buildSourceBreakdown();
        List<ProductTrend> topProducts = buildTopProducts();

        return new DashboardKpiResponse(role, statCards, recentOrders, weeklyTrend, planTrend, paymentTrend, sourceBreakdown, topProducts);
    }

    private List<StatCard> buildStatCards(String role,
            long poThisMonth, long waybillsInTransit, BigDecimal totalGoodsCost,
            long totalPendingApproval, long totalProducts, long totalPO,
            long prPendingL1, long prAccountingCheck, long prPendingL2, long prApproved,
            long prThisMonth, BigDecimal totalGoodsCostThisMonth, BigDecimal totalPaymentAmount,
            long waybillsThisMonth, long totalWarehouseReceipts, long wpPendingApproval,
            long wpThisMonth, long poPendingApproval,
            LocalDateTime startOfWeek, LocalDateTime endOfWeek) {

        List<StatCard> cards = new ArrayList<>();
        DecimalFormat df = new DecimalFormat("#,###");

        switch (role) {
            case "ADMIN":
            case "CEO":
                cards.add(new StatCard("Đơn tháng này", String.valueOf(poThisMonth),
                        "Tổng số đơn hàng: " + df.format(totalPO), "#2563eb"));
                cards.add(new StatCard("Đang vận chuyển", String.valueOf(waybillsInTransit),
                        "Lô hàng đang trên đường", "#7c3aed"));
                cards.add(new StatCard("Tổng tiền hàng", formatVnd(totalGoodsCost),
                        "VNĐ - tổng giá trị hàng", "#d97706"));
                cards.add(new StatCard("Chờ phê duyệt", String.valueOf(totalPendingApproval),
                        "PO và DNTT cần xử lý", "#dc2626"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm đang kinh doanh", "#0891b2"));
                cards.add(new StatCard("DNTT tháng này", String.valueOf(prThisMonth),
                        "Yêu cầu thanh toán", "#059669"));
                break;

            case "WAREHOUSE":
                cards.add(new StatCard("Đang vận chuyển", String.valueOf(waybillsInTransit),
                        "Lô hàng đang trên đường", "#7c3aed"));
                cards.add(new StatCard("Vận đơn tháng này", String.valueOf(waybillsThisMonth),
                        "Tổng số vận đơn", "#2563eb"));
                cards.add(new StatCard("Phiếu nhập kho", String.valueOf(totalWarehouseReceipts),
                        "Tổng số phiếu nhập kho", "#059669"));
                cards.add(new StatCard("Đơn hàng tháng này", String.valueOf(poThisMonth),
                        "Đơn hàng cần xử lý", "#d97706"));
                break;

            case "ACCOUNTANT":
                cards.add(new StatCard("DNTT chờ duyệt L1", String.valueOf(prPendingL1),
                        "Cần phê duyệt", "#dc2626"));
                cards.add(new StatCard("DNTT tháng này", String.valueOf(prThisMonth),
                        "Yêu cầu thanh toán", "#2563eb"));
                cards.add(new StatCard("Tổng tiền DNTT", formatVnd(totalPaymentAmount),
                        "VNĐ - tổng giá trị", "#059669"));
                cards.add(new StatCard("Đã phê duyệt L2", String.valueOf(prApproved),
                        "Chờ thanh toán", "#d97706"));
                break;

            case "CHIEF_ACCOUNTANT":
                cards.add(new StatCard("Chờ kiểm tra KT", String.valueOf(prAccountingCheck),
                        "Cần kiểm tra kế toán", "#dc2626"));
                cards.add(new StatCard("DNTT chờ duyệt L1", String.valueOf(prPendingL1),
                        "Cần phê duyệt", "#7c3aed"));
                cards.add(new StatCard("DNTT tháng này", String.valueOf(prThisMonth),
                        "Yêu cầu thanh toán", "#2563eb"));
                cards.add(new StatCard("Tổng tiền DNTT", formatVnd(totalPaymentAmount),
                        "VNĐ - tổng giá trị", "#059669"));
                cards.add(new StatCard("Chờ duyệt L2", String.valueOf(prPendingL2),
                        "ADMIN cần phê duyệt", "#d97706"));
                break;

            case "SALES":
                cards.add(new StatCard("Đơn tháng này", String.valueOf(poThisMonth),
                        "Đơn hàng đã tạo", "#2563eb"));
                cards.add(new StatCard("Chờ duyệt PO", String.valueOf(poPendingApproval),
                        "Cần TP.KD phê duyệt", "#dc2626"));
                cards.add(new StatCard("KH tuần tháng này", String.valueOf(wpThisMonth),
                        "Kế hoạch tuần", "#059669"));
                cards.add(new StatCard("Sản phẩm", String.valueOf(totalProducts),
                        "Sản phẩm đang kinh doanh", "#0891b2"));
                break;

            case "SALES_MANAGER":
                cards.add(new StatCard("Chờ duyệt PO", String.valueOf(poPendingApproval),
                        "Cần phê duyệt L1", "#dc2626"));
                cards.add(new StatCard("Đơn tháng này", String.valueOf(poThisMonth),
                        "Đơn hàng đã tạo", "#2563eb"));
                cards.add(new StatCard("KH tuần chờ duyệt", String.valueOf(wpPendingApproval),
                        "Kế hoạch tuần cần duyệt", "#7c3aed"));
                cards.add(new StatCard("KH tuần tháng này", String.valueOf(wpThisMonth),
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

    private List<WeeklyTrend> buildMonthlyTrend() {
        List<WeeklyTrend> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();
        String[] monthNames = {"T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"};
        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1);
            long count = purchaseOrderRepository.countByCreatedAtBetween(
                    monthStart.atStartOfDay(), monthEnd.atStartOfDay());
            int monthValue = monthStart.getMonthValue();
            String label = monthNames[monthValue - 1];
            trends.add(new WeeklyTrend(label, count));
        }
        return trends;
    }

    private List<WeeklyTrend> buildMonthlyPlanTrend() {
        List<WeeklyTrend> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();
        String[] monthNames = {"T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"};
        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1);
            long count = weeklyPlanRepository.countByCreatedAtBetween(monthStart.atStartOfDay(), monthEnd.atStartOfDay());
            trends.add(new WeeklyTrend(monthNames[monthStart.getMonthValue() - 1], count));
        }
        return trends;
    }

    private List<WeeklyTrend> buildMonthlyPaymentTrend() {
        List<WeeklyTrend> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();
        String[] monthNames = {"T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"};
        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1);
            long count = paymentRequestRepository.countByCreatedAtBetween(monthStart.atStartOfDay(), monthEnd.atStartOfDay());
            trends.add(new WeeklyTrend(monthNames[monthStart.getMonthValue() - 1], count));
        }
        return trends;
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
