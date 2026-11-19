
import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Info,
  Package,
  Plus,
  Search,
  Upload,
  X,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';

export function CuentasContablesView({
                                       state,
                                       onUpdateAccounts,
                                       onNavigateToProductsWithAccount,
                                     }) {
  const accounts = state?.accounts || [];
  const products = state?.products || [];

  const [search, setSearch] = useState('');

  const [expandedNodes, setExpandedNodes] = useState({
    'acc-1': true,
    'acc-1-1': true,
    'acc-1-2': true,
    'acc-2': true,
    'acc-3': true,
    'acc-4': true,
  });

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [parentForNewSub, setParentForNewSub] = useState(null);

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvError, setCsvError] = useState(null);

  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Campos del formulario
  const [fCode, setFCode] = useState('');
  const [fName, setFName] = useState('');
  const [fParentId, setFParentId] = useState('');
  const [fAllowsProducts, setFAllowsProducts] = useState(true);
  const [fStatus, setFStatus] = useState('activo');
  const [fNotes, setFNotes] = useState('');

  // Mostrar notificaciones
  const showNotification = (message) => {
    setNotification(message);

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Expandir o contraer cuenta
  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Obtener cuentas raíz
  const rootAccounts = useMemo(() => {
    return accounts.filter(
        (account) => !account.parentId
    );
  }, [accounts]);

  // Obtener hijos de una cuenta
  const getChildren = (parentId) => {
    return accounts.filter(
        (account) => account.parentId === parentId
    );
  };

  // Obtener todos los descendientes de una cuenta
  const getDescendantAccountIds = (accountId) => {
    const result = [];
    const visited = new Set();

    const findChildren = (parentId) => {
      if (visited.has(parentId)) return;

      visited.add(parentId);
      result.push(parentId);

      const children = accounts.filter(
          (account) => account.parentId === parentId
      );

      children.forEach((child) => {
        findChildren(child.id);
      });
    };

    findChildren(accountId);

    return result;
  };

  // Calcular el valor total de existencias de un producto
  const getProductTotalValue = (product) => {
    if (!product) return 0;

    const stocks = product.stocks || {};
    const averageCosts = product.averageCosts || {};

    return Object.entries(stocks).reduce(
        (total, [warehouseId, quantity]) => {
          const cost = Number(averageCosts[warehouseId]) || 0;
          const stock = Number(quantity) || 0;

          return total + stock * cost;
        },
        0
    );
  };

  // Totales acumulados de una cuenta y sus descendientes
  const getAccountAggregates = (accountId) => {
    const descendantIds = getDescendantAccountIds(accountId);

    const matchingProducts = products.filter(
        (product) =>
            descendantIds.includes(product.accountId)
    );

    const totalValue = matchingProducts.reduce(
        (sum, product) => {
          return sum + getProductTotalValue(product);
        },
        0
    );

    return {
      productCount: matchingProducts.length,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  };

  // Validar que no existan ciclos jerárquicos
  const validateNoCycle = (accountId, parentId) => {
    if (!parentId) {
      return { valid: true };
    }

    if (accountId === parentId) {
      return {
        valid: false,
        error: 'Una cuenta no puede ser su propia cuenta padre.',
      };
    }

    const visited = new Set();
    let currentId = parentId;

    while (currentId) {
      if (currentId === accountId) {
        return {
          valid: false,
          error: 'Esta operación generaría un ciclo en la jerarquía contable.',
        };
      }

      if (visited.has(currentId)) {
        return {
          valid: false,
          error: 'Se detectó una jerarquía contable circular.',
        };
      }

      visited.add(currentId);

      const currentAccount = accounts.find(
          (account) => account.id === currentId
      );

      if (!currentAccount) break;

      currentId = currentAccount.parentId;
    }

    return { valid: true };
  };

  // Abrir formulario de creación
  const handleOpenCreate = (parent = null) => {
    setFormError(null);
    setSelectedAccount(null);
    setParentForNewSub(parent);

    setFCode(parent ? `${parent.code}.` : 'DEMO-');
    setFName('');
    setFParentId(parent ? parent.id : '');
    setFAllowsProducts(true);
    setFStatus('activo');
    setFNotes('');

    setModalMode('create');
  };

  // Abrir formulario de edición
  const handleOpenEdit = (account) => {
    setFormError(null);
    setSelectedAccount(account);

    setFCode(account.code);
    setFName(account.name);
    setFParentId(account.parentId || '');
    setFAllowsProducts(account.allowsProducts ?? true);
    setFStatus(account.status || 'activo');
    setFNotes(account.notes || '');

    setParentForNewSub(null);
    setModalMode('edit');
  };

  // Guardar formulario
  const handleSaveForm = (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = fCode.trim();
    const cleanName = fName.trim();

    if (!cleanCode || !cleanName) {
      setFormError(
          'El código y la denominación son obligatorios.'
      );
      return;
    }

    // Validar código duplicado
    const existingWithCode = accounts.find(
        (account) =>
            account.code.toLowerCase() === cleanCode.toLowerCase() &&
            (modalMode === 'create' ||
                account.id !== selectedAccount?.id)
    );

    if (existingWithCode) {
      setFormError(
          `Ya existe una cuenta con el código "${cleanCode}" en el ejercicio fiscal.`
      );
      return;
    }

    const parentId = fParentId || null;

    // Validar cuenta padre
    if (parentId) {
      const parentAccount = accounts.find(
          (account) => account.id === parentId
      );

      if (!parentAccount) {
        setFormError('La cuenta padre seleccionada no existe.');
        return;
      }

      if (parentAccount.status === 'inactivo') {
        setFormError(
            'No se puede asignar una cuenta a una cuenta padre inactiva.'
        );
        return;
      }

      if (modalMode === 'create' && !parentAccount.allowsProducts) {
        // Una cuenta que no permite productos puede tener subcuentas.
        // Se permite crear la subcuenta.
      }
    }

    let level = 1;

    if (parentId) {
      const parentAccount = accounts.find(
          (account) => account.id === parentId
      );

      if (parentAccount) {
        level = parentAccount.level + 1;
      }
    }

    // Crear nueva cuenta
    if (modalMode === 'create') {
      const newAccount = {
        id: `acc-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        parentId,
        level,
        allowsProducts: fAllowsProducts,
        status: fStatus,
        version: '2026',
        source: 'Catálogo contable de demostración',
        notes: fNotes.trim(),
      };

      if (typeof onUpdateAccounts === 'function') {
        onUpdateAccounts([...accounts, newAccount]);
      }

      setModalMode(null);

      showNotification(
          `Cuenta "${newAccount.code} - ${newAccount.name}" registrada con éxito.`
      );
    }

    // Editar cuenta existente
    else if (modalMode === 'edit' && selectedAccount) {
      const cycleCheck = validateNoCycle(
          selectedAccount.id,
          parentId
      );

      if (!cycleCheck.valid) {
        setFormError(
            cycleCheck.error || 'Error de jerarquía contable.'
        );
        return;
      }

      // Actualizar también los niveles de sus descendientes
      const updatedAccounts = accounts.map((account) => {
        if (account.id === selectedAccount.id) {
          return {
            ...account,
            code: cleanCode,
            name: cleanName,
            parentId,
            level,
            allowsProducts: fAllowsProducts,
            status: fStatus,
            notes: fNotes.trim(),
          };
        }

        return account;
      });

      // Recalcular niveles de toda la jerarquía
      const recalculateLevels = (parentId, parentLevel) => {
        updatedAccounts.forEach((account) => {
          if (account.parentId === parentId) {
            account.level = parentLevel + 1;
            recalculateLevels(account.id, account.level);
          }
        });
      };

      const roots = updatedAccounts.filter(
          (account) => !account.parentId
      );

      roots.forEach((root) => {
        root.level = 1;
        recalculateLevels(root.id, 1);
      });

      if (typeof onUpdateAccounts === 'function') {
        onUpdateAccounts(updatedAccounts);
      }

      setModalMode(null);

      showNotification(
          `Cuenta "${cleanCode}" actualizada correctamente.`
      );
    }
  };

  // Escapar valores CSV
  const escapeCSV = (value) => {
    const text = String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  };

  // Exportar catálogo CSV
  const handleExportCSV = () => {
    const headers = [
      'id',
      'code',
      'name',
      'parentId',
      'level',
      'allowsProducts',
      'status',
      'version',
      'notes',
    ];

    const rows = accounts.map((account) => [
      escapeCSV(account.id),
      escapeCSV(account.code),
      escapeCSV(account.name),
      escapeCSV(account.parentId || ''),
      account.level,
      account.allowsProducts ? 'SI' : 'NO',
      escapeCSV(account.status),
      escapeCSV(account.version || '2026'),
      escapeCSV(account.notes || ''),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    // BOM para compatibilidad con Excel
    const blob = new Blob(
        ['\uFEFF', csvContent],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'catalogo_contable_sigal_2026.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showNotification('Catálogo contable exportado a CSV.');
  };

  // Analizar una línea CSV respetando comillas
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    return result;
  };

  // Analizar CSV completo
  const parseCSV = (text) => {
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          currentLine += '""';
          i++;
        } else {
          insideQuotes = !insideQuotes;
          currentLine += char;
        }
      } else if (
          (char === '\n' || char === '\r') &&
          !insideQuotes
      ) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }

        currentLine = '';

        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Cargar archivo CSV
  const handleFileUpload = (e) => {
    setCsvError(null);
    setCsvPreview(null);

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Seleccione un archivo CSV válido.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '')
            .replace(/^\uFEFF/, '');

        const lines = parseCSV(text);

        if (lines.length < 2) {
          setCsvError(
              'El archivo CSV está vacío o no contiene filas de datos.'
          );
          return;
        }

        const headers = parseCSVLine(lines[0]).map(
            (header) => header.toLowerCase()
        );

        const requiredHeaders = [
          'id',
          'code',
          'name',
          'parentid',
          'level',
          'allowsproducts',
          'status',
        ];

        const missingHeaders = requiredHeaders.filter(
            (header) => !headers.includes(header)
        );

        if (missingHeaders.length > 0) {
          setCsvError(
              `Faltan columnas obligatorias: ${missingHeaders.join(', ')}`
          );
          return;
        }

        const getColumn = (parts, name) => {
          const index = headers.indexOf(name.toLowerCase());

          return index >= 0 ? parts[index] : '';
        };

        const previewList = [];
        const codes = new Set();
        const ids = new Set();

        for (let i = 1; i < lines.length; i++) {
          const parts = parseCSVLine(lines[i]);

          if (parts.length < headers.length) {
            throw new Error(
                `La fila ${i + 1} tiene columnas incompletas.`
            );
          }

          const id = getColumn(parts, 'id') || `csv-${i}`;
          const code = getColumn(parts, 'code');
          const name = getColumn(parts, 'name');

          if (!code || !name) {
            throw new Error(
                `La fila ${i + 1} no contiene código o denominación.`
            );
          }

          if (codes.has(code.toLowerCase())) {
            throw new Error(
                `Código duplicado en el archivo: ${code}.`
            );
          }

          if (ids.has(id)) {
            throw new Error(
                `ID duplicado en el archivo: ${id}.`
            );
          }

          codes.add(code.toLowerCase());
          ids.add(id);

          const allowsValue = getColumn(
              parts,
              'allowsproducts'
          ).toUpperCase();

          previewList.push({
            id,
            code,
            name,
            parentId: getColumn(parts, 'parentid') || null,
            level: Number(getColumn(parts, 'level')) || 1,
            allowsProducts:
                allowsValue === 'SI' ||
                allowsValue === 'TRUE' ||
                allowsValue === '1',
            status:
                getColumn(parts, 'status') === 'inactivo'
                    ? 'inactivo'
                    : 'activo',
            version: getColumn(parts, 'version') || '2026',
            source: 'Importación CSV',
            notes: getColumn(parts, 'notes') || '',
          });
        }

        // Validar referencias a cuentas padre
        const importedIds = new Set(
            previewList.map((account) => account.id)
        );

        for (const account of previewList) {
          if (
              account.parentId &&
              !importedIds.has(account.parentId)
          ) {
            throw new Error(
                `La cuenta "${account.code}" tiene una cuenta padre inexistente: ${account.parentId}.`
            );
          }

          if (account.parentId === account.id) {
            throw new Error(
                `La cuenta "${account.code}" no puede ser su propia cuenta padre.`
            );
          }
        }

        // Validar ciclos en el catálogo importado
        const importedMap = new Map(
            previewList.map((account) => [
              account.id,
              account,
            ])
        );

        for (const account of previewList) {
          const visited = new Set();
          let currentId = account.id;

          while (currentId) {
            if (visited.has(currentId)) {
              throw new Error(
                  `Se detectó un ciclo jerárquico en la cuenta "${account.code}".`
              );
            }

            visited.add(currentId);

            const current = importedMap.get(currentId);

            currentId = current?.parentId || null;
          }
        }

        // Recalcular niveles según la jerarquía
        const calculateLevel = (account, visited = new Set()) => {
          if (!account.parentId) return 1;

          if (visited.has(account.id)) return 1;

          visited.add(account.id);

          const parent = importedMap.get(account.parentId);

          if (!parent) return 1;

          return 1 + calculateLevel(parent, visited);
        };

        previewList.forEach((account) => {
          account.level = calculateLevel(account);
        });

        setCsvPreview(previewList);
      } catch (error) {
        setCsvError(
            'Error al procesar el archivo CSV: ' + error.message
        );
      }
    };

    reader.onerror = () => {
      setCsvError('No se pudo leer el archivo CSV.');
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Aplicar catálogo importado
  const handleApplyCsv = () => {
    if (!csvPreview || csvPreview.length === 0) return;

    if (typeof onUpdateAccounts !== 'function') {
      setCsvError(
          'No está disponible la función para actualizar las cuentas.'
      );
      return;
    }

    onUpdateAccounts(csvPreview);

    setCsvModalOpen(false);
    setCsvPreview(null);
    setCsvError(null);

    showNotification(
        `Catálogo contable reemplazado con ${csvPreview.length} cuentas desde CSV.`
    );
  };

  // Comprobar si una cuenta o alguno de sus descendientes coincide con la búsqueda
  const matchesSearchTree = (node, query) => {
    if (!query) return true;

    const matches =
        node.code.toLowerCase().includes(query) ||
        node.name.toLowerCase().includes(query);

    if (matches) return true;

    return getChildren(node.id).some(
        (child) => matchesSearchTree(child, query)
    );
  };

  // Renderizador recursivo del árbol
  const renderTree = (node) => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;

    const isExpanded =
        expandedNodes[node.id] ?? false;

    const aggregates = getAccountAggregates(node.id);

    const query = search.trim().toLowerCase();

    if (!matchesSearchTree(node, query)) {
      return null;
    }

    const visibleChildren = children.filter(
        (child) => matchesSearchTree(child, query)
    );

    const shouldExpandForSearch =
        query.length > 0 && visibleChildren.length > 0;

    return (
        <div key={node.id} className="select-none">

          <div
              className={`group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 ${
                  node.status === 'inactivo'
                      ? 'opacity-60 bg-slate-50/50'
                      : ''
              }`}
              style={{
                paddingLeft: `${Math.max(12, node.level * 24)}px`,
              }}
          >

            <div className="flex items-center gap-2 min-w-0">

              {hasChildren ? (
                  <button
                      type="button"
                      onClick={() => toggleExpand(node.id)}
                      className="flex size-6 items-center justify-center rounded-md hover:bg-slate-200 text-slate-600"
                  >
                    {isExpanded || shouldExpandForSearch ? (
                        <ChevronDown className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    )}
                  </button>
              ) : (
                  <span className="size-6 inline-block" />
              )}

              {isExpanded || shouldExpandForSearch ? (
                  <FolderOpen className="size-5 text-teal-600 shrink-0" />
              ) : (
                  <Folder className="size-5 text-slate-400 shrink-0" />
              )}

              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
              {node.code}
            </span>

              <span className="font-semibold text-sm text-slate-900 truncate">
              {node.name}
            </span>

              {node.allowsProducts && (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Permite productos
              </span>
              )}

              {node.status === 'inactivo' && (
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                Inactiva
              </span>
              )}

            </div>

            <div className="flex items-center gap-3 text-xs">

              {/* Totales acumulados */}
              <div className="hidden sm:flex items-center gap-4 text-slate-500">

              <span title="Productos asociados a esta cuenta y sus descendientes">
                <strong className="text-slate-800">
                  {aggregates.productCount}
                </strong>{' '}
                productos
              </span>

                <span title="Valor monetario total acumulado">
                <strong className="text-slate-900">
                  S/ {aggregates.totalValue.toLocaleString(
                    'es-PE',
                    { minimumFractionDigits: 2 }
                )}
                </strong>
              </span>

              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">

                {node.allowsProducts &&
                    aggregates.productCount > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                onNavigateToProductsWithAccount?.(node.id)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            title="Ver los productos de esta cuenta"
                        >
                          <Package className="size-3.5 inline mr-1 text-teal-600" />
                          Ver bienes
                        </button>
                    )}

                <button
                    type="button"
                    onClick={() => handleOpenCreate(node)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                    title="Agregar subcuenta"
                >
                  <Plus className="size-3.5 inline mr-0.5" />
                  Subcuenta
                </button>

                <button
                    type="button"
                    onClick={() => handleOpenEdit(node)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    title="Editar cuenta"
                >
                  <Edit2 className="size-3.5 inline" />
                </button>

              </div>
            </div>
          </div>

          {/* Ramas hijas */}
          {hasChildren &&
              (isExpanded || shouldExpandForSearch) && (
                  <div className="relative border-l border-slate-200 ml-6">
                    {visibleChildren.map((child) =>
                        renderTree(child)
                    )}
                  </div>
              )}

        </div>
    );
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
            <h1 className="text-3xl font-bold tracking-tight text-[#064c32] md:text-[36px]">
              Clasificación Contable Gubernamental
            </h1>

            <p className="mt-1 text-sm text-[#687871]">
              Catálogo contable jerárquico autorreferenciado • Ejercicio Fiscal 2026
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">

            <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="flex items-center gap-2 rounded-xl bg-[#075c3b] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064c32]"
            >
              <Plus className="size-5" />
              Nueva Cuenta Raíz
            </button>

            <button
                type="button"
                onClick={() => {
                  setCsvError(null);
                  setCsvPreview(null);
                  setCsvModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-4 py-3 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0]"
            >
              <Upload className="size-4" />
              Importar CSV
            </button>

            <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-xl border border-[#075c3b] bg-white px-4 py-3 text-sm font-bold text-[#075c3b] hover:bg-[#edf3f0]"
            >
              <Download className="size-4" />
              Exportar CSV
            </button>

          </div>
        </div>

        {/* Nota institucional */}
        <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-teal-950">

          <Info className="size-5 text-teal-700 shrink-0 mt-0.5" />

          <div className="text-xs leading-relaxed">
            <strong>Catálogo contable de demostración:</strong>{' '}
            Estructura jerárquica con códigos demostrativos estructurados
            (ej. <em>DEMO-01</em>, <em>DEMO-01.01</em>,{' '}
            <em>DEMO-01.01.01</em>). Cada producto se vincula mediante
            su ID interno único a su cuenta correspondiente. El árbol
            admite infinitos niveles sin estar limitado a estructuras fijas.
          </div>

        </div>

        {/* Buscador */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">

          <div className="relative w-full max-w-md">

            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <input
                type="text"
                placeholder="Buscar por código (ej. DEMO-01) o denominación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-teal-600 focus:bg-white"
            />

          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Total:{' '}
            <strong>{accounts.length}</strong> cuentas registradas
          </div>

        </div>

        {/* Árbol jerárquico */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">

          {rootAccounts.length > 0 ? (
              <div className="space-y-1">
                {rootAccounts.map((root) => renderTree(root))}
              </div>
          ) : (
              <div className="py-10 text-center">
                <FolderTree className="mx-auto size-10 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No hay cuentas contables registradas.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Cree una cuenta raíz para comenzar.
                </p>
              </div>
          )}

        </div>

        {/* Modal crear / editar cuenta */}
        {modalMode && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                onClick={() => setModalMode(null)}
            >

              <div
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >

                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {modalMode === 'create'
                          ? parentForNewSub
                              ? `Nueva Subcuenta de [${parentForNewSub.code}]`
                              : 'Nueva Cuenta Raíz'
                          : `Editar Cuenta [${selectedAccount?.code}]`}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Plan contable gubernamental institucional
                    </p>
                  </div>

                  <button
                      type="button"
                      onClick={() => setModalMode(null)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="size-5" />
                  </button>

                </div>

                {formError && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-800 border border-rose-200">
                      <AlertTriangle className="size-4 shrink-0" />
                      {formError}
                    </div>
                )}

                <form onSubmit={handleSaveForm} className="space-y-4">

                  <div className="grid grid-cols-2 gap-3">

                    <label className="text-xs font-bold text-slate-600">
                      Código Contable *

                      <input
                          required
                          value={fCode}
                          onChange={(e) => setFCode(e.target.value)}
                          placeholder="Ej. DEMO-01.01.03"
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm font-bold text-teal-900 outline-none focus:border-teal-600"
                      />
                    </label>

                    <label className="text-xs font-bold text-slate-600">
                      Cuenta Padre

                      <select
                          value={fParentId}
                          onChange={(e) => setFParentId(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none focus:border-teal-600"
                      >
                        <option value="">
                          -- Ninguna (Cuenta Raíz) --
                        </option>

                        {accounts
                            .filter(
                                (account) =>
                                    modalMode === 'create' ||
                                    account.id !== selectedAccount?.id
                            )
                            .map((account) => (
                                <option
                                    key={account.id}
                                    value={account.id}
                                >
                                  {'— '.repeat(
                                      Math.max(0, account.level - 1)
                                  )}{' '}
                                  {account.code} - {account.name}
                                </option>
                            ))}
                      </select>
                    </label>

                  </div>

                  <label className="block text-xs font-bold text-slate-600">
                    Denominación de la Cuenta *

                    <input
                        required
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        placeholder="Ej. Materiales didácticos y de laboratorio práctico"
                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-teal-600"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3">

                    <label className="flex items-center gap-2 cursor-pointer">

                      <input
                          type="checkbox"
                          checked={fAllowsProducts}
                          onChange={(e) =>
                              setFAllowsProducts(e.target.checked)
                          }
                          className="size-4 accent-teal-700 rounded"
                      />

                      <span className="text-xs font-semibold text-slate-800">
                    Permite asignación directa de productos
                  </span>

                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">

                  <span className="text-xs font-semibold text-slate-700">
                    Estado:
                  </span>

                      <select
                          value={fStatus}
                          onChange={(e) => setFStatus(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>

                    </label>

                  </div>

                  <label className="block text-xs font-bold text-slate-600">
                    Observaciones y Justificación

                    <textarea
                        rows={2}
                        value={fNotes}
                        onChange={(e) => setFNotes(e.target.value)}
                        placeholder="Especificaciones o notas de auditoría contable..."
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-teal-600"
                    />
                  </label>

                  <div className="mt-4 flex justify-end gap-2.5 pt-3 border-t border-slate-100">

                    <button
                        type="button"
                        onClick={() => setModalMode(null)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                    >
                      Guardar Cuenta
                    </button>

                  </div>

                </form>
              </div>
            </div>
        )}

        {/* Modal importar CSV */}
        {csvModalOpen && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                onClick={() => setCsvModalOpen(false)}
            >

              <div
                  className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >

                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Importar Catálogo Contable desde CSV
                    </h3>

                    <p className="text-xs text-slate-500">
                      Valida la estructura antes de sobrescribir el catálogo
                    </p>
                  </div>

                  <button
                      type="button"
                      onClick={() => setCsvModalOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="size-5" />
                  </button>

                </div>

                <div className="space-y-4">

                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">

                    <FileSpreadsheet className="mx-auto size-10 text-teal-600 mb-2" />

                    <p className="text-xs font-bold text-slate-800">
                      Seleccione un archivo CSV
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Columnas: id, code, name, parentId, level,
                      allowsProducts, status, version, notes
                    </p>

                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        className="mt-3 text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-teal-800 cursor-pointer"
                    />

                  </div>

                  {csvError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                        {csvError}
                      </div>
                  )}

                  {csvPreview && (
                      <div>

                        <p className="text-xs font-bold text-slate-700 mb-2">
                          Vista previa: {csvPreview.length} cuentas válidas encontradas
                        </p>

                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 text-xs">

                          <table className="w-full text-left">

                            <thead className="bg-slate-50 font-bold text-slate-600">
                            <tr>
                              <th className="p-2 pl-3">Código</th>
                              <th className="p-2">Denominación</th>
                              <th className="p-2">Padre</th>
                              <th className="p-2">Permite Prod.</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                            {csvPreview.slice(0, 10).map((account) => (
                                <tr key={account.id}>

                                  <td className="p-2 pl-3 font-mono font-bold text-teal-800">
                                    {account.code}
                                  </td>

                                  <td className="p-2">
                                    {account.name}
                                  </td>

                                  <td className="p-2 text-slate-500">
                                    {account.parentId || '(Raíz)'}
                                  </td>

                                  <td className="p-2">
                                    {account.allowsProducts ? 'Sí' : 'No'}
                                  </td>

                                </tr>
                            ))}

                            </tbody>

                          </table>
                        </div>

                        {csvPreview.length > 10 && (
                            <p className="mt-2 text-[11px] text-slate-500">
                              Se muestran las primeras 10 cuentas de un total de {csvPreview.length}.
                            </p>
                        )}

                      </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">

                    <button
                        type="button"
                        onClick={() => setCsvModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                        type="button"
                        disabled={!csvPreview || csvPreview.length === 0}
                        onClick={handleApplyCsv}
                        className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50"
                    >
                      Confirmar e Importar
                    </button>

                  </div>

                </div>
              </div>
            </div>
        )}

      </div>
  );
}

export default CuentasContablesView;
