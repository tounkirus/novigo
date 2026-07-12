package com.novigo.api.commerce;

import com.novigo.api.commerce.OrderDtos.OrderItemView;
import com.novigo.api.commerce.OrderDtos.OrderView;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.commerce.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "driverId", source = "driver.id")
    OrderView toView(Order entity);

    List<OrderView> toView(List<Order> entities);

    @Mapping(target = "productId", source = "product.id")
    OrderItemView toItemView(OrderItem item);
}
