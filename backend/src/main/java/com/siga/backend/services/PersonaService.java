package com.siga.backend.services;

import com.siga.backend.dtos.PersonaRequest;
import com.siga.backend.dtos.PersonaResponse;
import com.siga.backend.model.Area;
import com.siga.backend.model.Persona;
import com.siga.backend.repository.AreaRepository;
import com.siga.backend.repository.PersonaRepository;
import com.siga.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonaService {

    private final PersonaRepository personaRepository;
    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<PersonaResponse> listar() {
        return personaRepository.findAllWithArea().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PersonaResponse crear(PersonaRequest request) {
        if (personaRepository.existsByDni(request.dni().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una persona registrada con ese DNI");
        }
        Area area = areaRepository.findById(request.idArea())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));

        Persona persona = new Persona();
        persona.setDni(request.dni().trim());
        persona.setNombres(request.nombres().trim());
        persona.setApellidos(request.apellidos().trim());
        persona.setCargo(request.cargo() != null ? request.cargo().trim() : null);
        persona.setIdarea(area);
        persona.setActivo(true);

        return toResponse(personaRepository.save(persona));
    }

    @Transactional
    public PersonaResponse actualizar(Integer id, PersonaRequest request) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));

        String nuevoDni = request.dni().trim();
        if (!persona.getDni().equals(nuevoDni) && personaRepository.existsByDni(nuevoDni)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro registro ya utiliza ese DNI");
        }
        Area area = areaRepository.findById(request.idArea())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));

        persona.setDni(request.dni().trim());
        persona.setNombres(request.nombres().trim());
        persona.setApellidos(request.apellidos().trim());
        persona.setCargo(request.cargo() != null ? request.cargo().trim() : null);
        persona.setIdarea(area);

        return toResponse(personaRepository.save(persona));
    }

    @Transactional
    public PersonaResponse cambiarEstado(Integer id, boolean activo) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));
        persona.setActivo(activo);
        return toResponse(personaRepository.save(persona));
    }

    private PersonaResponse toResponse(Persona p) {
        Area area = p.getIdarea();
        boolean tieneUsuario = usuarioRepository.existsByPersona_Id(p.getId());
        return new PersonaResponse(
                p.getId(),
                p.getDni(),
                p.getNombres(),
                p.getApellidos(),
                (p.getNombres() + " " + p.getApellidos()).trim(),
                p.getCargo(),
                area != null ? area.getId() : null,
                area != null ? area.getNombre() : "Sin área",
                p.getActivo(),
                tieneUsuario
        );
    }
}
