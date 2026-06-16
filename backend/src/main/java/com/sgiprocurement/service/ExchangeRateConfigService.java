package com.sgiprocurement.service;

import com.sgiprocurement.dto.ExchangeRateConfigDTO;
import com.sgiprocurement.model.ExchangeRateConfig;
import com.sgiprocurement.repository.ExchangeRateConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

@Service
public class ExchangeRateConfigService {

    @Autowired
    private ExchangeRateConfigRepository repository;

    public List<ExchangeRateConfigDTO> getAll() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public ExchangeRateConfigDTO getByCurrency(String currency) {
        return repository.findByCurrency(currency.toUpperCase())
                .map(this::convertToDTO)
                .orElse(null);
    }

    public ExchangeRateConfigDTO save(ExchangeRateConfigDTO dto) {
        ExchangeRateConfig config = repository.findByCurrency(dto.getCurrency().toUpperCase())
                .orElse(new ExchangeRateConfig());
        config.setCurrency(dto.getCurrency().toUpperCase());
        config.setRate(dto.getRate());
        return convertToDTO(repository.save(config));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private ExchangeRateConfigDTO convertToDTO(ExchangeRateConfig config) {
        return new ExchangeRateConfigDTO(config.getId(), config.getCurrency(), config.getRate());
    }
}
