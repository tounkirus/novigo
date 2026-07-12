package com.novigo.api.catalog;

import com.novigo.api.catalog.CategoryDtos.*;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.catalog.Category;
import com.novigo.domain.catalog.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final CategoryMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<CategoryView> list(String q, String vertical, Pageable pageable) {
        Page<Category> page = repository.findAll(
                Specs.all(Specs.like("label", q), Specs.eq("vertical", vertical)), pageable);
        return PageResponse.of(page, mapper.toView(page.getContent()));
    }

    @Transactional(readOnly = true)
    public CategoryView get(UUID id) {
        return mapper.toView(find(id));
    }

    @Transactional
    public CategoryView create(CategoryCreate req) {
        if (repository.existsByCode(req.code())) {
            throw new ApiException(HttpStatus.CONFLICT, "Code catégorie déjà utilisé : " + req.code());
        }
        Category c = new Category();
        c.setCode(req.code());
        c.setLabel(req.label());
        c.setIcon(req.icon());
        c.setVertical(req.vertical());
        return mapper.toView(repository.save(c));
    }

    @Transactional
    public CategoryView update(UUID id, CategoryUpdate req) {
        Category c = find(id);
        if (req.label() != null) c.setLabel(req.label());
        if (req.icon() != null) c.setIcon(req.icon());
        if (req.vertical() != null) c.setVertical(req.vertical());
        return mapper.toView(repository.save(c));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(find(id));
    }

    private Category find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Catégorie", id));
    }
}
