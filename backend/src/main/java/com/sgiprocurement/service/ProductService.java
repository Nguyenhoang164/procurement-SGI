package com.sgiprocurement.service;

import com.sgiprocurement.model.Product;
import com.sgiprocurement.dto.ProductDTO;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductNamingService productNamingService;

    // Get all products
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Search products by name or code
    public List<ProductDTO> searchProducts(String query) {
        return productRepository.findByProductNameContainingIgnoreCase(query)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get product by ID
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }

    // Create new product
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = convertToEntity(productDTO);
        // auto-generate posCode if absent
        if (product.getPosCode() == null || product.getPosCode().isEmpty()) {
            String code = productNamingService.generatePosCode(
                    product.getProductName(),
                    product.getMarketCode()
            );
            product.setPosCode(code);
        }
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    // Update product
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setProductName(productDTO.getProductName());
        product.setSpec(productDTO.getSpec());
        product.setCategoryId(productDTO.getCategoryId());
        product.setMarketCode(productDTO.getMarketCode());
        product.setUnit(productDTO.getUnit());
        product.setStatus(productDTO.getStatus());

        Product updatedProduct = productRepository.save(product);
        return convertToDTO(updatedProduct);
    }

    public String generatePosCode(String prefix, String market) {
        return productNamingService.generatePosCode(prefix, market, 0);
    }

    public String generatePosCode(String prefix, String market, int iteration) {
        return productNamingService.generatePosCode(prefix, market, iteration);
    }

    public ProductDTO getProductByPosCode(String posCode) {
        Product product = productRepository.findByPosCode(posCode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with posCode: " + posCode));
        return convertToDTO(product);
    }

    // Delete product
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productRepository.delete(product);
    }

    // Helper methods
    private ProductDTO convertToDTO(Product product) {
        return new ProductDTO(
            product.getId(),
            product.getPosCode(),
            product.getProductName(),
            product.getCategoryId(),
            product.getMarketCode(),
            product.getSpec(),
            product.getUnit(),
            product.getStatus(),
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }

    private Product convertToEntity(ProductDTO productDTO) {
        Product p = new Product();
        p.setId(productDTO.getId());
        p.setPosCode(productDTO.getPosCode());
        p.setProductName(productDTO.getProductName());
        p.setSpec(productDTO.getSpec());
        p.setCategoryId(productDTO.getCategoryId());
        p.setMarketCode(productDTO.getMarketCode());
        p.setUnit(productDTO.getUnit());
        p.setStatus(productDTO.getStatus() != null ? productDTO.getStatus() : "ACTIVE");
        p.setCreatedAt(productDTO.getCreatedAt());
        p.setUpdatedAt(productDTO.getUpdatedAt());
        return p;
    }

}
