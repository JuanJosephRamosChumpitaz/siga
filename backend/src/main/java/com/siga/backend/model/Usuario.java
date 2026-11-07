package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idusuario", nullable = false)
    private Integer id;

    @Column(name = "user", nullable = false, length = 45)
    private String username;

    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona")
    private Persona persona; // Lombok generará automáticamente getPersona() y setPersona()

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idrol")
    private Rol rol; // Lombok generará automáticamente getRol() y setRol()
}
