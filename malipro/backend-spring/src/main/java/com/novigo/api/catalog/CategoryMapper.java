package com.novigo.api.catalog;

import com.novigo.api.catalog.CategoryDtos.CategoryView;
import com.novigo.domain.catalog.Category;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CategoryMapper {
    CategoryView toView(Category entity);
    List<CategoryView> toView(List<Category> entities);
}
