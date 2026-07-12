package com.novigo.api.catalog;

import com.novigo.api.catalog.StoreDtos.StoreView;
import com.novigo.domain.catalog.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StoreMapper {
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "cityId", source = "city.id")
    StoreView toView(Store entity);

    List<StoreView> toView(List<Store> entities);
}
