import React from 'react'
import { Printer, X } from 'lucide-react'

export function DocumentoImprimibleModal({
                                           isOpen,
                                           onClose,
                                           settings,
                                           title,
                                           correlative,
                                           date,
                                           responsible,
                                           recipient,
                                           content,
                                         }) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#092d20]/70 p-4 backdrop-blur-xs print:p-0 print:bg-white"
          onClick={onClose}
      >
        <div
            className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-6"
            onClick={(e) => e.stopPropagation()}
        >
          {/* Barra superior de control (oculta al imprimir) */}
          <div className="mb-6 flex items-center justify-between border-b border-[#e8eeeb] pb-3 print:hidden">
            <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#edf3f0] px-2.5 py-1 text-xs font-bold text-[#075c3b]">
              Vista Imprimible Oficial
            </span>
              <p className="text-xs text-[#586860]">Formato institucional para sustento y auditoría</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-xl bg-[#075c3b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#064c32]"
              >
                <Printer className="size-4" /> Imprimir Documento
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 text-[#78847f] hover:bg-[#f0f1f0]">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Encabezado Institucional del Documento */}
          <div className="border-b-2 border-[#064c32] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#064c32] bg-[#f4f6d5] font-black text-[#064c32] text-xs text-center leading-tight">
                  IESTP<br />CAÑETE
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#586860]">
                    GOBIERNO REGIONAL DE LIMA • DIRECCIÓN REGIONAL DE EDUCACIÓN
                  </p>
                  <h2 className="text-lg font-bold tracking-tight text-[#064c32]">
                    {settings.institutionName}
                  </h2>
                  <p className="text-xs text-[#586860]">
                    {settings.subTitle} • RUC: {settings.ruc}
                  </p>
                </div>
              </div>

              <div className="text-right">
              <span className="inline-block rounded-lg border-2 border-[#064c32] bg-[#edf3f0] px-3 py-1 font-mono text-sm font-bold text-[#064c32]">
                {correlative}
              </span>
                <p className="mt-1 text-xs text-[#586860]">Fecha de emisión: {date}</p>
              </div>
            </div>
          </div>

          {/* Título Central */}
          <div className="my-5 text-center">
            <h3 className="text-base font-bold uppercase tracking-wide text-[#064c32]">
              {title}
            </h3>
            <p className="text-xs text-[#586860]">
              Dirección: {settings.address} • Teléf.: {settings.phone}
            </p>
          </div>

          {/* Contenido Dinámico del Documento */}
          <div className="my-4 text-xs">{content}</div>

          {/* Firmas Institucionales */}
          <div className="mt-16 grid grid-cols-2 gap-12 border-t border-dashed border-[#d8e1dd] pt-6 text-center text-xs text-[#586860]">
            <div>
              <div className="mx-auto mb-2 h-10 w-48 border-b border-[#20372e]" />
              <p className="font-bold text-[#20372e]">{responsible}</p>
              <p className="text-[11px]">Unidad de Almacén y Custodia / Entregó conforme</p>
            </div>
            <div>
              <div className="mx-auto mb-2 h-10 w-48 border-b border-[#20372e]" />
              <p className="font-bold text-[#20372e]">{recipient}</p>
              <p className="text-[11px]">Área Usuaria / Recibió conforme</p>
            </div>
          </div>
        </div>
      </div>
  )
}
