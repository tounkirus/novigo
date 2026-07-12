package com.novigo.api.commerce;

import com.novigo.api.commerce.OrderDtos.*;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.catalog.Product;
import com.novigo.domain.catalog.ProductRepository;
import com.novigo.domain.catalog.Store;
import com.novigo.domain.catalog.StoreRepository;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.commerce.OrderItem;
import com.novigo.domain.commerce.OrderRepository;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.logistics.DriverRepository;
import com.novigo.observability.AppMetrics;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository repository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final OrderMapper mapper;
    private final AppMetrics metrics;

    @Transactional(readOnly = true)
    public PageResponse<OrderView> list(String q, UUID customerId, UUID storeId, UUID driverId,
                                        String status, String paymentStatus, Pageable pageable) {
        Specification<Order> spec = Specs.all(
                Specs.like("ref", q),
                Specs.joinEq("customer", "id", customerId),
                Specs.joinEq("store", "id", storeId),
                Specs.joinEq("driver", "id", driverId),
                Specs.eq("status", status),
                Specs.eq("paymentStatus", paymentStatus));
        Page<Order> page = repository.findAll(spec, pageable);
        return PageResponse.of(page, mapper.toView(page.getContent()));
    }

    @Transactional(readOnly = true)
    public OrderView get(UUID id) {
        return mapper.toView(find(id));
    }

    @Transactional(readOnly = true)
    public OrderView getByRef(String ref) {
        return mapper.toView(repository.findByRef(ref).orElseThrow(() -> NotFoundException.of("Commande", ref)));
    }

    @Transactional
    public OrderView create(OrderCreate req) {
        Store store = storeRepository.findById(req.storeId())
                .orElseThrow(() -> NotFoundException.of("Boutique", req.storeId()));
        Order order = new Order();
        order.setRef(generateRef());
        order.setStore(store);
        if (req.customerId() != null) {
            order.setCustomer(userRepository.findById(req.customerId())
                    .orElseThrow(() -> NotFoundException.of("Client", req.customerId())));
        }
        order.setAddress(req.address());
        order.setDistrict(req.district());
        order.setPaymentMethod(req.paymentMethod());
        order.setStatus("PENDING");
        order.setPlacedAt(Instant.now());

        long subtotal = 0;
        for (OrderItemCreate ic : req.items()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            String name = ic.name();
            long unitPrice = ic.unitPrice();
            if (ic.productId() != null) {
                Product p = productRepository.findById(ic.productId())
                        .orElseThrow(() -> NotFoundException.of("Produit", ic.productId()));
                item.setProduct(p);
                if (name == null) name = p.getName();
                if (unitPrice == 0) unitPrice = p.getPrice();
            }
            item.setName(name);
            item.setUnitPrice(unitPrice);
            item.setQuantity(ic.quantity());
            item.setOptionsLabel(ic.optionsLabel());
            order.getItems().add(item);
            subtotal += unitPrice * ic.quantity();
        }
        order.setSubtotal(subtotal);
        order.setDeliveryFee(store.getDeliveryFee());
        order.setTotal(subtotal + store.getDeliveryFee());
        Order saved = repository.save(order);
        metrics.orderCreated();
        return mapper.toView(saved);
    }

    @Transactional
    public OrderView updateStatus(UUID id, OrderStatusUpdate req) {
        Order order = find(id);
        if (req.status() != null) order.setStatus(req.status());
        if (req.paymentStatus() != null) order.setPaymentStatus(req.paymentStatus());
        if (req.driverId() != null) {
            order.setDriver(driverRepository.findById(req.driverId())
                    .orElseThrow(() -> NotFoundException.of("Livreur", req.driverId())));
        }
        return mapper.toView(repository.save(order));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(find(id));
    }

    private Order find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Commande", id));
    }

    private String generateRef() {
        String ref;
        do {
            ref = "CMD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (repository.existsByRef(ref));
        return ref;
    }
}
