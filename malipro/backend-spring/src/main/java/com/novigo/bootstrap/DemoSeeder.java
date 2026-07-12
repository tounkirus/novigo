package com.novigo.bootstrap;

import com.novigo.domain.catalog.*;
import com.novigo.domain.commerce.*;
import com.novigo.domain.geo.*;
import com.novigo.domain.identity.Role;
import com.novigo.domain.identity.RoleRepository;
import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.payment.PaymentProviderConfig;
import com.novigo.domain.payment.PaymentProviderConfigRepository;
import com.novigo.domain.wallet.Wallet;
import com.novigo.domain.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Seed déterministe pour le mode démo (H2 en mémoire). Idempotent : ne fait rien si des données existent.
 * Prouve que le schéma JPA et les repositories fonctionnent de bout en bout.
 */
@Slf4j
@Component
@Profile("demo")
@RequiredArgsConstructor
public class DemoSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final PaymentProviderConfigRepository paymentProviderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (storeRepository.count() > 0) {
            log.info("[DemoSeeder] Données déjà présentes — seed ignoré.");
            return;
        }
        log.info("[DemoSeeder] Amorçage des données de démonstration…");

        // Rôles (créés ici en démo car Flyway est off sous H2)
        Role clientRole = ensureRole("CLIENT", "Client");
        ensureRole("DRIVER", "Livreur");
        Role merchantRole = ensureRole("MERCHANT", "Commerçant");
        ensureRole("PROVIDER", "Prestataire");
        Role adminRole = ensureRole("ADMIN", "Administrateur");
        Role superAdminRole = ensureRole("SUPER_ADMIN", "Super administrateur");

        // Fournisseurs de paiement (Flyway off sous H2 → seed ici)
        seedProvider("ORANGE_MONEY", "Orange Money", 1, 150);
        seedProvider("WAVE", "Wave", 2, 100);
        seedProvider("MOOV_MONEY", "Moov Money", 3, 150);
        seedProvider("STRIPE", "Carte bancaire (Stripe)", 4, 290);
        seedProvider("CASH", "Espèces", 5, 0);

        // Géo
        Country mali = new Country();
        mali.setCode("ML");
        mali.setName("Mali");
        mali.setDialCode("+223");
        mali.setCurrency("XOF");
        countryRepository.save(mali);

        City bamako = new City();
        bamako.setName("Bamako");
        bamako.setCountry(mali);
        bamako.setLat(12.6392);
        bamako.setLng(-8.0029);
        cityRepository.save(bamako);

        // Catégories
        Category resto = ensureCategory("resto", "Restaurants", "food");
        ensureCategory("grocery", "Supermarchés", "shop");
        ensureCategory("pharmacy", "Pharmacies", "health");

        // Utilisateurs démo
        User client = new User();
        client.setEmail("client@novigo.ml");
        client.setPhone("+22370000001");
        client.setFullName("Client Démo");
        client.setPasswordHash(passwordEncoder.encode("123456"));
        client.setEmailVerified(true);
        client.getRoles().add(clientRole);
        userRepository.save(client);

        User merchant = new User();
        merchant.setEmail("merchant@novigo.ml");
        merchant.setPhone("+22370000003");
        merchant.setFullName("Commerçant Démo");
        merchant.setPasswordHash(passwordEncoder.encode("123456"));
        merchant.setEmailVerified(true);
        merchant.getRoles().add(merchantRole);
        userRepository.save(merchant);

        User admin = new User();
        admin.setEmail("admin@novigo.ml");
        admin.setPhone("+22370000005");
        admin.setFullName("Administrateur Démo");
        admin.setPasswordHash(passwordEncoder.encode("123456"));
        admin.setEmailVerified(true);
        admin.getRoles().add(adminRole);
        userRepository.save(admin);

        User superAdmin = new User();
        superAdmin.setEmail("superadmin@novigo.ml");
        superAdmin.setPhone("+22370000006");
        superAdmin.setFullName("Super Admin Démo");
        superAdmin.setPasswordHash(passwordEncoder.encode("123456"));
        superAdmin.setEmailVerified(true);
        superAdmin.getRoles().add(superAdminRole);
        superAdmin.getRoles().add(adminRole);
        userRepository.save(superAdmin);

        // Wallet client
        Wallet wallet = new Wallet();
        wallet.setOwner(client);
        wallet.setOwnerRole("CLIENT");
        wallet.setBalance(50_000);
        walletRepository.save(wallet);

        // Boutique + produits
        Store store = new Store();
        store.setSlug("le-bafing");
        store.setName("Restaurant Le Bafing");
        store.setCategory("resto");
        store.setOwner(merchant);
        store.setCity(bamako);
        store.setDistrict("Hamdallaye ACI 2000");
        store.setRating(new BigDecimal("4.60"));
        store.setReviewCount(128);
        store.setDeliveryFee(500);
        store.setDeliveryTimeMin(30);
        storeRepository.save(store);

        Product tieb = new Product();
        tieb.setStore(store);
        tieb.setCategory(resto);
        tieb.setName("Tiéboudienne");
        tieb.setDescription("Riz au poisson, légumes et sauce tomate.");
        tieb.setPrice(2500);
        tieb.setBestSeller(true);
        tieb.setStock(50);
        tieb.setMenuSection("Plats");
        productRepository.save(tieb);

        Product yassa = new Product();
        yassa.setStore(store);
        yassa.setCategory(resto);
        yassa.setName("Poulet Yassa");
        yassa.setPrice(3000);
        yassa.setStock(40);
        yassa.setMenuSection("Plats");
        productRepository.save(yassa);

        // Commande démo
        Order order = new Order();
        order.setRef("CMD-DEMO-0001");
        order.setCustomer(client);
        order.setStore(store);
        order.setStatus("DELIVERED");
        order.setSubtotal(5500);
        order.setDeliveryFee(500);
        order.setTotal(6000);
        order.setPaymentMethod("WALLET");
        order.setPaymentStatus("PAID");
        order.setAddress("Rue 224, Hamdallaye");
        order.setDistrict("Hamdallaye ACI 2000");
        order.setPlacedAt(Instant.now());
        OrderItem it1 = new OrderItem();
        it1.setOrder(order);
        it1.setProduct(tieb);
        it1.setName(tieb.getName());
        it1.setUnitPrice(tieb.getPrice());
        it1.setQuantity(1);
        OrderItem it2 = new OrderItem();
        it2.setOrder(order);
        it2.setProduct(yassa);
        it2.setName(yassa.getName());
        it2.setUnitPrice(yassa.getPrice());
        it2.setQuantity(1);
        order.setItems(List.of(it1, it2));
        orderRepository.save(order);

        log.info("[DemoSeeder] Terminé : {} rôles, {} users, {} stores, {} products, {} orders, {} wallets.",
                roleRepository.count(), userRepository.count(), storeRepository.count(),
                productRepository.count(), orderRepository.count(), walletRepository.count());
    }

    private void seedProvider(String code, String label, int sort, int feeBps) {
        if (paymentProviderRepository.existsByCode(code)) return;
        PaymentProviderConfig cfg = new PaymentProviderConfig();
        cfg.setCode(code);
        cfg.setLabel(label);
        cfg.setSortOrder(sort);
        cfg.setFeeBps(feeBps);
        paymentProviderRepository.save(cfg);
    }

    private Role ensureRole(String code, String label) {
        return roleRepository.findByCode(code).orElseGet(() -> {
            Role r = new Role();
            r.setCode(code);
            r.setLabel(label);
            return roleRepository.save(r);
        });
    }

    private Category ensureCategory(String code, String label, String vertical) {
        return categoryRepository.findByCode(code).orElseGet(() -> {
            Category c = new Category();
            c.setCode(code);
            c.setLabel(label);
            c.setVertical(vertical);
            return categoryRepository.save(c);
        });
    }
}
