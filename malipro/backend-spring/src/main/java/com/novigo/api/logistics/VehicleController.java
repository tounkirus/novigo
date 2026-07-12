package com.novigo.api.logistics;

import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.logistics.Vehicle;
import com.novigo.domain.logistics.VehicleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Logistique — Véhicules")
@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository repository;

    public record VehicleView(UUID id, String type, String plate, String model, String color) {}

    public record VehicleUpsert(@NotBlank @Size(max = 24) String type, @Size(max = 40) String plate,
                                @Size(max = 80) String model, @Size(max = 40) String color) {}

    @Operation(summary = "Lister les véhicules")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN','SUPER_ADMIN')")
    @GetMapping
    @Transactional(readOnly = true)
    public List<VehicleView> list() {
        return repository.findAll().stream().map(this::toView).toList();
    }

    @Operation(summary = "Créer un véhicule")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public VehicleView create(@Valid @RequestBody VehicleUpsert req) {
        Vehicle v = new Vehicle();
        v.setType(req.type());
        v.setPlate(req.plate());
        v.setModel(req.model());
        v.setColor(req.color());
        return toView(repository.save(v));
    }

    @Operation(summary = "Mettre à jour un véhicule")
    @PreAuthorize("hasAnyRole('DRIVER','ADMIN','SUPER_ADMIN')")
    @PutMapping("/{id}")
    @Transactional
    public VehicleView update(@PathVariable UUID id, @Valid @RequestBody VehicleUpsert req) {
        Vehicle v = repository.findById(id).orElseThrow(() -> NotFoundException.of("Véhicule", id));
        v.setType(req.type());
        v.setPlate(req.plate());
        v.setModel(req.model());
        v.setColor(req.color());
        return toView(repository.save(v));
    }

    @Operation(summary = "Supprimer un véhicule")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id) {
        repository.delete(repository.findById(id).orElseThrow(() -> NotFoundException.of("Véhicule", id)));
    }

    private VehicleView toView(Vehicle v) {
        return new VehicleView(v.getId(), v.getType(), v.getPlate(), v.getModel(), v.getColor());
    }
}
