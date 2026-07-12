package com.novigo.domain.commerce;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByRef(String ref);
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Order> findByStoreId(UUID storeId, Pageable pageable);
    Page<Order> findByDriverId(UUID driverId, Pageable pageable);
    boolean existsByRef(String ref);
    long countByStatus(String status);

    @Query("select coalesce(sum(o.total), 0) from Order o where o.paymentStatus = 'PAID'")
    long sumPaidRevenue();

    @Query("select o.status, count(o) from Order o group by o.status")
    List<Object[]> countGroupedByStatus();

    @Query("select o.store.id, o.store.name, count(o) from Order o where o.store is not null "
            + "group by o.store.id, o.store.name order by count(o) desc")
    List<Object[]> topStoresByOrders(Pageable pageable);
}
