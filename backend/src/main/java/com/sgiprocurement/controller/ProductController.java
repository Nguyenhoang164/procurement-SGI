package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductDTO;
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
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String query) {
        List<ProductDTO> products = productService.searchProducts(query);
        return ResponseEntity.ok(products);
    }

    // GET product by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // CREATE new product
    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        ProductDTO createdProduct = productService.createProduct(productDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    // Generate POS code
    @GetMapping("/generate-code")
    public ResponseEntity<String> generateCode(
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "0") int iteration) {
        
        // Ưu tiên dùng productName nếu có, nếu không thì dùng category (để tương thích ngược)
        String nameToUse = (productName != null && !productName.isEmpty()) ? productName : category;
        String code = productService.generatePosCode(nameToUse, market, iteration);
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

    // UPDATE product
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        ProductDTO updatedProduct = productService.updateProduct(id, productDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    // DELETE product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

}
