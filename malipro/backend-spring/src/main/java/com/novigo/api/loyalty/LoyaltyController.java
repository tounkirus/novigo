package com.novigo.api.loyalty;

import com.novigo.api.loyalty.LoyaltyService.*;
import com.novigo.auth.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Fidélité — Points & récompenses")
@RestController
@RequestMapping("/api/v1/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService service;

    @Operation(summary = "Mon solde de points et palier")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public AccountView me(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.me(principal.userId());
    }

    @Operation(summary = "Historique de mes points")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/history")
    public List<EntryView> history(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.history(principal.userId());
    }

    @Operation(summary = "Récompenses échangeables (avec accessibilité selon mon solde)")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/rewards")
    public List<RewardView> rewards(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.rewards(principal.userId());
    }

    @Operation(summary = "Échanger des points contre une récompense")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/rewards/{id}/redeem")
    public AccountView redeem(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable String id) {
        return service.redeem(principal.userId(), id);
    }
}
