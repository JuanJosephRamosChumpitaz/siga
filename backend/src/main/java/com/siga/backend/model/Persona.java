package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "persona")
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpersona", nullable = false)
    private Integer id;

    @Column(name = "dni", nullable = false, length = 8)
    private String dni;

    @Column(name = "nombres", nullable = false, length = 45)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 45)
    private String apellidos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idarea")
    private Area idarea; // Clave foránea hacia Area (Nuleable según el diagrama)

    @Column(name = "cargo", length = 100)
    private String cargo;
}
