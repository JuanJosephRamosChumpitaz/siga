package com.siga.backend.services;

import com.siga.backend.dtos.AreaRequest;
import com.siga.backend.dtos.AreaResponse;
import com.siga.backend.model.Area;
import com.siga.backend.repository.AreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaService {

    private final AreaRepository areaRepository;

    @Transactional(readOnly = true)
    public List<AreaResponse> listar(boolean soloActivas) {
        List<Area> lista = soloActivas
                ? areaRepository.findByActivoTrueOrderByNombreAsc()
                : areaRepository.findAllByOrderByNombreAsc();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AreaResponse crear(AreaRequest request) {
        String nombre = request.nombre().trim();
        if (areaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un área con ese nombre");
        }
        Area area = new Area();
        area.setNombre(nombre);
        area.setDescripcion(request.descripcion() != null ? request.descripcion().trim() : null);
        area.setActivo(true);
        return toResponse(areaRepository.save(area));
    }

    @Transactional
    public AreaResponse actualizar(Integer id, AreaRequest request) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));
        String nombre = request.nombre().trim();
        if (areaRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otra área con ese nombre");
        }
        area.setNombre(nombre);
        area.setDescripcion(request.descripcion() != null ? request.descripcion().trim() : null);
        return toResponse(areaRepository.save(area));
    }

    @Transactional
    public AreaResponse cambiarEstado(Integer id, boolean activo) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));
        area.setActivo(activo);
        return toResponse(areaRepository.save(area));
    }

    private AreaResponse toResponse(Area a) {
        return new AreaResponse(a.getId(), a.getNombre(), a.getDescripcion(), a.getActivo());
    }
}
