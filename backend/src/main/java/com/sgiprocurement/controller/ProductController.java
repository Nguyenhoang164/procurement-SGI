package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductComboDTO;
import com.sgiprocurement.dto.ProductDTO;
import com.sgiprocurement.dto.ProductImportResult;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/v1/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductService productService;

    // GET all products
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // SEARCH products
    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam(required = false) String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        List<ProductDTO> products = productService.searchProducts(query);
        return ResponseEntity.ok(products);
    }

    // GET product by ID
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // CREATE new product
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        ProductDTO createdProduct = productService.createProduct(productDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    // Generate POS code
    @GetMapping("/generate-code")
    public ResponseEntity<String> generateCode(
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "0") int iteration) {
        
        String nameToUse = (productName != null && !productName.isEmpty()) ? productName : category;
        String code = productService.generatePosCode(nameToUse, market, department, iteration);
        return ResponseEntity.ok(code);
    }

    @GetMapping("/by-pos-code/{posCode}")
    public ResponseEntity<ProductDTO> getByPosCode(@PathVariable String posCode) {
        try {
            ProductDTO product = productService.getProductByPosCode(posCode);
            return ResponseEntity.ok(product);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // IMPORT products from JSON array
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<ProductImportResult> importProducts(@RequestBody List<ProductDTO> products) {
        ProductImportResult result = productService.importProducts(products);
        return ResponseEntity.ok(result);
    }

    // UPDATE product
    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        ProductDTO updatedProduct = productService.updateProduct(id, productDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    // DELETE product
    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // BATCH DELETE products
    @PostMapping("/batch-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> batchDelete(@RequestBody List<Long> ids) {
        productService.batchDelete(ids);
        return ResponseEntity.noContent().build();
    }

    // DELETE ALL products
    @DeleteMapping("/delete-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAll() {
        productService.deleteAllProducts();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id:\\d+}/combos")
    public ResponseEntity<List<ProductComboDTO>> getCombos(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getCombos(id));
    }

    @PostMapping("/{id:\\d+}/combos")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<ProductComboDTO> createCombo(
            @PathVariable Long id,
            @Valid @RequestBody ProductComboDTO dto) {
        ProductComboDTO created = productService.createCombo(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id:\\d+}/combos/{comboId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<ProductComboDTO> updateCombo(
            @PathVariable Long id,
            @PathVariable Long comboId,
            @Valid @RequestBody ProductComboDTO dto) {
        return ResponseEntity.ok(productService.updateCombo(id, comboId, dto));
    }

    @DeleteMapping("/{id:\\d+}/combos/{comboId:\\d+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<Void> deleteCombo(@PathVariable Long id, @PathVariable Long comboId) {
        productService.deleteCombo(id, comboId);
        return ResponseEntity.noContent().build();
    }

}
