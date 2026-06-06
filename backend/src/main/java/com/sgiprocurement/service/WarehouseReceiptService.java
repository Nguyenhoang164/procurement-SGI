package com.sgiprocurement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgiprocurement.model.WarehouseReceipt;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.dto.WarehouseReceiptItemDTO;
import com.sgiprocurement.dto.PendingReceiveDTO;
import com.sgiprocurement.dto.WarehouseReceiveRequest;
import com.sgiprocurement.dto.WarehouseReceiveItemRequest;
import com.sgiprocurement.repository.WarehouseReceiptRepository;
import com.sgiprocurement.repository.WarehouseReceiptItemRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.PaymentRequestRepository;
import com.sgiprocurement.repository.WaybillRepository;
import com.sgiprocurement.repository.PurchaseOrderItemRepository;
import com.sgiprocurement.repository.PaymentRequestPurchaseOrderRepository;
import com.sgiprocurement.model.PaymentRequest;
import com.sgiprocurement.model.PaymentRequestPurchaseOrder;
import com.sgiprocurement.model.WarehouseReceiptItem;
import com.sgiprocurement.model.Waybill;
import com.sgiprocurement.model.PurchaseOrderItem;
import com.sgiprocurement.dto.WaybillBriefDTO;
import com.sgiprocurement.dto.PurchaseOrderItemDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class WarehouseReceiptService {

    @Autowired
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCostService productCostService;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private WaybillRepository waybillRepository;

    @Autowired
    private PaymentRequestPurchaseOrderRepository paymentRequestPurchaseOrderRepository;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Autowired
    private WarehouseReceiptItemRepository warehouseReceiptItemRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final int MAX_IMAGES = 3;
    private static final long MAX_TOTAL_SIZE_BYTES = 20L * 1024 * 1024;

    public WarehouseReceiptDTO uploadImages(Long id, MultipartFile[] files) throws IOException {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Chua chon file de tai len");
        }

        if (files.length > MAX_IMAGES) {
            throw new IllegalArgumentException("Chi duoc tai len toi da " + MAX_IMAGES + " anh");
        }

        long totalSize = 0;
        for (MultipartFile file : files) {
            totalSize += file.getSize();
        }
        if (totalSize > MAX_TOTAL_SIZE_BYTES) {
            throw new IllegalArgumentException("Tong dung luong anh vuot qua 20MB");
        }

        List<String> urls = parseAttachmentUrls(receipt.getAttachments());
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                urls.add(fileStorageService.storeWarehouseReceiptImage(id, file));
            }
        }
        receipt.setAttachments(serializeAttachmentUrls(urls));
        WarehouseReceipt updated = warehouseReceiptRepository.save(receipt);
        WarehouseReceiptDTO dto = convertToDTO(updated);
        enrichReceiptDTO(dto);
        return dto;
    }

    public List<PendingReceiveDTO> getPendingReceives() {
        List<PendingReceiveDTO> result = new ArrayList<>();

        for (Waybill wb : waybillRepository.findByStatus("DELIVERED")) {
            List<WarehouseReceipt> existingWbReceipts = warehouseReceiptRepository.findAllByWaybillId(wb.getId());
            boolean hasConfirmedReceipt = existingWbReceipts.stream().anyMatch(r -> "RECEIVED".equals(r.getStatus()));
            if (hasConfirmedReceipt) {
                continue;
            }

            if (wb.getPaymentRequestId() != null) {
                PaymentRequest pr = paymentRequestRepository.findById(wb.getPaymentRequestId()).orElse(null);
                if (pr != null) {
                    List<Long> poIds = new ArrayList<>();
                    if (pr.getPoId() != null) poIds.add(pr.getPoId());
                    List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository.findByPaymentRequestId(pr.getId());
                    for (PaymentRequestPurchaseOrder link : poLinks) {
                        if (!poIds.contains(link.getPoId())) poIds.add(link.getPoId());
                    }

                    boolean hasIncompletePo = false;
                    for (Long poId : poIds) {
                        PurchaseOrder po = purchaseOrderRepository.findById(poId).orElse(null);
                        if (po == null || po.getOrderedQty() == null) {
                            hasIncompletePo = true;
                            break;
                        }
                        List<WarehouseReceipt> poReceipts = warehouseReceiptRepository.findAllByPoId(po.getId());
                        int poReceived = poReceipts.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();
                        if (poReceived < po.getOrderedQty()) {
                            hasIncompletePo = true;
                            break;
                        }
                    }
                    if (!hasIncompletePo && !poIds.isEmpty()) {
                        continue;
                    }
                }
            }

            PendingReceiveDTO dto = toPendingReceiveFromWaybill(wb);
            if (dto != null) {
                result.add(dto);
            }
        }

        return result;
    }

    public WarehouseReceiptDTO receiveGoods(WarehouseReceiveRequest request) {
        Long requestedPoId = request.getPoId();
        PurchaseOrder po = null;
        Waybill waybill = null;

        if (requestedPoId != null && requestedPoId < 0) {
            waybill = waybillRepository.findById(-requestedPoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Waybill not found with id: " + (-requestedPoId)));

            if (!"DELIVERED".equals(waybill.getStatus())) {
                throw new IllegalStateException("Van don chua duoc xac nhan giao hang (DELIVERED)");
            }

            if (waybill.getPaymentRequestId() != null) {
                PaymentRequest pr = paymentRequestRepository.findById(waybill.getPaymentRequestId()).orElse(null);
                if (pr != null) {
                    po = purchaseOrderRepository.findById(pr.getPoId()).orElse(null);
                }
            }

            if (po == null) {
                throw new IllegalStateException("Van don chua duoc lien ket voi De Nghi Thanh Toan (DNTT). Vui long cap nhat ma DNTT cho van don truoc khi nhap kho.");
            }
        } else {
            po = purchaseOrderRepository.findById(requestedPoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + requestedPoId));
        }

        int totalReceived = 0;
        int totalReceivedQty = 0;

        if (po != null) {
            boolean isPaid = "PAID".equals(po.getPaymentStatus());
            boolean hasDeliveredWaybill = false;

            if (request.getWaybillId() != null) {
                Waybill wb = waybillRepository.findById(request.getWaybillId()).orElse(null);
                if (wb != null && "DELIVERED".equals(wb.getStatus())) {
                    hasDeliveredWaybill = true;
                }
            }

            if (!isPaid && !hasDeliveredWaybill) {
                List<PaymentRequest> prs = paymentRequestRepository.findByPoId(po.getId());
                hasDeliveredWaybill = prs.stream()
                        .flatMap(pr -> waybillRepository.findByPaymentRequestId(pr.getId()).stream())
                        .anyMatch(w -> "DELIVERED".equals(w.getStatus()));
            }

            if (!isPaid && !hasDeliveredWaybill) {
                throw new IllegalStateException("Don hang chua duoc ke toan xac nhan thanh toan (PAID) va chua co van don nao xac nhan giao hang (DELIVERED)");
            }

            if (request.getWaybillId() != null) {
                List<WarehouseReceipt> existingForWb = warehouseReceiptRepository.findAllByWaybillId(request.getWaybillId());
                boolean hasConfirmedReceipt = existingForWb.stream().anyMatch(r -> "RECEIVED".equals(r.getStatus()));
                if (hasConfirmedReceipt) {
                    throw new IllegalStateException("Van don nay da duoc nhap kho truoc do");
                }
            }

            List<WarehouseReceipt> existing = warehouseReceiptRepository.findAllByPoId(po.getId());
            totalReceived = existing.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();

            if (waybill != null && waybill.getPaymentRequestId() != null) {
                PaymentRequest pr = paymentRequestRepository.findById(waybill.getPaymentRequestId()).orElse(null);
                if (pr != null) {
                    List<Waybill> dnttWaybills = waybillRepository.findByPaymentRequestId(pr.getId());
                    for (Waybill dnttWb : dnttWaybills) {
                        List<WarehouseReceipt> negReceipts = warehouseReceiptRepository.findAllByPoId(-dnttWb.getId());
                        for (WarehouseReceipt nr : negReceipts) {
                            if (existing.stream().noneMatch(e -> e.getId().equals(nr.getId()))) {
                                totalReceived += nr.getReceivedQty();
                            }
                        }
                    }
                }
            }

            if (request.getItems() != null && !request.getItems().isEmpty()) {
                totalReceivedQty = request.getItems().stream().mapToInt(WarehouseReceiveItemRequest::getReceivedQty).sum();
            } else {
                totalReceivedQty = request.getReceivedQty() != null ? request.getReceivedQty() : 0;
            }

            if (po.getOrderedQty() != null && totalReceived + totalReceivedQty > po.getOrderedQty()) {
                throw new IllegalArgumentException("Tong so luong nhan vuot qua so luong dat (" + po.getOrderedQty() + ")");
            }
        }

        // Nếu có PENDING receipt từ auto-create, cập nhật thay vì tạo mới
        Long wbId = request.getWaybillId() != null ? request.getWaybillId() : (waybill != null ? waybill.getId() : null);
        WarehouseReceipt receipt = null;
        if (wbId != null) {
            List<WarehouseReceipt> existingForWb = warehouseReceiptRepository.findAllByWaybillId(wbId);
            receipt = existingForWb.stream()
                    .filter(r -> "PENDING".equals(r.getStatus()))
                    .findFirst()
                    .orElse(null);
        }
        if (receipt == null) {
            receipt = new WarehouseReceipt();
            receipt.setWaybillId(wbId);
            receipt.setWaybillCode(request.getWaybillCode() != null ? request.getWaybillCode() : (waybill != null ? waybill.getWaybillCode() : null));
            receipt.setPoId(po != null ? po.getId() : (waybill != null ? -waybill.getId() : requestedPoId));
        } else if (po != null) {
            receipt.setPoId(po.getId());
        }
        receipt.setReceivedQty(totalReceivedQty);
        receipt.setReceivedDate(LocalDateTime.now());
        receipt.setInspector(request.getInspector());
        receipt.setCondition(request.getConditionDescription());
        receipt.setExpectedQty(request.getExpectedQty());
        receipt.setGoodsCondition(request.getGoodsCondition());
        receipt.setStatus("RECEIVED");

        WarehouseReceipt saved = warehouseReceiptRepository.save(receipt);

        // Save individual receipt items
        List<WarehouseReceiptItem> savedItems = saveReceiptItems(saved, request, po);

        if (po != null) {
            int newTotal = totalReceived + totalReceivedQty;
            if (po.getOrderedQty() != null && newTotal >= po.getOrderedQty()) {
                po.setStatus("COMPLETED");
                po.setExpectedWarehouseArrivalDate(LocalDate.now());
                purchaseOrderRepository.save(po);
            }

            if (waybill != null && waybill.getPaymentRequestId() != null && po.getOrderedQty() != null && newTotal < po.getOrderedQty()) {
                List<Waybill> dnttWaybills = waybillRepository.findByPaymentRequestId(waybill.getPaymentRequestId());
                int extraReceived = 0;
                for (Waybill dnttWb : dnttWaybills) {
                    List<WarehouseReceipt> negReceipts = warehouseReceiptRepository.findAllByPoId(-dnttWb.getId());
                    for (WarehouseReceipt nr : negReceipts) {
                        if (!nr.getId().equals(saved.getId())) {
                            extraReceived += nr.getReceivedQty();
                        }
                    }
                }
                newTotal += extraReceived;
                if (newTotal >= po.getOrderedQty()) {
                    po.setStatus("COMPLETED");
                    po.setExpectedWarehouseArrivalDate(LocalDate.now());
                    purchaseOrderRepository.save(po);
                }
            }

            if (waybill != null && waybill.getPaymentRequestId() != null) {
                PaymentRequest pr = paymentRequestRepository.findById(waybill.getPaymentRequestId()).orElse(null);
                if (pr != null) {
                    List<Long> allPoIds = new ArrayList<>();
                    if (pr.getPoId() != null) allPoIds.add(pr.getPoId());
                    List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository.findByPaymentRequestId(pr.getId());
                    for (PaymentRequestPurchaseOrder link : poLinks) {
                        if (!allPoIds.contains(link.getPoId())) allPoIds.add(link.getPoId());
                    }

                    for (Long pid : allPoIds) {
                        if (pid.equals(po.getId())) continue;
                        PurchaseOrder otherPo = purchaseOrderRepository.findById(pid).orElse(null);
                        if (otherPo != null && otherPo.getOrderedQty() != null) {
                            List<WarehouseReceipt> otherReceipts = warehouseReceiptRepository.findAllByPoId(otherPo.getId());
                            int otherTotal = otherReceipts.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();
                            if (otherTotal >= otherPo.getOrderedQty()) {
                                otherPo.setStatus("COMPLETED");
                                otherPo.setExpectedWarehouseArrivalDate(LocalDate.now());
                                purchaseOrderRepository.save(otherPo);
                            }
                        }
                    }
                }
            }

            if (po.getItems() != null && !po.getItems().isEmpty() && savedItems != null && !savedItems.isEmpty()) {
                java.util.Map<Long, Integer> itemReceivedMap = new java.util.HashMap<>();
                for (WarehouseReceiptItem ri : savedItems) {
                    itemReceivedMap.put(ri.getPoItemId(), ri.getReceivedQty());
                }
                productCostService.applyReceiptFromPurchaseOrder(po, itemReceivedMap);
            } else {
                productCostService.applyReceiptFromPurchaseOrder(po, totalReceivedQty);
            }
        }

        return convertToDTO(saved);
    }

    public List<WarehouseReceiptDTO> getAllWarehouseReceipts() {
        return warehouseReceiptRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .peek(this::enrichReceiptDTO)
                .collect(Collectors.toList());
    }

    public WarehouseReceiptDTO getWarehouseReceiptById(Long id) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));
        WarehouseReceiptDTO dto = convertToDTO(receipt);
        enrichReceiptDTO(dto);
        return dto;
    }

    private void enrichReceiptDTO(WarehouseReceiptDTO dto) {
        Long targetPoId = dto.getPoId();
        if (targetPoId == null || targetPoId <= 0) {
            if (dto.getWaybillId() != null) {
                targetPoId = waybillRepository.findById(dto.getWaybillId())
                        .flatMap(wb -> {
                            if (wb.getPaymentRequestId() != null) {
                                return paymentRequestRepository.findById(wb.getPaymentRequestId())
                                        .map(PaymentRequest::getPoId);
                            }
                            return Optional.empty();
                        }).orElse(null);
            }
        }
        if (targetPoId != null && targetPoId > 0) {
            Long fetchPoId = targetPoId;
            purchaseOrderRepository.findById(fetchPoId).ifPresent(po -> {
                dto.setPoCode("PO-" + po.getId());
                dto.setPosCode(po.getPosCode());
                List<PurchaseOrderItem> poItems = purchaseOrderItemRepository.findByPurchaseOrderId(po.getId());
                dto.setProducts(poItems.stream().map(item -> {
                    PurchaseOrderItemDTO pdto = new PurchaseOrderItemDTO();
                    pdto.setId(item.getId());
                    pdto.setPosCode(item.getPosCode());
                    pdto.setProductName(item.getProductName());
                    pdto.setProductShortCode(item.getProductShortCode());
                    pdto.setOrderedQty(item.getOrderedQty());
                    pdto.setUnitPrice(item.getUnitPrice());
                    pdto.setCurrency(item.getCurrency());
                    pdto.setSpec(item.getSpec());
                    return pdto;
                }).collect(Collectors.toList()));
            });
        }
        if (dto.getWaybillId() != null) {
            waybillRepository.findById(dto.getWaybillId()).ifPresent(wb -> {
                if (wb.getPaymentRequestId() != null) {
                    dto.setPaymentRequestCode("DNTT-" + wb.getPaymentRequestId());
                    dto.setPaymentRequestId(wb.getPaymentRequestId());
                }
            });
        }
    }

    public WarehouseReceiptDTO getWarehouseReceiptByPoId(Long poId) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findByPoId(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found for po_id: " + poId));
        return convertToDTO(receipt);
    }

    public WarehouseReceiptDTO createWarehouseReceipt(WarehouseReceiptDTO dto) {
        WarehouseReceiveRequest request = new WarehouseReceiveRequest();
        request.setPoId(dto.getPoId());
        request.setReceivedQty(dto.getReceivedQty());
        request.setInspector(dto.getInspector());
        request.setConditionDescription(dto.getCondition());
        request.setWaybillId(dto.getWaybillId());
        request.setWaybillCode(dto.getWaybillCode());
        request.setExpectedQty(dto.getExpectedQty());
        request.setGoodsCondition(dto.getGoodsCondition());
        return receiveGoods(request);
    }

    public WarehouseReceiptDTO updateWarehouseReceipt(Long id, WarehouseReceiptDTO dto) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));

        receipt.setReceivedQty(dto.getReceivedQty());
        receipt.setInspector(dto.getInspector());
        receipt.setCondition(dto.getCondition());
        receipt.setAttachments(dto.getAttachments());
        receipt.setWaybillId(dto.getWaybillId());
        receipt.setWaybillCode(dto.getWaybillCode());
        receipt.setExpectedQty(dto.getExpectedQty());
        receipt.setGoodsCondition(dto.getGoodsCondition());

        WarehouseReceipt updated = warehouseReceiptRepository.save(receipt);
        return convertToDTO(updated);
    }

    public void deleteWarehouseReceipt(Long id) {
        WarehouseReceipt receipt = warehouseReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse receipt not found with id: " + id));
        warehouseReceiptRepository.delete(receipt);
    }

    private PendingReceiveDTO toPendingReceive(PurchaseOrder po) {
        String productName = productRepository.findByPosCode(po.getPosCode())
                .map(Product::getProductName)
                .orElse(po.getPosCode());

        List<WarehouseReceipt> existing = warehouseReceiptRepository.findAllByPoId(po.getId());
        int receivedQty = existing.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();
        int remainingQty = po.getOrderedQty() != null ? po.getOrderedQty() - receivedQty : 0;

        PendingReceiveDTO dto = new PendingReceiveDTO();
        dto.setPoId(po.getId());
        dto.setPoCode("PO-" + po.getId());
        dto.setPosCode(po.getPosCode());
        dto.setProductName(productName);
        dto.setOrderedQty(po.getOrderedQty());
        dto.setReceivedQty(receivedQty);
        dto.setRemainingQty(Math.max(remainingQty, 0));
        dto.setShippingMethod(po.getShippingMethod());
        dto.setPaymentStatus(po.getPaymentStatus());

        List<WaybillBriefDTO> waybillDTOs = paymentRequestRepository.findByPoId(po.getId()).stream()
                .flatMap(pr -> waybillRepository.findByPaymentRequestId(pr.getId()).stream()
                        .map(wb -> {
                            WaybillBriefDTO wbdto = new WaybillBriefDTO();
                            wbdto.setWaybillId(wb.getId());
                            wbdto.setWaybillCode(wb.getWaybillCode());
                            wbdto.setCarrier(wb.getCarrier());
                            wbdto.setExpectedQty(wb.getExpectedQty());
                            wbdto.setActualQty(wb.getActualQty());
                            wbdto.setStatus(wb.getStatus());
                            wbdto.setPaymentRequestId(pr.getId());
                            wbdto.setPaymentRequestCode("DNTT-" + pr.getId());
                            return wbdto;
                        }))
                .collect(Collectors.toList());
        dto.setWaybills(waybillDTOs);

        List<PurchaseOrderItem> poItems = purchaseOrderItemRepository.findByPurchaseOrderId(po.getId());
        List<PurchaseOrderItemDTO> productDTOs = poItems.stream().map(item -> {
            PurchaseOrderItemDTO pdto = new PurchaseOrderItemDTO();
            pdto.setId(item.getId());
            pdto.setPosCode(item.getPosCode());
            pdto.setProductName(item.getProductName());
            pdto.setProductShortCode(item.getProductShortCode());
            pdto.setOrderedQty(item.getOrderedQty());
            pdto.setUnitPrice(item.getUnitPrice());
            pdto.setCurrency(item.getCurrency());
            pdto.setSpec(item.getSpec());
            return pdto;
        }).collect(Collectors.toList());
        dto.setProducts(productDTOs);

        return dto;
    }

    private PendingReceiveDTO toPendingReceiveFromWaybill(Waybill wb) {
        PendingReceiveDTO dto = new PendingReceiveDTO();
        dto.setPoId(-wb.getId());
        dto.setPosCode("");
        dto.setProductName("Vận đơn: " + wb.getWaybillCode());
        dto.setOrderedQty(wb.getExpectedQty());
        dto.setReceivedQty(0);
        dto.setRemainingQty(wb.getExpectedQty() != null ? wb.getExpectedQty() : 0);
        dto.setShippingMethod(wb.getCarrier());
        dto.setPaymentStatus("DELIVERED");

        String paymentRequestCode = null;
        String poCode = wb.getWaybillCode();
        final String prCode;
        final Long prId = wb.getPaymentRequestId();

        if (prId != null) {
            paymentRequestCode = "DNTT-" + prId;
            prCode = paymentRequestCode;
            PaymentRequest pr = paymentRequestRepository.findById(prId).orElse(null);
            if (pr != null) {
                List<Long> poIds = new ArrayList<>();
                if (pr.getPoId() != null) poIds.add(pr.getPoId());
                List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository.findByPaymentRequestId(pr.getId());
                for (PaymentRequestPurchaseOrder link : poLinks) {
                    if (!poIds.contains(link.getPoId())) poIds.add(link.getPoId());
                }

                int totalOrdered = 0;
                int totalReceived = 0;
                StringBuilder poCodes = new StringBuilder();

                for (int i = 0; i < poIds.size(); i++) {
                    PurchaseOrder po = purchaseOrderRepository.findById(poIds.get(i)).orElse(null);
                    if (po != null) {
                        if (i > 0) poCodes.append(", ");
                        poCodes.append("PO-").append(po.getId());

                        if (i == 0) {
                            dto.setPosCode(po.getPosCode());
                        }

                        if (po.getOrderedQty() != null) {
                            totalOrdered += po.getOrderedQty();
                        }
                        List<WarehouseReceipt> poReceipts = warehouseReceiptRepository.findAllByPoId(po.getId());
                        totalReceived += poReceipts.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();
                    }
                }

                poCode = poCodes.length() > 0 ? poCodes.toString() : poCode;
                dto.setReceivedQty(totalReceived);
                if (totalOrdered > 0) {
                    dto.setOrderedQty(totalOrdered);
                    dto.setRemainingQty(Math.max(0, totalOrdered - totalReceived));
                }
            }
        } else {
            prCode = null;
        }
        dto.setPoCode(poCode);

        WaybillBriefDTO wbdto = new WaybillBriefDTO();
        wbdto.setWaybillId(wb.getId());
        wbdto.setWaybillCode(wb.getWaybillCode());
        wbdto.setCarrier(wb.getCarrier());
        wbdto.setExpectedQty(wb.getExpectedQty());
        wbdto.setActualQty(wb.getActualQty());
        wbdto.setStatus(wb.getStatus());
        wbdto.setPaymentRequestId(prId);
        wbdto.setPaymentRequestCode(prCode);

        if (prId != null) {
            List<WaybillBriefDTO> allWb = waybillRepository.findByPaymentRequestId(prId).stream()
                    .map(other -> {
                        WaybillBriefDTO o = new WaybillBriefDTO();
                        o.setWaybillId(other.getId());
                        o.setWaybillCode(other.getWaybillCode());
                        o.setCarrier(other.getCarrier());
                        o.setExpectedQty(other.getExpectedQty());
                        o.setActualQty(other.getActualQty());
                        o.setStatus(other.getStatus());
                        o.setPaymentRequestId(prId);
                        o.setPaymentRequestCode(prCode);
                        return o;
                    })
                    .collect(Collectors.toList());
            dto.setWaybills(allWb);
        } else {
            dto.setWaybills(List.of(wbdto));
        }

        if (prId != null) {
            PaymentRequest pr = paymentRequestRepository.findById(prId).orElse(null);
            if (pr != null) {
                List<Long> allPoIds = new ArrayList<>();
                if (pr.getPoId() != null) allPoIds.add(pr.getPoId());
                List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository.findByPaymentRequestId(pr.getId());
                for (PaymentRequestPurchaseOrder link : poLinks) {
                    if (!allPoIds.contains(link.getPoId())) allPoIds.add(link.getPoId());
                }
                if (!allPoIds.isEmpty()) {
                    PurchaseOrder firstPo = purchaseOrderRepository.findById(allPoIds.get(0)).orElse(null);
                    if (firstPo != null) {
                        List<PurchaseOrderItem> poItems = purchaseOrderItemRepository.findByPurchaseOrderId(firstPo.getId());
                        dto.setProducts(poItems.stream().map(item -> {
                            PurchaseOrderItemDTO pdto = new PurchaseOrderItemDTO();
                            pdto.setId(item.getId());
                            pdto.setPosCode(item.getPosCode());
                            pdto.setProductName(item.getProductName());
                            pdto.setProductShortCode(item.getProductShortCode());
                            pdto.setOrderedQty(item.getOrderedQty());
                            pdto.setUnitPrice(item.getUnitPrice());
                            pdto.setCurrency(item.getCurrency());
                            pdto.setSpec(item.getSpec());
                            return pdto;
                        }).collect(Collectors.toList()));
                    }
                }
            }
        }
        if (dto.getProducts() == null) {
            dto.setProducts(List.of());
        }
        return dto;
    }

    private List<WarehouseReceiptItem> saveReceiptItems(WarehouseReceipt receipt, WarehouseReceiveRequest request, PurchaseOrder po) {
        List<WarehouseReceiptItem> itemsToSave = new ArrayList<>();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (WarehouseReceiveItemRequest itemReq : request.getItems()) {
                WarehouseReceiptItem item = new WarehouseReceiptItem();
                item.setReceiptId(receipt.getId());
                item.setPoItemId(itemReq.getPoItemId());
                item.setReceivedQty(itemReq.getReceivedQty());
                item.setGoodsCondition(itemReq.getGoodsCondition());
                item.setConditionDescription(itemReq.getConditionDescription());
                itemsToSave.add(item);
            }
        } else if (po != null) {
            List<PurchaseOrderItem> poItems = purchaseOrderItemRepository.findByPurchaseOrderId(po.getId());
            if (poItems.size() == 1) {
                WarehouseReceiptItem item = new WarehouseReceiptItem();
                item.setReceiptId(receipt.getId());
                item.setPoItemId(poItems.get(0).getId());
                item.setReceivedQty(receipt.getReceivedQty());
                item.setGoodsCondition(receipt.getGoodsCondition());
                item.setConditionDescription(receipt.getCondition());
                itemsToSave.add(item);
            }
        }
        if (!itemsToSave.isEmpty()) {
            return warehouseReceiptItemRepository.saveAll(itemsToSave);
        }
        return itemsToSave;
    }

    private WarehouseReceiptItemDTO toItemDTO(WarehouseReceiptItem item) {
        WarehouseReceiptItemDTO dto = new WarehouseReceiptItemDTO();
        dto.setId(item.getId());
        dto.setReceiptId(item.getReceiptId());
        dto.setPoItemId(item.getPoItemId());
        dto.setReceivedQty(item.getReceivedQty());
        dto.setGoodsCondition(item.getGoodsCondition());
        dto.setConditionDescription(item.getConditionDescription());
        dto.setImages(item.getImages());
        purchaseOrderItemRepository.findById(item.getPoItemId()).ifPresent(poi -> {
            dto.setPosCode(poi.getPosCode());
            dto.setProductName(poi.getProductName());
            dto.setProductShortCode(poi.getProductShortCode());
            dto.setOrderedQty(poi.getOrderedQty());
            dto.setSpec(poi.getSpec());
        });
        return dto;
    }

    @Transactional
    public WarehouseReceiptItemDTO uploadItemImages(Long receiptId, Long itemId, MultipartFile[] files) throws IOException {
        WarehouseReceiptItem item = warehouseReceiptItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt item not found with id: " + itemId));

        if (!item.getReceiptId().equals(receiptId)) {
            throw new IllegalArgumentException("Item does not belong to this receipt");
        }

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Chua chon file de tai len");
        }

        if (files.length > 3) {
            throw new IllegalArgumentException("Chi duoc tai len toi da 3 anh cho moi san pham");
        }

        long totalSize = 0;
        for (MultipartFile file : files) {
            totalSize += file.getSize();
        }
        if (totalSize > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("Tong dung luong anh vuot qua 20MB");
        }

        List<String> urls = parseAttachmentUrls(item.getImages());
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                urls.add(fileStorageService.storeWarehouseReceiptImage(receiptId, file));
            }
        }
        item.setImages(serializeAttachmentUrls(urls));
        warehouseReceiptItemRepository.save(item);

        return toItemDTO(item);
    }

    private WarehouseReceiptDTO convertToDTO(WarehouseReceipt receipt) {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO();
        dto.setId(receipt.getId());
        dto.setPoId(receipt.getPoId());
        dto.setReceivedQty(receipt.getReceivedQty());
        dto.setReceivedDate(receipt.getReceivedDate());
        dto.setInspector(receipt.getInspector());
        dto.setCondition(receipt.getCondition());
        dto.setAttachments(receipt.getAttachments());
        dto.setStatus(receipt.getStatus());
        dto.setCreatedAt(receipt.getCreatedAt());
        dto.setUpdatedAt(receipt.getUpdatedAt());
        dto.setWaybillId(receipt.getWaybillId());
        dto.setWaybillCode(receipt.getWaybillCode());
        dto.setExpectedQty(receipt.getExpectedQty());
        dto.setGoodsCondition(receipt.getGoodsCondition());
        List<WarehouseReceiptItem> items = warehouseReceiptItemRepository.findByReceiptId(receipt.getId());
        if (items != null && !items.isEmpty()) {
            dto.setItems(items.stream().map(this::toItemDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    @Transactional
    public WarehouseReceiptDTO createFromWaybill(com.sgiprocurement.model.Waybill waybill) {
        List<Long> poIds = new ArrayList<>();
        PurchaseOrder primaryPo = null;

        if (waybill.getPaymentRequestId() != null) {
            PaymentRequest paymentRequest = paymentRequestRepository.findById(waybill.getPaymentRequestId()).orElse(null);
            if (paymentRequest != null) {
                if (paymentRequest.getPoId() != null) {
                    poIds.add(paymentRequest.getPoId());
                    primaryPo = purchaseOrderRepository.findById(paymentRequest.getPoId()).orElse(null);
                }
                List<PaymentRequestPurchaseOrder> poLinks = paymentRequestPurchaseOrderRepository.findByPaymentRequestId(paymentRequest.getId());
                for (PaymentRequestPurchaseOrder link : poLinks) {
                    if (!poIds.contains(link.getPoId())) {
                        poIds.add(link.getPoId());
                        if (primaryPo == null) {
                            primaryPo = purchaseOrderRepository.findById(link.getPoId()).orElse(null);
                        }
                    }
                }
            }
        }

        Integer receivedQty = waybill.getActualQty() != null ? waybill.getActualQty() : waybill.getExpectedQty();
        String condition = "Giao hang tu xac nhan van don";

        if (!poIds.isEmpty()) {
            Long primaryPoId = poIds.get(0);
            WarehouseReceipt receipt = new WarehouseReceipt();
            receipt.setWaybillId(waybill.getId());
            receipt.setWaybillCode(waybill.getWaybillCode());
            receipt.setPoId(primaryPoId);
            receipt.setReceivedQty(receivedQty);
            receipt.setReceivedDate(java.time.LocalDateTime.now());
            receipt.setInspector("System");
            receipt.setCondition(condition);
            receipt.setExpectedQty(waybill.getExpectedQty());
            receipt.setGoodsCondition("GOOD");
            receipt.setStatus("PENDING");

            WarehouseReceipt saved = warehouseReceiptRepository.save(receipt);

            if (primaryPo != null) {
                List<WarehouseReceipt> existing = warehouseReceiptRepository.findAllByPoId(primaryPoId);
                int totalReceived = existing.stream().mapToInt(WarehouseReceipt::getReceivedQty).sum();
                if (totalReceived >= (primaryPo.getOrderedQty() != null ? primaryPo.getOrderedQty() : 0)) {
                    primaryPo.setStatus("COMPLETED");
                    primaryPo.setExpectedWarehouseArrivalDate(java.time.LocalDate.now());
                    purchaseOrderRepository.save(primaryPo);
                }
            }

            return convertToDTO(saved);
        }

        // Fallback: tạo phiếu nhập kho gắn trực tiếp với waybill (không qua PO)
        WarehouseReceipt receipt = new WarehouseReceipt();
        receipt.setWaybillId(waybill.getId());
        receipt.setWaybillCode(waybill.getWaybillCode());
        receipt.setPoId(-waybill.getId());
        receipt.setReceivedQty(receivedQty != null ? receivedQty : 0);
        receipt.setReceivedDate(java.time.LocalDateTime.now());
        receipt.setInspector("System");
        receipt.setCondition(condition);
        receipt.setExpectedQty(waybill.getExpectedQty());
        receipt.setGoodsCondition("GOOD");
        receipt.setStatus("PENDING");

        WarehouseReceipt saved = warehouseReceiptRepository.save(receipt);
        return convertToDTO(saved);
    }

    private List<String> parseAttachmentUrls(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        try {
            if (raw.trim().startsWith("[")) {
                return objectMapper.readValue(raw, new TypeReference<List<String>>() {});
            }
            List<String> legacy = new ArrayList<>();
            for (String part : raw.split(",")) {
                if (!part.isBlank()) {
                    legacy.add(part.trim());
                }
            }
            return legacy;
        } catch (IOException e) {
            throw new IllegalStateException("Khong doc duoc danh sach anh", e);
        }
    }

    private String serializeAttachmentUrls(List<String> urls) {
        try {
            return objectMapper.writeValueAsString(urls);
        } catch (IOException e) {
            throw new IllegalStateException("Khong luu duoc danh sach anh", e);
        }
    }
}
