package com.novigo.api.catalog;

import com.novigo.api.catalog.ProductDtos.ProductView;
import com.novigo.domain.catalog.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "categoryId", source = "category.id")
    ProductView toView(Product entity);

    List<ProductView> toView(List<Product> entities);
}
