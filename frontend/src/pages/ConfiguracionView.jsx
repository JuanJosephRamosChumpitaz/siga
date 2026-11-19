
import React, { useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';

export function ConfiguracionView({
                                    state,
                                    onSaveSettings,
                                    onRestoreDemo,
                                    onImportBackup,
                                  }) {
  const settings = state?.settings || {};

  // Configuración institucional
  const [institutionName, setInstitutionName] = useState(
      settings.institutionName || ''
  );

  const [subTitle, setSubTitle] = useState(
      settings.subTitle || ''
  );

  const [ruc, setRuc] = useState(settings.ruc || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [director, setDirector] = useState(settings.director || '');

  // Reglas del sistema
  const [enableStockAlerts, setEnableStockAlerts] = useState(
      settings.enableStockAlerts ?? true
  );

  const [pecosaPrefix, setPecosaPrefix] = useState(
      settings.pecosaPrefix || ''
  );

  const [ingresoPrefix, setIngresoPrefix] = useState(
      settings.ingresoPrefix || ''
  );

  // Estados de interfaz
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Mostrar notificación
  const showNotification = (message) => {
    setNotification(message);

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Guardar configuración
  const handleSave = (e) => {
    e.preventDefault();

    const updated = {
      institutionName: institutionName.trim(),
      subTitle: subTitle.trim(),
      ruc: ruc.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      director: director.trim(),
      valuationMethod: 'promedio_ponderado',
      enableStockAlerts,
      pecosaPrefix: pecosaPrefix.trim(),
      ingresoPrefix: ingresoPrefix.trim(),
    };

    if (onSaveSettings) {
      onSaveSettings(updated);
      showNotification(
          'Parámetros institucionales guardados correctamente.'
      );
    }
  };

  // Descargar copia de seguridad
  const handleDownloadBackup = () => {
    try {
      const jsonStr = JSON.stringify(state, null, 2);

      const blob = new Blob([jsonStr], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.download = `backup_sigal_iestp_${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      showNotification(
          'Respaldo completo de la base de datos descargado.'
      );
    } catch (error) {
      console.error('Error al generar respaldo:', error);

      setImportError(
          'No se pudo generar el archivo de respaldo.'
      );
    }
  };

  // Importar copia de seguridad
  const handleImportFile = (e) => {
    setImportError(null);

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportError('Seleccione un archivo JSON válido.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target.result;

        const importedState = JSON.parse(content);

        // Validar estructura básica del respaldo
        if (
            !importedState ||
            typeof importedState !== 'object' ||
            Array.isArray(importedState)
        ) {
          throw new Error('Formato de respaldo inválido.');
        }

        if (!importedState.settings || !Array.isArray(importedState.products)) {
          throw new Error(
              'El archivo no contiene una estructura de respaldo SIGAL válida.'
          );
        }

        if (typeof onImportBackup !== 'function') {
          throw new Error(
              'No se encuentra disponible la función para restaurar respaldos.'
          );
        }

        onImportBackup(importedState);

        showNotification(
            'Base de datos restaurada con éxito desde el archivo de respaldo.'
        );

        e.target.value = '';
      } catch (error) {
        console.error('Error al importar respaldo:', error);

        setImportError(
            error.message || 'Error al validar el archivo de respaldo.'
        );

        e.target.value = '';
      }
    };

    reader.onerror = () => {
      setImportError('No se pudo leer el archivo seleccionado.');
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  // Restaurar escenario de demostración
  const handleRestoreDemo = () => {
    setConfirmRestoreOpen(false);

    if (typeof onRestoreDemo === 'function') {
      onRestoreDemo();

      showNotification(
          'Escenario de demostración restaurado correctamente.'
      );
    }
  };

  return (
      <div className="space-y-6">

        {/* Notificaciones */}
        {notification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-white shadow-xl transition-all">

              <div className="size-2 rounded-full bg-teal-400 animate-ping" />

              <p className="text-sm font-medium">
                {notification}
              </p>

              <button
                  onClick={() => setNotification(null)}
                  className="ml-2 text-white/70 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
        )}

        {/* Encabezado */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-[34px]">
              Configuración y Respaldos
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Parámetros de la institución, correlativos internos y gestión de copias de seguridad.
            </p>
          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-12">

          {/* Formulario de configuración */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8">

            <form onSubmit={handleSave} className="space-y-4">

              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Ficha de la Entidad Educativa
              </h2>

              {/* Datos institucionales */}
              <div className="grid gap-3 sm:grid-cols-2">

                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Nombre Institucional Configurable *

                  <input
                      required
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Subtítulo / Denominación de Sede

                  <input
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  RUC de la Entidad

                  <input
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  Teléfonos de Contacto

                  <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Dirección de la Sede Principal

                  <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  Director General

                  <input
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  Correo Electrónico

                  <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

              </div>

              {/* Reglas y correlativos */}
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pt-3 pb-2">
                Reglas y Correlativos de Almacén
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">

                <label className="text-xs font-bold text-slate-600">
                  Prefijo Comprobante PECOSA

                  <input
                      value={pecosaPrefix}
                      onChange={(e) => setPecosaPrefix(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  Prefijo Nota de Ingreso

                  <input
                      value={ingresoPrefix}
                      onChange={(e) => setIngresoPrefix(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold text-slate-900 outline-none focus:border-teal-600"
                  />
                </label>

              </div>

              {/* Alertas de stock */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between">

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Alertas Operativas de Stock Mínimo
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Mostrar avisos en el dashboard principal cuando las existencias alcancen el umbral.
                  </p>
                </div>

                <input
                    type="checkbox"
                    checked={enableStockAlerts}
                    onChange={(e) => setEnableStockAlerts(e.target.checked)}
                    className="size-4 accent-teal-700 rounded"
                />

              </div>

              {/* Guardar */}
              <div className="flex justify-end pt-3 border-t border-slate-100">

                <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                >
                  <Save className="size-4" />
                  Guardar Parámetros
                </button>

              </div>

            </form>
          </div>

          {/* Respaldo y restauración */}
          <div className="space-y-4 lg:col-span-4">

            {/* Copia de seguridad JSON */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">

              <div className="flex items-center gap-2">
                <Database className="size-5 text-teal-700" />

                <h3 className="font-bold text-sm text-slate-900">
                  Copia de Seguridad (JSON)
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Descargue un respaldo completo de la base de datos (productos, movimientos, Kardex y cuentas contables).
              </p>

              <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-50/60 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition"
              >
                <Download className="size-4" />
                Exportar Copia de Seguridad
              </button>

              {/* Importar respaldo */}
              <div className="border-t border-slate-100 pt-3">

                <p className="text-xs font-bold text-slate-700 mb-1">
                  Restaurar desde Respaldo
                </p>

                <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700 cursor-pointer w-full"
                />

                {importError && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {importError}
                    </p>
                )}

              </div>
            </div>

            {/* Restaurar escenario demo */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs space-y-3">

              <div className="flex items-center gap-2 text-amber-900">

                <RotateCcw className="size-5 text-amber-700" />

                <h3 className="font-bold text-sm">
                  Restaurar Escenario de Demostración
                </h3>

              </div>

              <p className="text-xs text-amber-800/90 leading-relaxed">
                Reinicia todos los datos a su estado original (34 productos, catálogo contable demostrativo, 3 almacenes, movimientos del trimestre y solicitudes).
              </p>

              <button
                  type="button"
                  onClick={() => setConfirmRestoreOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
              >
                <RotateCcw className="size-4" />
                Restaurar Datos de Demostración
              </button>

            </div>

          </div>
        </div>

        {/* Modal de confirmación */}
        {confirmRestoreOpen && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                onClick={() => setConfirmRestoreOpen(false)}
            >

              <div
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >

                <div className="flex items-center gap-3 text-amber-700 mb-3">

                  <AlertTriangle className="size-6" />

                  <h3 className="text-lg font-bold text-slate-900">
                    ¿Restaurar Escenario Demo?
                  </h3>

                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta acción reemplazará los datos actuales con el escenario inicial de demostración. Se recomienda descargar un respaldo si desea conservar los cambios.
                </p>

                <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-slate-100">

                  <button
                      type="button"
                      onClick={() => setConfirmRestoreOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                      type="button"
                      onClick={handleRestoreDemo}
                      className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                  >
                    Sí, Restaurar Demo
                  </button>

                </div>

              </div>
            </div>
        )}

      </div>
  );
}

export default ConfiguracionView;
