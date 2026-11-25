import { useEffect, useState } from 'react';
import { Printer, Download, ClipboardList, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { catalogoService } from '../services/catalogoService';
import { reporteService } from '../services/reporteService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

function formatearFecha(iso) {
  if (!iso) return '—';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function KardexView() {
  const [productos, setProductos] = useState([]);
  const [idProducto, setIdProducto] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modoVista, setModoVista] = useState('valorado'); // 'valorado' | 'control_visible'

  const [kardex, setKardex] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    catalogoService
        .listarProductos(false)
        .then((data) => setProductos(data))
        .catch(() => setError('No se pudo cargar la lista de bienes.'));
  }, []);

  useEffect(() => {
    if (!idProducto) {
      setKardex(null);
      return;
    }
    setCargando(true);
    setError('');
    reporteService
        .consultarKardex(idProducto, desde, hasta)
        .then((data) => setKardex(data))
        .catch((err) => setError(err.response?.data?.message || 'No se pudo consultar el Kardex.'))
        .finally(() => setCargando(false));
  }, [idProducto, desde, hasta]);

  const pag = usePaginacion(kardex?.movimientos || [], 15);

  const exportarCsv = () => {
    if (!kardex) return;
    const encabezados = [
      'Fecha',
      'Documento',
      'Tipo',
      'Area/Proveedor',
      'Solicitante',
      'Cant. Entrada',
      'Cant. Salida',
      'Saldo Cant.',
      'Costo Unit.',
      'Imp. Entrada',
      'Imp. Salida',
      'Saldo Valorizado (PEPS)',
      'Observacion',
    ];
    const filas = kardex.movimientos.map((m) => [
      formatearFecha(m.fecha),
      m.documentoReferencia,
      m.tipoMovimiento,
      m.areaNombre || m.proveedorNombre || '',
      m.solicitanteNombre || '',
      Number(m.cantidadEntrada).toFixed(2),
      Number(m.cantidadSalida).toFixed(2),
      Number(m.saldoCantidad).toFixed(2),
      Number(m.costoUnitario).toFixed(2),
      Number(m.importeEntrada).toFixed(2),
      Number(m.importeSalida).toFixed(2),
      Number(m.saldoValorizado).toFixed(2),
      (m.observacion || '').replaceAll(',', ';'),
    ]);
    const csv = [encabezados.join(','), ...filas.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kardex_${kardex.codigoInterno || kardex.idProducto}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Impresión formato "EXISTENCIAS VALORADAS DE ALMACÉN" (ficha oficial IESTP Cañete)
  const imprimirExistenciasValoradas = () => {
    if (!kardex) return;
    const filas = kardex.movimientos
        .map(
            (m) => `
        <tr>
          <td style="text-align:center;">${formatearFecha(m.fecha)}</td>
          <td>${m.areaNombre || m.documentoReferencia}</td>
          <td>${m.proveedorNombre || (m.tipoMovimiento === 'ENTRADA' ? m.documentoReferencia : '—')}</td>
          <td style="text-align:right;">${Number(m.cantidadEntrada) > 0 ? Number(m.cantidadEntrada).toFixed(2) : ''}</td>
          <td style="text-align:right;">${Number(m.cantidadSalida) > 0 ? Number(m.cantidadSalida).toFixed(2) : ''}</td>
          <td style="text-align:right; font-weight:bold;">${Number(m.saldoCantidad).toFixed(2)}</td>
          <td>${m.solicitanteNombre || '—'}</td>
          <td style="text-align:right;">${Number(m.costoUnitario).toFixed(2)}</td>
          <td style="text-align:right;">${Number(m.importeEntrada) > 0 ? Number(m.importeEntrada).toFixed(2) : ''}</td>
          <td style="text-align:right;">${Number(m.importeSalida) > 0 ? Number(m.importeSalida).toFixed(2) : ''}</td>
          <td style="text-align:right; font-weight:bold;">${Number(m.saldoValorizado).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

    const ventana = window.open('', '_blank', 'width=1060,height=740');
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Existencias Valoradas - ${kardex.nombreProducto}</title>
          <style>
            @page { size: landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
            h2 { text-align: center; margin: 0 0 12px; font-size: 16px; letter-spacing: 0.5px; }
            .cab { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .cab td { padding: 4px 6px; }
            .tabla { width: 100%; border-collapse: collapse; font-size: 11px; }
            .tabla th, .tabla td { border: 1px solid #222; padding: 5px; }
            .tabla th { background: #e8f5ee; text-align: center; }
          </style>
        </head>
        <body>
          <h2>EXISTENCIAS VALORADAS DE ALMACÉN (MÉTODO PEPS) — IESTP CAÑETE</h2>
          <table class="cab">
            <tr>
              <td><strong>ARTÍCULO:</strong> ${kardex.nombreProducto} (${kardex.codigoInterno || ''})</td>
              <td><strong>MARCA Y SERIE:</strong> ${kardex.marcaSerie || '—'}</td>
              <td><strong>CUENTA CONTABLE:</strong> ${kardex.codigoCuenta || '—'}</td>
            </tr>
            <tr>
              <td><strong>UNIDAD DE MEDIDA:</strong> ${kardex.unidadMedida}</td>
              <td><strong>CONSUMO MENS. APROX.:</strong> ${Number(kardex.consumoMensualAprox || 0).toFixed(2)}</td>
              <td><strong>SALDO ACTUAL:</strong> ${Number(kardex.stockActual).toFixed(2)} (S/ ${Number(kardex.valorizadoActual).toFixed(2)})</td>
            </tr>
          </table>
          <table class="tabla">
            <thead>
              <tr>
                <th rowspan="2">FECHA</th>
                <th colspan="2">COMPROBANTE</th>
                <th colspan="3">CANTIDAD</th>
                <th rowspan="2">SOLICITANTE</th>
                <th rowspan="2">COSTO UNIT.</th>
                <th colspan="3">IMPORTE (S/)</th>
              </tr>
              <tr>
                <th>ÁREA / DOC.</th>
                <th>PROVEEDOR</th>
                <th>ENTRADA</th>
                <th>SALIDA</th>
                <th>SALDO</th>
                <th>ENTRADA</th>
                <th>SALIDA</th>
                <th>SALDO</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // Impresión formato "CONTROL VISIBLE" (tarjeta diaria sin precios para estante)
  const imprimirControlVisible = () => {
    if (!kardex) return;
    const filas = kardex.movimientos
        .map(
            (m) => `
        <tr>
          <td style="text-align:center;">${formatearFecha(m.fecha)}</td>
          <td style="text-align:right;">${Number(m.cantidadEntrada) > 0 ? Number(m.cantidadEntrada).toFixed(2) : ''}</td>
          <td style="text-align:right;">${Number(m.cantidadSalida) > 0 ? Number(m.cantidadSalida).toFixed(2) : ''}</td>
          <td>${m.areaNombre || m.observacion || m.documentoReferencia}</td>
          <td style="text-align:right; font-weight:bold;">${Number(m.saldoCantidad).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

    const ventana = window.open('', '_blank', 'width=640,height=780');
    if (!ventana) return;
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Control Visible - ${kardex.nombreProducto}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
            .card { border: 2px solid #111; padding: 14px; }
            h2 { text-align: center; margin: 0 0 8px; font-size: 18px; }
            .prod { font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #111; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #111; padding: 6px; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>CONTROL VISIBLE</h2>
            <div class="prod">PRODUCTO: ${kardex.nombreProducto} (${kardex.unidadMedida})</div>
            <table>
              <thead>
                <tr>
                  <th style="width:95px;">FECHA</th>
                  <th style="width:80px;">ENTRADA</th>
                  <th style="width:80px;">SALIDA</th>
                  <th>OBSERVACIÓN</th>
                  <th style="width:80px;">SALDO</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#064c32]">Kardex Valorizado (PEPS) y Control Visible</h2>
            <p className="text-base text-slate-600 mt-1">
              Trazabilidad histórica de entradas, salidas por lote PEPS, ajustes de inventario y tarjeta diaria de estante.
            </p>
          </div>

          {kardex && (
              <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={imprimirExistenciasValoradas}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
                >
                  <Printer className="w-5 h-5" /> Existencias Valoradas
                </button>
                <button
                    type="button"
                    onClick={imprimirControlVisible}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#064c32] text-[#064c32] hover:bg-emerald-50 text-base font-semibold cursor-pointer"
                >
                  <ClipboardList className="w-5 h-5" /> Control Visible
                </button>
                <button
                    type="button"
                    onClick={exportarCsv}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-base font-medium cursor-pointer"
                >
                  <Download className="w-5 h-5" /> CSV
                </button>
              </div>
          )}
        </div>

        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-base font-medium text-slate-700 mb-1">Producto / Bien *</label>
            <select
                value={idProducto}
                onChange={(e) => {
                  setIdProducto(e.target.value);
                  pag.reiniciarPagina();
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-base"
            >
              <option value="">Selecciona un bien para consultar su Kardex...</option>
              {productos.map((p) => (
                  <option key={p.idProducto} value={p.idProducto}>
                    {p.codigoInterno} — {p.nombre} ({p.nombreUnidad})
                  </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">Fecha desde</label>
            <input
                type="date"
                value={desde}
                onChange={(e) => {
                  setDesde(e.target.value);
                  pag.reiniciarPagina();
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">Fecha hasta</label>
            <input
                type="date"
                value={hasta}
                onChange={(e) => {
                  setHasta(e.target.value);
                  pag.reiniciarPagina();
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
            />
          </div>
        </div>

        {/* Selector de formato */}
        {kardex && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setModoVista('valorado')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold cursor-pointer ${
                        modoVista === 'valorado'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                >
                  <FileSpreadsheet className="w-5 h-5" /> Existencias Valoradas (PEPS)
                </button>
                <button
                    type="button"
                    onClick={() => setModoVista('control_visible')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold cursor-pointer ${
                        modoVista === 'control_visible'
                            ? 'bg-[#064c32] text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                >
                  <ClipboardList className="w-5 h-5" /> Tarjeta Control Visible
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-xl text-base">
                <span className="text-slate-700">Saldo Actual: </span>
                <strong className="text-[#064c32]">
                  {Number(kardex.stockActual).toFixed(2)} {kardex.unidadMedida}
                </strong>
                <span className="mx-2 text-slate-400">|</span>
                <span className="text-slate-700">Valor PEPS: </span>
                <strong className="text-[#064c32]">S/ {Number(kardex.valorizadoActual).toFixed(2)}</strong>
              </div>
            </div>
        )}

        {/* Tabla principal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {!idProducto ? (
              <div className="p-12 text-center text-lg text-slate-500">
                Selecciona un producto en la parte superior para visualizar su Kardex PEPS o su Control Visible.
              </div>
          ) : cargando ? (
              <div className="p-12 text-center text-lg text-slate-500">Consultando movimientos...</div>
          ) : kardex && modoVista === 'valorado' ? (
              <>
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-6 text-sm text-slate-700">
                  <span><strong>Cuenta Contable:</strong> {kardex.codigoCuenta || '—'} ({kardex.nombreCuenta})</span>
                  <span><strong>Marca y Serie:</strong> {kardex.marcaSerie || '—'}</span>
                  <span><strong>Consumo Mensual Aprox.:</strong> {Number(kardex.consumoMensualAprox || 0).toFixed(2)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                    <tr className="bg-[#064c32] text-white text-xs uppercase">
                      <th className="py-3 px-3">Fecha</th>
                      <th className="py-3 px-3">Doc. / Tipo</th>
                      <th className="py-3 px-3">Área / Proveedor</th>
                      <th className="py-3 px-3">Solicitante</th>
                      <th className="py-3 px-3 text-right">Entr. Cant.</th>
                      <th className="py-3 px-3 text-right">Sal. Cant.</th>
                      <th className="py-3 px-3 text-right">Saldo Cant.</th>
                      <th className="py-3 px-3 text-right">Costo Unit.</th>
                      <th className="py-3 px-3 text-right">Entr. (S/)</th>
                      <th className="py-3 px-3 text-right">Sal. (S/)</th>
                      <th className="py-3 px-3 text-right">Saldo Val. (S/)</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-base">
                    {pag.itemsPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-500">
                            Este bien aún no registra movimientos en el rango seleccionado.
                          </td>
                        </tr>
                    ) : (
                        pag.itemsPaginados.map((m) => (
                            <tr key={m.idMovimiento} className="hover:bg-slate-50">
                              <td className="py-3 px-3 whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="font-mono font-bold text-[#064c32]">{m.documentoReferencia}</div>
                                <div className="text-xs text-slate-500">
                                  {m.tipoMovimiento} {m.idLote ? `· Lote #${m.idLote}` : ''}
                                </div>
                              </td>
                              <td className="py-3 px-3">{m.areaNombre || m.proveedorNombre || m.observacion || '—'}</td>
                              <td className="py-3 px-3">{m.solicitanteNombre || '—'}</td>
                              <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                                {Number(m.cantidadEntrada) > 0 ? Number(m.cantidadEntrada).toFixed(2) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right text-red-700 font-semibold">
                                {Number(m.cantidadSalida) > 0 ? Number(m.cantidadSalida).toFixed(2) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-bold">{Number(m.saldoCantidad).toFixed(2)}</td>
                              <td className="py-3 px-3 text-right">S/ {Number(m.costoUnitario).toFixed(2)}</td>
                              <td className="py-3 px-3 text-right text-emerald-700">
                                {Number(m.importeEntrada) > 0 ? Number(m.importeEntrada).toFixed(2) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right text-red-700">
                                {Number(m.importeSalida) > 0 ? Number(m.importeSalida).toFixed(2) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-[#064c32]">
                                S/ {Number(m.saldoValorizado).toFixed(2)}
                              </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                  </table>
                </div>

                <Paginacion
                    paginaActual={pag.paginaActual}
                    totalPaginas={pag.totalPaginas}
                    totalRegistros={pag.totalRegistros}
                    porPagina={pag.porPagina}
                    desde={pag.desde}
                    hasta={pag.hasta}
                    onCambiarPagina={pag.irAPagina}
                    onCambiarPorPagina={pag.cambiarPorPagina}
                />
              </>
          ) : (
              kardex && (
                  /* Modo Control Visible (sin precios) */
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-[#064c32] text-white text-sm uppercase">
                          <th className="py-3.5 px-4">Fecha</th>
                          <th className="py-3.5 px-4 text-right">Entrada</th>
                          <th className="py-3.5 px-4 text-right">Salida</th>
                          <th className="py-3.5 px-4">Observación / Área</th>
                          <th className="py-3.5 px-4 text-right">Saldo</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-base">
                        {pag.itemsPaginados.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500">
                                Sin movimientos registrados.
                              </td>
                            </tr>
                        ) : (
                            pag.itemsPaginados.map((m) => (
                                <tr key={m.idMovimiento} className="hover:bg-slate-50">
                                  <td className="py-3.5 px-4 whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                                  <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                                    {Number(m.cantidadEntrada) > 0 ? Number(m.cantidadEntrada).toFixed(2) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-red-700 font-bold">
                                    {Number(m.cantidadSalida) > 0 ? Number(m.cantidadSalida).toFixed(2) : '—'}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {m.areaNombre || m.observacion || m.documentoReferencia}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold text-[#064c32]">
                                    {Number(m.saldoCantidad).toFixed(2)}
                                  </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                      </table>
                    </div>

                    <Paginacion
                        paginaActual={pag.paginaActual}
                        totalPaginas={pag.totalPaginas}
                        totalRegistros={pag.totalRegistros}
                        porPagina={pag.porPagina}
                        desde={pag.desde}
                        hasta={pag.hasta}
                        onCambiarPagina={pag.irAPagina}
                        onCambiarPorPagina={pag.cambiarPorPagina}
                    />
                  </>
              )
          )}
        </div>
      </div>
  );
}