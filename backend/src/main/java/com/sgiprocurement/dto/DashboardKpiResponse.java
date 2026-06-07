package com.sgiprocurement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpiResponse {
    private String role;
    private List<StatCard> statCards;
    private List<RecentOrder> recentOrders;
    private List<WeeklyTrend> weeklyTrend;
    private List<WeeklyTrend> planTrend;
    private List<WeeklyTrend> paymentTrend;
    private List<SourceData> sourceBreakdown;
    private List<ProductTrend> topProducts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatCard {
        private String label;
        private String value;
        private String subtitle;
        private String color;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private String poCode;
        private String productName;
        private String posCode;
        private Integer orderedQty;
        private String status;
        private String statusLabel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyTrend {
        private String week;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductTrend {
        private String posCode;
        private String productName;
        private long totalQty;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceData {
        private String label;
        private long count;
        private BigDecimal totalCostVnd;
        private double percentage;
        private String color;
    }
}
