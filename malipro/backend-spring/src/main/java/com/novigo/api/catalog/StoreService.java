package com.novigo.api.catalog;

import com.novigo.api.catalog.StoreDtos.*;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.catalog.Store;
import com.novigo.domain.catalog.StoreRepository;
import com.novigo.domain.geo.City;
import com.novigo.domain.geo.CityRepository;
import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository repository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;
    private final StoreMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<StoreView> list(String q, String category, String status, Boolean open, Pageable pageable) {
        Page<Store> page = repository.findAll(Specs.all(
                Specs.search(q, "name", "slug", "district"),
                Specs.eq("category", category),
                Specs.eq("status", status),
                Specs.eq("open", open)), pageable);
        return PageResponse.of(page, mapper.toView(page.getContent()));
    }

    @Transactional(readOnly = true)
    public StoreView get(UUID id) {
        return mapper.toView(find(id));
    }

    @Transactional(readOnly = true)
    public StoreView getBySlug(String slug) {
        return mapper.toView(repository.findBySlug(slug)
                .orElseThrow(() -> NotFoundException.of("Boutique", slug)));
    }

    @Transactional
    public StoreView create(StoreCreate req) {
        if (repository.existsBySlug(req.slug())) {
            throw new ApiException(HttpStatus.CONFLICT, "Slug déjà utilisé : " + req.slug());
        }
        Store s = new Store();
        s.setSlug(req.slug());
        s.setName(req.name());
        s.setCategory(req.category());
        s.setDistrict(req.district());
        s.setAddress(req.address());
        s.setPhone(req.phone());
        s.setLat(req.lat());
        s.setLng(req.lng());
        s.setDeliveryFee(req.deliveryFee());
        s.setDeliveryTimeMin(req.deliveryTimeMin());
        s.setCoverUrl(req.coverUrl());
        s.setLogoUrl(req.logoUrl());
        if (req.cityId() != null) s.setCity(city(req.cityId()));
        if (req.ownerId() != null) s.setOwner(owner(req.ownerId()));
        return mapper.toView(repository.save(s));
    }

    @Transactional
    public StoreView update(UUID id, StoreUpdate req) {
        Store s = find(id);
        if (req.name() != null) s.setName(req.name());
        if (req.category() != null) s.setCategory(req.category());
        if (req.cityId() != null) s.setCity(city(req.cityId()));
        if (req.district() != null) s.setDistrict(req.district());
        if (req.address() != null) s.setAddress(req.address());
        if (req.phone() != null) s.setPhone(req.phone());
        if (req.lat() != null) s.setLat(req.lat());
        if (req.lng() != null) s.setLng(req.lng());
        if (req.open() != null) s.setOpen(req.open());
        if (req.deliveryFee() != null) s.setDeliveryFee(req.deliveryFee());
        if (req.deliveryTimeMin() != null) s.setDeliveryTimeMin(req.deliveryTimeMin());
        if (req.coverUrl() != null) s.setCoverUrl(req.coverUrl());
        if (req.logoUrl() != null) s.setLogoUrl(req.logoUrl());
        if (req.status() != null) s.setStatus(req.status());
        return mapper.toView(repository.save(s));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(find(id));
    }

    private Store find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Boutique", id));
    }

    private City city(UUID id) {
        return cityRepository.findById(id).orElseThrow(() -> NotFoundException.of("Ville", id));
    }

    private User owner(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> NotFoundException.of("Utilisateur", id));
    }
}
