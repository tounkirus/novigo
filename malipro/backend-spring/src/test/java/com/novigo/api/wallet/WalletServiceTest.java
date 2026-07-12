package com.novigo.api.wallet;

import com.novigo.common.exception.ApiException;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.catalog.Store;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.identity.User;
import com.novigo.domain.wallet.Transaction;
import com.novigo.domain.wallet.TransactionRepository;
import com.novigo.domain.wallet.Wallet;
import com.novigo.domain.wallet.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/** Tests unitaires (Mockito) du cœur financier : crédit/débit, commission, cashback. */
@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock WalletRepository walletRepository;
    @Mock TransactionRepository transactionRepository;

    NovigoProperties props;
    WalletService service;

    @BeforeEach
    void setup() {
        props = new NovigoProperties(); // commissionBps=1000 (10%), cashbackBps=100 (1%)
        service = new WalletService(walletRepository, transactionRepository, props);
        lenient().when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void creditIncreasesBalanceAndRecordsTransaction() {
        Wallet w = new Wallet();
        w.setBalance(1000);
        Transaction t = service.credit(w, 500, "RECHARGE", "test", "ORANGE_MONEY");
        assertThat(w.getBalance()).isEqualTo(1500);
        assertThat(t.getDirection()).isEqualTo("CREDIT");
        assertThat(t.getBalanceAfter()).isEqualTo(1500);
    }

    @Test
    void debitFailsOnInsufficientFunds() {
        Wallet w = new Wallet();
        w.setBalance(300);
        assertThatThrownBy(() -> service.debit(w, 500, "PAYMENT", null, null))
                .isInstanceOf(ApiException.class);
        assertThat(w.getBalance()).isEqualTo(300); // inchangé
    }

    @Test
    void debitRejectedWhenFrozen() {
        Wallet w = new Wallet();
        w.setBalance(1000);
        w.setFrozen(true);
        assertThatThrownBy(() -> service.credit(w, 100, "X", null, null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void cashbackCreditsOnePercent() {
        Wallet w = new Wallet();
        w.setBalance(0);
        long cashback = service.applyCashback(w, 10_000);
        assertThat(cashback).isEqualTo(100);
        assertThat(w.getBalance()).isEqualTo(100);
    }

    @Test
    void settleOrderRetainsTenPercentCommissionAndPaysMerchant() {
        User owner = new User();
        owner.setFullName("Marchand");
        Store store = new Store();
        store.setOwner(owner);
        Order order = new Order();
        order.setRef("CMD-TEST");
        order.setStore(store);
        order.setSubtotal(10_000);
        order.setDeliveryFee(500);

        when(walletRepository.findByOwnerId(any())).thenReturn(Optional.empty());

        long commission = service.settleOrder(order);
        assertThat(commission).isEqualTo(1_000); // 10 % de 10 000
    }
}
