import React, { useState } from 'react'
import {
  Building,
  CheckCircle2,
  Lock,
  MapPin,
  Phone,
  Plus,
  Search,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react'

export function AlmacenesCatalogosView({
                                         state,
                                         onUpdateWarehouses,
                                         onUpdateAreas,
                                         onUpdateProviders,
                                       }) {
  const { warehouses, areas, providers, locations } = state
  const [activeTab, setActiveTab] = useState('almacenes')

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#064c32] md:text-[39px]">
            Almacenes y Catálogos Auxiliares
          </h1>
          <p className="mt-1 text-base text-[#687871] md:text-lg">
            Centros de custodia, ubicaciones físicas, dependencias solicitantes y directorio de proveedores.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e0e8e4] bg-white p-2 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
          {[
            { id: 'almacenes', label: 'Almacenes Físicos', icon: Warehouse, count: warehouses.length },
            { id: 'ubicaciones', label: 'Zonas y Estantes', icon: MapPin, count: locations.length },
            { id: 'areas', label: 'Áreas Solicitantes', icon: Building, count: areas.length },
            { id: 'proveedores', label: 'Proveedores Registrados', icon: Truck, count: providers.length },
          ].map(({ id, label, icon: Icon, count }) => {
            const isActive = activeTab === id
            return (
                <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                        isActive
                            ? 'bg-[#075c3b] text-white shadow-xs'
                            : 'text-[#586860] hover:bg-[#edf3f0] hover:text-[#075c3b]'
                    }`}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                  <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#edf3f0] text-[#075c3b]'
                      }`}
                  >
                {count}
              </span>
                </button>
            )
          })}
        </div>

        {/* TAB 1: Almacenes */}
        {activeTab === 'almacenes' && (
            <div className="grid gap-4 md:grid-cols-3">
              {warehouses.map((w) => (
                  <div
                      key={w.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)] transition hover:border-[#075c3b]/40"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#075c3b] bg-[#edf3f0] px-2 py-0.5 rounded">
                    {w.code}
                  </span>
                        {w.isLockedForInventory ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ffe4e5] px-2.5 py-0.5 text-xs font-bold text-[#dc252d]">
                      <Lock className="size-3" /> Bloqueado x Inventario
                    </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#dff1e4] px-2.5 py-0.5 text-xs font-bold text-[#08783f]">
                      <CheckCircle2 className="size-3" /> Operativo
                    </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-base font-bold text-[#20372e]">{w.name}</h3>
                      <p className="mt-1 text-xs text-[#687871]">{w.location}</p>
                    </div>

                    <div className="mt-4 border-t border-[#e8eeeb] pt-3 text-xs text-[#586860] space-y-1">
                      <p>
                        Responsable: <strong className="text-[#20372e]">{w.manager}</strong>
                      </p>
                      <p>Teléfono: {w.phone}</p>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {/* TAB 2: Ubicaciones */}
        {activeTab === 'ubicaciones' && (
            <div className="rounded-2xl border border-[#e0e8e4] bg-white shadow-[0_2px_10px_rgba(21,55,42,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#075c3b] font-bold text-white">
                  <tr>
                    <th className="p-3 pl-4">Almacén</th>
                    <th className="p-3">Zona</th>
                    <th className="p-3">Estante / Módulo</th>
                    <th className="p-3">Nivel / Altura</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eeeb]">
                  {locations.map((loc) => {
                    const wh = warehouses.find((w) => w.id === loc.warehouseId)
                    return (
                        <tr key={loc.id} className="hover:bg-[#f7faf8]">
                          <td className="p-3 pl-4 font-bold text-[#20372e]">{wh?.name}</td>
                          <td className="p-3 text-[#075c3b] font-semibold">{loc.zone}</td>
                          <td className="p-3 text-[#586860]">{loc.shelf}</td>
                          <td className="p-3 text-[#586860]">{loc.level}</td>
                        </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {/* TAB 3: Áreas Solicitantes */}
        {activeTab === 'areas' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {areas.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
              <span className="font-mono text-xs font-bold text-[#075c3b] bg-[#edf3f0] px-2 py-0.5 rounded">
                {a.code}
              </span>
                    <h3 className="mt-2 text-base font-bold text-[#20372e]">{a.name}</h3>
                    <p className="mt-1 text-xs text-[#687871]">{a.building}</p>
                    <div className="mt-3 border-t border-[#e8eeeb] pt-2 text-xs text-[#586860]">
                      <p>
                        Jefatura / Responsable: <strong className="text-[#20372e]">{a.manager}</strong>
                      </p>
                      <p className="text-[11px] text-[#075c3b]">{a.email}</p>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {/* TAB 4: Proveedores */}
        {activeTab === 'proveedores' && (
            <div className="grid gap-4 md:grid-cols-2">
              {providers.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-[#e0e8e4] bg-white p-5 shadow-[0_2px_10px_rgba(21,55,42,0.03)]">
                    <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#075c3b] bg-[#edf3f0] px-2.5 py-0.5 rounded-md">
                  RUC: {p.ruc}
                </span>
                      <span className="text-[11px] font-semibold text-[#687871]">{p.rubro}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-[#20372e]">{p.name}</h3>
                    <p className="mt-1 text-xs text-[#687871]">{p.address}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#e8eeeb] pt-2 text-xs text-[#586860]">
                <span>
                  Contacto: <strong className="text-[#20372e]">{p.contactName}</strong>
                </span>
                      <span>Tel: {p.phone}</span>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  )
}

export default AlmacenesCatalogosView;
