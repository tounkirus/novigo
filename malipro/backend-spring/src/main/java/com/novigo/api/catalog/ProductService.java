package com.novigo.api.catalog;

import com.novigo.api.catalog.ProductDtos.*;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.catalog.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<ProductView> list(String q, UUID storeId, UUID categoryId,
                                          Boolean available, Pageable pageable) {
        Specification<Product> spec = Specs.all(
                Specs.search(q, "name", "description"),
                Specs.joinEq("store", "id", storeId),
                Specs.joinEq("category", "id", categoryId),
                Specs.eq("available", available));
        Page<Product> page = repository.findAll(spec, pageable);
        return PageResponse.of(page, mapper.toView(page.getContent()));
    }

    @Transactional(readOnly = true)
    public ProductView get(UUID id) {
        return mapper.toView(find(id));
    }

    /** Menu d'une boutique : produits groupés par section, dans l'ordre. */
    @Transactional(readOnly = true)
    public List<MenuSection> menu(UUID storeId) {
        if (!storeRepository.existsById(storeId)) throw NotFoundException.of("Boutique", storeId);
        List<Product> products = repository.findByStoreIdOrderByMenuSectionAsc(storeId);
        Map<String, List<ProductView>> grouped = new LinkedHashMap<>();
        for (Product p : products) {
            String section = p.getMenuSection() == null ? "Autres" : p.getMenuSection();
            grouped.computeIfAbsent(section, k -> new ArrayList<>()).add(mapper.toView(p));
        }
        List<MenuSection> sections = new ArrayList<>();
        grouped.forEach((section, items) -> sections.add(new MenuSection(section, items)));
        return sections;
    }

    @Transactional
    public ProductView create(ProductCreate req) {
        Product p = new Product();
        p.setStore(store(req.storeId()));
        if (req.categoryId() != null) p.setCategory(category(req.categoryId()));
        p.setName(req.name());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setOldPrice(req.oldPrice());
        p.setImageUrl(req.imageUrl());
        if (req.available() != null) p.setAvailable(req.available());
        if (req.bestSeller() != null) p.setBestSeller(req.bestSeller());
        if (req.isNew() != null) p.setNew(req.isNew());
        p.setStock(req.stock());
        p.setMenuSection(req.menuSection());
        return mapper.toView(repository.save(p));
    }

    @Transactional
    public ProductView update(UUID id, ProductUpdate req) {
        Product p = find(id);
        if (req.categoryId() != null) p.setCategory(category(req.categoryId()));
        if (req.name() != null) p.setName(req.name());
        if (req.description() != null) p.setDescription(req.description());
        if (req.price() != null) p.setPrice(req.price());
        if (req.oldPrice() != null) p.setOldPrice(req.oldPrice());
        if (req.imageUrl() != null) p.setImageUrl(req.imageUrl());
        if (req.available() != null) p.setAvailable(req.available());
        if (req.bestSeller() != null) p.setBestSeller(req.bestSeller());
        if (req.isNew() != null) p.setNew(req.isNew());
        if (req.stock() != null) p.setStock(req.stock());
        if (req.menuSection() != null) p.setMenuSection(req.menuSection());
        return mapper.toView(repository.save(p));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(find(id));
    }

    private Product find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Produit", id));
    }

    private Store store(UUID id) {
        return storeRepository.findById(id).orElseThrow(() -> NotFoundException.of("Boutique", id));
    }

    private Category category(UUID id) {
        return categoryRepository.findById(id).orElseThrow(() -> NotFoundException.of("Catégorie", id));
    }
}
