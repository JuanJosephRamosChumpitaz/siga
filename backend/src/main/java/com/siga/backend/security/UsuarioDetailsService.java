package com.siga.backend.security;


import com.siga.backend.model.Usuario;
import com.siga.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioDetailsService implements UserDetailsService {
    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        Usuario u = usuarioRepository.buscarPorUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("usuario no encontrado"));
        return User.withUsername(u.getUsername())
                .password(u.getPassword())
                .authorities("ROLE_" + u.getRol().getNombre().toUpperCase())
                .build();
    }
}
