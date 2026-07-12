package com.novigo.api.cash;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.cash.*;
import com.novigo.domain.identity.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Finance — Gestion de caisse (Cash)")
@RestController
@RequestMapping("/api/v1/cash/sessions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DRIVER','MERCHANT','ADMIN','SUPER_ADMIN')")
public class CashController {

    private final CashSessionRepository sessionRepository;
    private final CashMovementRepository movementRepository;
    private final UserRepository userRepository;

    public record SessionView(UUID id, UUID agentId, long openingBalance, Long closingBalance,
                              long expectedBalance, Long countedBalance, long variance, String status,
                              Instant openedAt, Instant closedAt) {}

    public record OpenSession(UUID agentId, long openingBalance) {}

    public record CloseSession(@Positive long countedBalance) {}

    public record MovementView(UUID id, UUID sessionId, String type, long amount, String reference, String reason) {}

    public record MovementCreate(@NotBlank @Size(max = 24) String type, @Positive long amount,
                                 @Size(max = 40) String reference, @Size(max = 240) String reason) {}

    @Operation(summary = "Lister les sessions de caisse (filtre statut/agent)")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<SessionView> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID agentId,
            @PageableDefault(size = 20, sort = "openedAt") Pageable pageable) {
        Page<CashSession> page = sessionRepository.findAll(Specs.all(
                Specs.eq("status", status), Specs.joinEq("agent", "id", agentId)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Ouvrir une session de caisse")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SessionView open(@Valid @RequestBody OpenSession req) {
        CashSession s = new CashSession();
        if (req.agentId() != null) {
            s.setAgent(userRepository.findById(req.agentId())
                    .orElseThrow(() -> NotFoundException.of("Agent", req.agentId())));
        }
        s.setOpeningBalance(req.openingBalance());
        s.setExpectedBalance(req.openingBalance());
        s.setStatus("OPEN");
        s.setOpenedAt(Instant.now());
        return toView(sessionRepository.save(s));
    }

    @Operation(summary = "Obtenir une session de caisse")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public SessionView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Enregistrer un mouvement de caisse (entrée/sortie)")
    @PostMapping("/{id}/movements")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MovementView addMovement(@PathVariable UUID id, @Valid @RequestBody MovementCreate req) {
        CashSession s = find(id);
        if (!"OPEN".equals(s.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Session déjà clôturée.");
        }
        CashMovement m = new CashMovement();
        m.setSession(s);
        m.setType(req.type());
        m.setAmount(req.amount());
        m.setReference(req.reference());
        m.setReason(req.reason());
        movementRepository.save(m);
        long delta = "OUT".equalsIgnoreCase(req.type()) ? -req.amount() : req.amount();
        s.setExpectedBalance(s.getExpectedBalance() + delta);
        sessionRepository.save(s);
        return toMovement(m);
    }

    @Operation(summary = "Lister les mouvements d'une session")
    @GetMapping("/{id}/movements")
    @Transactional(readOnly = true)
    public PageResponse<MovementView> movements(
            @PathVariable UUID id, @PageableDefault(size = 50, sort = "createdAt") Pageable pageable) {
        Page<CashMovement> page = movementRepository.findBySessionId(id, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toMovement).toList());
    }

    @Operation(summary = "Clôturer une session (rapprochement, calcul de l'écart)")
    @PostMapping("/{id}/close")
    @Transactional
    public SessionView close(@PathVariable UUID id, @Valid @RequestBody CloseSession req) {
        CashSession s = find(id);
        if (!"OPEN".equals(s.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Session déjà clôturée.");
        }
        s.setCountedBalance(req.countedBalance());
        s.setClosingBalance(req.countedBalance());
        s.setVariance(req.countedBalance() - s.getExpectedBalance());
        s.setStatus("CLOSED");
        s.setClosedAt(Instant.now());
        return toView(sessionRepository.save(s));
    }

    private CashSession find(UUID id) {
        return sessionRepository.findById(id).orElseThrow(() -> NotFoundException.of("Session de caisse", id));
    }

    private SessionView toView(CashSession s) {
        return new SessionView(s.getId(), s.getAgent() == null ? null : s.getAgent().getId(),
                s.getOpeningBalance(), s.getClosingBalance(), s.getExpectedBalance(), s.getCountedBalance(),
                s.getVariance(), s.getStatus(), s.getOpenedAt(), s.getClosedAt());
    }

    private MovementView toMovement(CashMovement m) {
        return new MovementView(m.getId(), m.getSession().getId(), m.getType(), m.getAmount(),
                m.getReference(), m.getReason());
    }
}
