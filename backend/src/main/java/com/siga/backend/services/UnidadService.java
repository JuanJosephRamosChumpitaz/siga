package com.siga.backend.services;

import com.siga.backend.dtos.UnidadRequest;
import com.siga.backend.dtos.UnidadResponse;
import com.siga.backend.model.Unidad;
import com.siga.backend.repository.UnidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UnidadService {

    private final UnidadRepository unidadRepository;

    @Transactional(readOnly = true)
    public List<UnidadResponse> listar(boolean soloActivas) {
        List<Unidad> lista = soloActivas
                ? unidadRepository.findByActivoTrueOrderByNombreAsc()
                : unidadRepository.findAllByOrderByNombreAsc();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional
    public UnidadResponse crear(UnidadRequest request) {
        String nombre = request.nombre().trim();
        if (unidadRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una unidad de medida con ese nombre");
        }
        Unidad u = new Unidad();
        u.setNombre(nombre);
        u.setAbreviatura(limpiarTexto(request.abreviatura()));
        u.setActivo(true);
        return toResponse(unidadRepository.save(u));
    }

    @Transactional
    public UnidadResponse actualizar(Integer id, UnidadRequest request) {
        Unidad u = unidadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada"));
        String nombre = request.nombre().trim();
        if (unidadRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otra unidad ya utiliza ese nombre");
        }
        u.setNombre(nombre);
        u.setAbreviatura(limpiarTexto(request.abreviatura()));
        return toResponse(unidadRepository.save(u));
    }

    @Transactional
    public UnidadResponse cambiarEstado(Integer id, boolean activo) {
        Unidad u = unidadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada"));
        u.setActivo(activo);
        return toResponse(unidadRepository.save(u));
    }

    private String limpiarTexto(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    private UnidadResponse toResponse(Unidad u) {
        return new UnidadResponse(u.getId(), u.getNombre(), u.getAbreviatura(), u.getActivo());
    }
}