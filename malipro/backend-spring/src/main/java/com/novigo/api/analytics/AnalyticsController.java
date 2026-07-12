package com.novigo.api.analytics;

import com.novigo.domain.catalog.ProductRepository;
import com.novigo.domain.catalog.StoreRepository;
import com.novigo.domain.commerce.OrderRepository;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.logistics.DriverRepository;
import com.novigo.domain.services.BookingRepository;
import com.novigo.domain.services.ProviderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "Administration — Analytics & Tableau de bord")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AnalyticsController {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ProviderRepository providerRepository;
    private final DriverRepository driverRepository;
    private final BookingRepository bookingRepository;

    public record Overview(Map<String, Long> counts, long revenue,
                           Map<String, Long> ordersByStatus, List<TopStore> topStores) {}

    public record TopStore(String storeId, String name, long orders) {}

    @Operation(summary = "Vue d'ensemble du tableau de bord (compteurs, revenu, répartition, top boutiques)")
    @GetMapping("/overview")
    @Transactional(readOnly = true)
    public Overview overview() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("users", userRepository.count());
        counts.put("stores", storeRepository.count());
        counts.put("products", productRepository.count());
        counts.put("orders", orderRepository.count());
        counts.put("providers", providerRepository.count());
        counts.put("drivers", driverRepository.count());
        counts.put("bookings", bookingRepository.count());

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countGroupedByStatus()) {
            byStatus.put((String) row[0], (Long) row[1]);
        }

        List<TopStore> top = orderRepository.topStoresByOrders(PageRequest.of(0, 5)).stream()
                .map(r -> new TopStore(String.valueOf(r[0]), (String) r[1], (Long) r[2]))
                .toList();

        return new Overview(counts, orderRepository.sumPaidRevenue(), byStatus, top);
    }

    @Operation(summary = "Répartition des commandes par statut")
    @GetMapping("/orders-by-status")
    @Transactional(readOnly = true)
    public Map<String, Long> ordersByStatus() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countGroupedByStatus()) {
            byStatus.put((String) row[0], (Long) row[1]);
        }
        return byStatus;
    }

    @Operation(summary = "Chiffre d'affaires encaissé (commandes payées)")
    @GetMapping("/revenue")
    @Transactional(readOnly = true)
    public Map<String, Long> revenue() {
        return Map.of("paidRevenue", orderRepository.sumPaidRevenue());
    }

    @Operation(summary = "Top boutiques par nombre de commandes")
    @GetMapping("/top-stores")
    @Transactional(readOnly = true)
    public List<TopStore> topStores(@RequestParam(defaultValue = "10") int limit) {
        return orderRepository.topStoresByOrders(PageRequest.of(0, Math.min(limit, 50))).stream()
                .map(r -> new TopStore(String.valueOf(r[0]), (String) r[1], (Long) r[2]))
                .toList();
    }
}
