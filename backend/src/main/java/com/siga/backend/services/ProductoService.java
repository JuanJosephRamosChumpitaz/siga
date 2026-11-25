package com.siga.backend.services;

import com.siga.backend.dtos.ProductoRequest;
import com.siga.backend.dtos.ProductoResponse;
import com.siga.backend.model.Categoria;
import com.siga.backend.model.Producto;
import com.siga.backend.model.Unidad;
import com.siga.backend.repository.CategoriaRepository;
import com.siga.backend.repository.ProductoRepository;
import com.siga.backend.repository.UnidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final UnidadRepository unidadRepository;

    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(boolean soloActivos) {
        List<Producto> lista = soloActivos
                ? productoRepository.findActivosWithDetails()
                : productoRepository.findAllWithDetails();
        return lista.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse buscarPorCodigo(String codigo) {
        String limpio = codigo.trim();
        Producto p = productoRepository.buscarPorCodigoEscaneado(limpio)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe ningún bien con el código: " + limpio
                ));
        return toResponse(p);
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        String codigoInterno = limpiarTexto(request.codigoInterno());
        String codigoBarra = limpiarTexto(request.codigoBarra());

        if (codigoInterno != null && productoRepository.existsByCodigoInternoIgnoreCase(codigoInterno)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un bien con ese código interno");
        }
        if (codigoBarra != null && productoRepository.existsByCodigoBarra(codigoBarra)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un bien con ese código de barras/QR");
        }

        Categoria categoria = categoriaRepository.findById(request.idCategoria())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta contable no encontrada"));
        Unidad unidad = unidadRepository.findById(request.idUnidad())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad de medida no encontrada"));

        Producto p = new Producto();
        p.setNombre(request.nombre().trim());
        p.setCodigoInterno(codigoInterno);
        p.setCodigoBarra(codigoBarra);
        p.setMarcaSerie(limpiarTexto(request.marcaSerie()));
        p.setTipoBien(limpiarTexto(request.tipoBien()));
        p.setCuenta(categoria.getCodigo());
        p.setPrecioUnidad(request.precioUnidad() != null ? request.precioUnidad() : BigDecimal.ZERO);
        p.setStockGeneral(BigDecimal.ZERO);
        p.setStockMinimo(request.stockMinimo() != null ? request.stockMinimo() : BigDecimal.ZERO);
        p.setConsumoMensualAprox(request.consumoMensualAprox() != null ? request.consumoMensualAprox() : BigDecimal.ZERO);
        p.setPerecible(Boolean.TRUE.equals(request.perecible()));
        p.setIdcategoria(categoria);
        p.setIdunidad(unidad);
        p.setActivo(true);

        Producto guardado = productoRepository.save(p);

        if (guardado.getCodigoInterno() == null) {
            guardado.setCodigoInterno(String.format("SIGA-%04d", guardado.getId()));
            guardado = productoRepository.save(guardado);
        }

        return toResponse(guardado);
    }

    @Transactional
    public ProductoResponse actualizar(Integer id, ProductoRequest request) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        String codigoInterno = limpiarTexto(request.codigoInterno());
        String codigoBarra = limpiarTexto(request.codigoBarra());

        if (codigoInterno != null && productoRepository.existsByCodigoInternoIgnoreCaseAndIdNot(codigoInterno, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro bien ya utiliza ese código interno");
        }
        if (codigoBarra != null && productoRepository.existsByCodigoBarraAndIdNot(codigoBarra, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro bien ya utiliza ese código de barras/QR");
        }

        Categoria categoria = categoriaRepository.findById(request.idCategoria())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta contable no encontrada"));
        Unidad unidad = unidadRepository.findById(request.idUnidad())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad de medida no encontrada"));

        p.setNombre(request.nombre().trim());
        p.setCodigoInterno(codigoInterno != null ? codigoInterno : p.getCodigoInterno());
        p.setCodigoBarra(codigoBarra);
        p.setMarcaSerie(limpiarTexto(request.marcaSerie()));
        p.setTipoBien(limpiarTexto(request.tipoBien()));
        p.setCuenta(categoria.getCodigo());
        p.setPrecioUnidad(request.precioUnidad() != null ? request.precioUnidad() : BigDecimal.ZERO);
        p.setStockMinimo(request.stockMinimo() != null ? request.stockMinimo() : BigDecimal.ZERO);
        p.setConsumoMensualAprox(request.consumoMensualAprox() != null ? request.consumoMensualAprox() : BigDecimal.ZERO);
        p.setPerecible(Boolean.TRUE.equals(request.perecible()));
        p.setIdcategoria(categoria);
        p.setIdunidad(unidad);

        return toResponse(productoRepository.save(p));
    }

    @Transactional
    public ProductoResponse cambiarEstado(Integer id, boolean activo) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
        p.setActivo(activo);
        return toResponse(productoRepository.save(p));
    }

    private String limpiarTexto(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    private ProductoResponse toResponse(Producto p) {
        Categoria c = p.getIdcategoria();
        Unidad u = p.getIdunidad();
        return new ProductoResponse(
                p.getId(),
                p.getCodigoInterno(),
                p.getCodigoBarra(),
                p.getNombre(),
                p.getMarcaSerie(),
                p.getTipoBien(),
                p.getPrecioUnidad(),
                p.getStockGeneral(),
                p.getStockMinimo(),
                p.getConsumoMensualAprox(),
                p.getPerecible(),
                c != null ? c.getId() : null,
                c != null ? c.getCodigo() : p.getCuenta(),
                c != null ? c.getNombre() : "Sin cuenta",
                u != null ? u.getId() : null,
                u != null ? u.getNombre() : "Sin unidad",
                u != null ? u.getAbreviatura() : "",
                p.getActivo()
        );
    }
}
