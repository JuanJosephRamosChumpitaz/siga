import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, Building2, AlertTriangle, Printer, Download, AlertCircle } from 'lucide-react';
import { reporteService } from '../services/reporteService';
import { usePaginacion } from '../hooks/usepaginacion';
import Paginacion from '../components/ui/paginacion';

export default function ReportesView() {
  const [tipoReporte, setTipoReporte] = useState('valorizado');
  const [inventario, setInventario] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [consumoAreas, setConsumoAreas] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarReportes = async () => {
    setCargando(true);
    setError('');
    try {
      const [invData, ctaData, areaData] = await Promise.all([
        reporteService.inventarioValorizado(),
        reporteService.resumenCuentas(),
        reporteService.consumoAreas(desde, hasta),
      ]);
      setInventario(invData);
      setCuentas(ctaData);
      setConsumoAreas(areaData);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron generar los reportes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  const totalValorizado = inventario.reduce((acc, i) => acc + Number(i.valorTotalPeps || 0), 0);
  const stockCritico = inventario.filter((i) => Number(i.stockGeneral) <= Number(i.stockMinimo));

  const datosActivos =
      tipoReporte === 'valorizado'
          ? inventario
          : tipoReporte === 'critico'
              ? stockCritico
              : tipoReporte === 'cuentas'
                  ? cuentas
                  : consumoAreas;

  const pag = usePaginacion(datosActivos, 15);

  const cambiarTipoReporte = (nuevoTipo) => {
    setTipoReporte(nuevoTipo);
    pag.reiniciarPagina();
  };

  const exportarCsvActual = () => {
    let headers = [];
    let rows = [];
    let nombreArchivo = 'reporte_siga.csv';

    if (tipoReporte === 'valorizado' || tipoReporte === 'critico') {
      const fuente = tipoReporte === 'critico' ? stockCritico : inventario;
      nombreArchivo = tipoReporte === 'critico' ? 'stock_critico.csv' : 'inventario_valorizado_peps.csv';
      headers = ['Codigo', 'Descripcion', 'Cuenta Contable', 'Unidad', 'Stock', 'Stock Minimo', 'Valor PEPS (S/)'];
      rows = fuente.map((i) => [
        i.codigoInterno || i.idProducto,
        i.nombreProducto.replaceAll(',', ';'),
        i.codigoCuenta || '',
        i.unidadMedida,
        Number(i.stockGeneral).toFixed(2),
        Number(i.stockMinimo).toFixed(2),
        Number(i.valorTotalPeps).toFixed(2),
      ]);
    } else if (tipoReporte === 'cuentas') {
      nombreArchivo = 'resumen_cuentas_contables.csv';
      headers = ['Cuenta', 'Denominacion', 'Cant. Bienes', 'Unidades Totales', 'Valor Total PEPS (S/)'];
      rows = cuentas.map((c) => [
        c.codigoCuenta,
        c.nombreCuenta.replaceAll(',', ';'),
        c.cantidadProductos,
        Number(c.stockTotal).toFixed(2),
        Number(c.valorTotalPeps).toFixed(2),
      ]);
    } else {
      nombreArchivo = 'consumo_por_area.csv';
      headers = ['Area Solicitante', 'Total PECOSAs', 'Unidades Despachadas', 'Valor Consumido (S/)'];
      rows = consumoAreas.map((a) => [
        a.nombreArea.replaceAll(',', ';'),
        a.totalPecosas,
        Number(a.unidadesDespachadas).toFixed(2),
        Number(a.valorTotalConsumido).toFixed(2),
      ]);
    }

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#064c32]">Centro de Reportes Oficiales</h2>
            <p className="text-base text-slate-600 mt-1">
              Balances valorizados bajo método PEPS, consolidado por cuenta contable y consumo por área solicitante.
            </p>
          </div>

          <div className="flex gap-2">
            <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#064c32] hover:bg-[#053b27] text-white text-base font-semibold cursor-pointer"
            >
              <Printer className="w-5 h-5" /> Imprimir Reporte
            </button>
            <button
                type="button"
                onClick={exportarCsvActual}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-base font-medium cursor-pointer"
            >
              <Download className="w-5 h-5" /> Exportar CSV
            </button>
          </div>
        </div>

        {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {/* Tarjetas selectoras de reporte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
              type="button"
              onClick={() => cambiarTipoReporte('valorizado')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  tipoReporte === 'valorizado'
                      ? 'border-[#064c32] bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <BarChart3 className="w-6 h-6 text-[#064c32] mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Inventario Valorizado</h3>
            <p className="text-sm text-slate-600 mt-0.5">Total: S/ {totalValorizado.toFixed(2)}</p>
          </button>

          <button
              type="button"
              onClick={() => cambiarTipoReporte('cuentas')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  tipoReporte === 'cuentas'
                      ? 'border-[#064c32] bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <BookOpen className="w-6 h-6 text-[#064c32] mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Resumen por Cuenta</h3>
            <p className="text-sm text-slate-600 mt-0.5">{cuentas.length} cuenta(s) con bienes</p>
          </button>

          <button
              type="button"
              onClick={() => cambiarTipoReporte('areas')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  tipoReporte === 'areas'
                      ? 'border-[#064c32] bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <Building2 className="w-6 h-6 text-[#064c32] mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Consumo por Área</h3>
            <p className="text-sm text-slate-600 mt-0.5">{consumoAreas.length} área(s) atendidas</p>
          </button>

          <button
              type="button"
              onClick={() => cambiarTipoReporte('critico')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  tipoReporte === 'critico'
                      ? 'border-red-600 bg-red-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Alertas de Stock Crítico</h3>
            <p className="text-sm text-red-700 font-semibold mt-0.5">{stockCritico.length} bien(es) en alerta</p>
          </button>
        </div>

        {tipoReporte === 'areas' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                <input
                    type="date"
                    value={desde}
                    onChange={(e) => {
                      setDesde(e.target.value);
                      pag.reiniciarPagina();
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                <input
                    type="date"
                    value={hasta}
                    onChange={(e) => {
                      setHasta(e.target.value);
                      pag.reiniciarPagina();
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>
            </div>
        )}

        {/* Tabla del reporte seleccionado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            {cargando ? (
                <div className="p-8 text-center text-lg text-slate-500">Generando reporte...</div>
            ) : tipoReporte === 'valorizado' || tipoReporte === 'critico' ? (
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                  <tr className="bg-[#064c32] text-white text-sm uppercase">
                    <th className="py-3.5 px-4">Código</th>
                    <th className="py-3.5 px-4">Descripción del Bien</th>
                    <th className="py-3.5 px-4">Cuenta Contable</th>
                    <th className="py-3.5 px-4">Unidad</th>
                    <th className="py-3.5 px-4 text-right">Stock Actual</th>
                    <th className="py-3.5 px-4 text-right">Stock Mín.</th>
                    <th className="py-3.5 px-4 text-right">Valorizado PEPS (S/)</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                  {pag.itemsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No existen registros para este reporte.
                        </td>
                      </tr>
                  ) : (
                      pag.itemsPaginados.map((i) => (
                          <tr key={i.idProducto} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-mono text-sm font-bold text-[#064c32]">{i.codigoInterno}</td>
                            <td className="py-3.5 px-4 font-semibold">{i.nombreProducto}</td>
                            <td className="py-3.5 px-4 font-mono text-sm">{i.codigoCuenta || '—'}</td>
                            <td className="py-3.5 px-4">{i.unidadMedida}</td>
                            <td className="py-3.5 px-4 text-right font-bold">{Number(i.stockGeneral).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right text-slate-600">{Number(i.stockMinimo).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#064c32]">
                              S/ {Number(i.valorTotalPeps).toFixed(2)}
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
            ) : tipoReporte === 'cuentas' ? (
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                  <tr className="bg-[#064c32] text-white text-sm uppercase">
                    <th className="py-3.5 px-4">Cuenta Contable</th>
                    <th className="py-3.5 px-4">Denominación</th>
                    <th className="py-3.5 px-4 text-right">Nº de Bienes</th>
                    <th className="py-3.5 px-4 text-right">Unidades en Stock</th>
                    <th className="py-3.5 px-4 text-right">Valorizado PEPS (S/)</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                  {pag.itemsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No existen cuentas con bienes registrados.
                        </td>
                      </tr>
                  ) : (
                      pag.itemsPaginados.map((c) => (
                          <tr key={c.codigoCuenta} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#064c32]">{c.codigoCuenta}</td>
                            <td className="py-3.5 px-4 font-semibold">{c.nombreCuenta}</td>
                            <td className="py-3.5 px-4 text-right">{c.cantidadProductos}</td>
                            <td className="py-3.5 px-4 text-right">{Number(c.stockTotal).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#064c32]">
                              S/ {Number(c.valorTotalPeps).toFixed(2)}
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
            ) : (
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                  <tr className="bg-[#064c32] text-white text-sm uppercase">
                    <th className="py-3.5 px-4">Área Solicitante</th>
                    <th className="py-3.5 px-4 text-right">PECOSAs Despachadas</th>
                    <th className="py-3.5 px-4 text-right">Unidades Entregadas</th>
                    <th className="py-3.5 px-4 text-right">Total Consumido (S/)</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                  {pag.itemsPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          Aún no hay consumos despachados en el rango seleccionado.
                        </td>
                      </tr>
                  ) : (
                      pag.itemsPaginados.map((a) => (
                          <tr key={a.idArea} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-semibold">{a.nombreArea}</td>
                            <td className="py-3.5 px-4 text-right">{a.totalPecosas}</td>
                            <td className="py-3.5 px-4 text-right">{Number(a.unidadesDespachadas).toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#064c32]">
                              S/ {Number(a.valorTotalConsumido).toFixed(2)}
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
            )}
          </div>

          {!cargando && (
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
          )}
        </div>
      </div>
  );
}