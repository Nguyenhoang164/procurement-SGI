package com.sgiprocurement.service;

import com.sgiprocurement.dto.TradeRouteDTO;
import com.sgiprocurement.model.TradeRoute;
import com.sgiprocurement.repository.TradeRouteRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

@Service
public class TradeRouteService {

    @Autowired
    private TradeRouteRepository repository;

    public List<TradeRouteDTO> getAll() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<TradeRouteDTO> getActive() {
        return repository.findByActiveTrueOrderByRouteName().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public TradeRouteDTO getById(Long id) {
        TradeRoute route = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade route not found with id: " + id));
        return convertToDTO(route);
    }

    public TradeRouteDTO create(TradeRouteDTO dto) {
        TradeRoute route = convertToEntity(dto);
        return convertToDTO(repository.save(route));
    }

    public TradeRouteDTO update(Long id, TradeRouteDTO dto) {
        TradeRoute route = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade route not found with id: " + id));
        route.setRouteName(dto.getRouteName());
        route.setOrigin(dto.getOrigin());
        route.setDestination(dto.getDestination());
        route.setDescription(dto.getDescription());
        route.setActive(dto.getActive() != null ? dto.getActive() : true);
        return convertToDTO(repository.save(route));
    }

    public void delete(Long id) {
        TradeRoute route = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trade route not found with id: " + id));
        repository.delete(route);
    }

    private TradeRouteDTO convertToDTO(TradeRoute route) {
        return new TradeRouteDTO(
                route.getId(),
                route.getRouteName(),
                route.getOrigin(),
                route.getDestination(),
                route.getDescription(),
                route.getActive()
        );
    }

    private TradeRoute convertToEntity(TradeRouteDTO dto) {
        TradeRoute route = new TradeRoute();
        route.setRouteName(dto.getRouteName());
        route.setOrigin(dto.getOrigin());
        route.setDestination(dto.getDestination());
        route.setDescription(dto.getDescription());
        route.setActive(dto.getActive() != null ? dto.getActive() : true);
        return route;
    }
}
