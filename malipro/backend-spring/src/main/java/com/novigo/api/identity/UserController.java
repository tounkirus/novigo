package com.novigo.api.identity;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.Role;
import com.novigo.domain.identity.RoleRepository;
import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Tag(name = "Identité — Utilisateurs")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public record UserView(UUID id, String email, String phone, String fullName, String avatarUrl,
                           String status, boolean emailVerified, boolean phoneVerified, List<String> roles) {}

    public record UserCreate(
            @NotBlank @Size(max = 160) String fullName,
            @Email @Size(max = 160) String email,
            @Size(max = 32) String phone,
            @Size(min = 6, max = 72) String password,
            @NotEmpty List<String> roles) {}

    public record UserUpdate(
            @Size(max = 160) String fullName,
            @Size(max = 400) String avatarUrl,
            @Size(max = 24) String status) {}

    public record RoleAssignment(@NotEmpty List<String> roles) {}

    @Operation(summary = "Lister les utilisateurs (recherche, filtre statut) — ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<UserView> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<User> page = repository.findAll(Specs.all(
                Specs.search(q, "fullName", "email", "phone"), Specs.eq("status", status)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir un utilisateur — ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public UserView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Créer un utilisateur — ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public UserView create(@Valid @RequestBody UserCreate req) {
        if (req.email() != null && !req.email().isBlank() && repository.existsByEmailIgnoreCase(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email déjà utilisé.");
        }
        if (req.phone() != null && !req.phone().isBlank() && repository.existsByPhone(req.phone())) {
            throw new ApiException(HttpStatus.CONFLICT, "Téléphone déjà utilisé.");
        }
        User u = new User();
        u.setFullName(req.fullName());
        if (req.email() != null && !req.email().isBlank()) u.setEmail(req.email().toLowerCase());
        if (req.phone() != null && !req.phone().isBlank()) u.setPhone(req.phone());
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        u.setRoles(resolveRoles(req.roles()));
        return toView(repository.save(u));
    }

    @Operation(summary = "Mettre à jour un utilisateur — ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public UserView update(@PathVariable UUID id, @Valid @RequestBody UserUpdate req) {
        User u = find(id);
        if (req.fullName() != null) u.setFullName(req.fullName());
        if (req.avatarUrl() != null) u.setAvatarUrl(req.avatarUrl());
        if (req.status() != null) u.setStatus(req.status());
        return toView(repository.save(u));
    }

    @Operation(summary = "Réaffecter les rôles d'un utilisateur — ADMIN")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}/roles")
    @Transactional
    public UserView setRoles(@PathVariable UUID id, @Valid @RequestBody RoleAssignment req) {
        User u = find(id);
        u.setRoles(resolveRoles(req.roles()));
        return toView(repository.save(u));
    }

    @Operation(summary = "Supprimer un utilisateur — SUPER_ADMIN")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(find(id));
    }

    private User find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Utilisateur", id));
    }

    private Set<Role> resolveRoles(List<String> codes) {
        Set<Role> result = new java.util.HashSet<>();
        for (String code : codes) {
            result.add(roleRepository.findByCode(code)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Rôle inconnu : " + code)));
        }
        return result;
    }

    private UserView toView(User u) {
        return new UserView(u.getId(), u.getEmail(), u.getPhone(), u.getFullName(), u.getAvatarUrl(),
                u.getStatus(), u.isEmailVerified(), u.isPhoneVerified(),
                u.getRoles().stream().map(Role::getCode).sorted().toList());
    }
}
