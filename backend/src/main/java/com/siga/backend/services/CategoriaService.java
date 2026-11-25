package com.siga.backend.services;

import com.siga.backend.dtos.CategoriaRequest;
import com.siga.backend.dtos.CategoriaResponse;
import com.siga.backend.model.Categoria;
import com.siga.backend.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(boolean soloActivas) {
        List<Categoria> lista = soloActivas
                ? categoriaRepository.findActivasWithPadre()
                : categoriaRepository.findAllWithPadre();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoriaResponse crear(CategoriaRequest request) {
        String codigo = request.codigo().trim();
        if (categoriaRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta contable con ese código");
        }

        Categoria padre = null;
        if (request.idPadre() != null) {
            padre = categoriaRepository.findById(request.idPadre())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta padre no encontrada"));
        }

        Categoria cat = new Categoria();
        cat.setCodigo(codigo);
        cat.setNombre(request.nombre().trim());
        cat.setIdpadre(padre);
        cat.setActivo(true);

        return toResponse(categoriaRepository.save(cat));
    }

    @Transactional
    public CategoriaResponse actualizar(Integer id, CategoriaRequest request) {
        Categoria cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta contable no encontrada"));

        String codigo = request.codigo().trim();
        if (categoriaRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otra cuenta ya utiliza ese código");
        }

        Categoria padre = null;
        if (request.idPadre() != null) {
            if (request.idPadre().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Una cuenta no puede ser padre de sí misma");
            }
            padre = categoriaRepository.findById(request.idPadre())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta padre no encontrada"));
        }

        cat.setCodigo(codigo);
        cat.setNombre(request.nombre().trim());
        cat.setIdpadre(padre);

        return toResponse(categoriaRepository.save(cat));
    }

    @Transactional
    public CategoriaResponse cambiarEstado(Integer id, boolean activo) {
        Categoria cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta contable no encontrada"));
        cat.setActivo(activo);
        return toResponse(categoriaRepository.save(cat));
    }

    private CategoriaResponse toResponse(Categoria c) {
        Categoria padre = c.getIdpadre();
        return new CategoriaResponse(
                c.getId(),
                c.getCodigo(),
                c.getNombre(),
                padre != null ? padre.getId() : null,
                padre != null ? padre.getCodigo() : null,
                padre != null ? padre.getNombre() : null,
                c.getActivo()
        );
    }
}
