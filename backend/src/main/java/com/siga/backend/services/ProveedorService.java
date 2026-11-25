package com.siga.backend.services;

import com.siga.backend.dtos.ProveedorRequest;
import com.siga.backend.dtos.ProveedorResponse;
import com.siga.backend.model.Proveedor;
import com.siga.backend.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listar(boolean soloActivos) {
        List<Proveedor> lista = soloActivos
                ? proveedorRepository.findByActivoTrueOrderByRazonSocialAsc()
                : proveedorRepository.findAllByOrderByRazonSocialAsc();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProveedorResponse crear(ProveedorRequest request) {
        String ruc = request.ruc().trim();
        if (proveedorRepository.existsByRuc(ruc)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un proveedor registrado con ese RUC");
        }
        Proveedor p = new Proveedor();
        p.setRuc(ruc);
        p.setRazonSocial(request.razonSocial().trim());
        p.setDireccion(limpiarTexto(request.direccion()));
        p.setTelefono(limpiarTexto(request.telefono()));
        p.setEmail(limpiarTexto(request.email()));
        p.setActivo(true);
        return toResponse(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorResponse actualizar(Integer id, ProveedorRequest request) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));
        String ruc = request.ruc().trim();
        if (proveedorRepository.existsByRucAndIdProveedorNot(ruc, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro proveedor ya utiliza ese RUC");
        }
        p.setRuc(ruc);
        p.setRazonSocial(request.razonSocial().trim());
        p.setDireccion(limpiarTexto(request.direccion()));
        p.setTelefono(limpiarTexto(request.telefono()));
        p.setEmail(limpiarTexto(request.email()));
        return toResponse(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorResponse cambiarEstado(Integer id, boolean activo) {
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));
        p.setActivo(activo);
        return toResponse(proveedorRepository.save(p));
    }

    private String limpiarTexto(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    private ProveedorResponse toResponse(Proveedor p) {
        return new ProveedorResponse(
                p.getIdProveedor(),
                p.getRuc(),
                p.getRazonSocial(),
                p.getDireccion(),
                p.getTelefono(),
                p.getEmail(),
                p.getActivo()
        );
    }
}