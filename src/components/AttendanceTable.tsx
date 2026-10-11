import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Asistencia,
  type CampoDia,
  DIAS,
  CAMPOS_SEMANA_1,
  CAMPOS_SEMANA_2,
} from '../types';
import {
  actualizarAsistencia,
  crearAsistencia,
  eliminarAsistencia,
  listarAsistencias,
  reemplazarAsistencias,
} from '../api';
import {
  calcularTotal,
  formatTotal,
  ordenarPorNombre,
  siguienteValorDia,
} from '../utils';
import { exportarAExcel, importarDeExcel } from '../excel';

const thBase =
  'border border-gray-400 bg-slate-200 px-2 py-1.5 font-bold uppercase tracking-wide';
const thDay = 'border border-gray-400 bg-slate-100 px-1 py-1.5 font-bold';
const tdBase = 'border border-gray-300 px-1 py-0.5';
const inputBase =
  'w-full bg-transparent text-center py-1 focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 rounded';

export default function AttendanceTable() {
  const [registros, setRegistros] = useState<Asistencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRegistros(listarAsistencias());
    setCargando(false);
  }, []);

  const registrosOrdenados = useMemo(
    () => ordenarPorNombre(registros),
    [registros],
  );

  const actualizarRegistro = useCallback((nuevo: Asistencia) => {
    setRegistros((prev) =>
      prev.map((r) => (r.id === nuevo.id ? nuevo : r)),
    );
    actualizarAsistencia(nuevo.id, nuevo);
  }, []);

  const cambiarDia = (registro: Asistencia, campo: CampoDia) => {
    const valor = siguienteValorDia(registro[campo]);
    const proximo: Asistencia = { ...registro, [campo]: valor };
    proximo.total = calcularTotal(proximo);
    actualizarRegistro(proximo);
  };

  const cambiarNombre = (registro: Asistencia, valor: string) => {
    actualizarRegistro({ ...registro, nombre: valor });
  };

  const cambiarObservaciones = (registro: Asistencia, valor: string) => {
    actualizarRegistro({ ...registro, observaciones: valor });
  };

  const agregarTrabajador = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const creado = crearAsistencia({ nombre, total: 0 });
    setRegistros((prev) => [...prev, creado]);
    setNuevoNombre('');
    setError(null);
  };

  const borrarTrabajador = (registro: Asistencia) => {
    if (!window.confirm(`¿Eliminar a "${registro.nombre}"?`)) return;
    eliminarAsistencia(registro.id);
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
    setError(null);
  };

  const exportar = async () => {
    setExportando(true);
    setError(null);
    try {
      await exportarAExcel(registrosOrdenados);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al generar el Excel',
      );
    } finally {
      setExportando(false);
    }
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportando(true);
    setError(null);
    try {
      const importados = await importarDeExcel(file);
      if (importados.length === 0) {
        setError('El archivo no contiene trabajadores para importar.');
        return;
      }
      if (
        !window.confirm(
          `Se importarán ${importados.length} trabajador(es). ¿Reemplazar la tabla actual?`,
        )
      ) {
        return;
      }
      const conIds = reemplazarAsistencias(importados);
      setRegistros(conIds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al importar el Excel',
      );
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-slate-800 sm:text-xl">
          CONTROL DIARIO DE ASISTENCIA
        </h1>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <span className="hidden text-sm text-emerald-600 md:block">
            Los cambios se guardan en este navegador. Exporta el Excel para respaldar en disco.
          </span>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={importar}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importando}
              className="flex-1 rounded bg-slate-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-slate-700 disabled:opacity-60 md:flex-none"
            >
              {importando ? 'Importando…' : 'Importar Excel'}
            </button>
            <button
              onClick={exportar}
              disabled={exportando}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 md:flex-none"
            >
              {exportando ? 'Generando…' : 'Exportar a Excel'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button className="font-bold" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {cargando ? (
        <p className="py-8 text-center text-slate-500">Cargando…</p>
      ) : (
        <>
          {/* ---------- Vista escritorio: tabla ---------- */}
          <div className="hidden overflow-x-auto rounded border border-gray-400 shadow-sm md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th rowSpan={2} className={thBase}>
                    N°
                  </th>
                  <th rowSpan={2} className={thBase}>
                    NOMBRE
                  </th>
                  <th
                    colSpan={7}
                    className="border border-gray-400 bg-slate-200 px-2 py-1.5 text-center font-bold"
                  >
                    Semana 1
                  </th>
                  <th rowSpan={2} className={`${thDay} w-2 bg-gray-300`}></th>
                  <th
                    colSpan={7}
                    className="border border-gray-400 bg-slate-200 px-2 py-1.5 text-center font-bold"
                  >
                    Semana 2
                  </th>
                  <th rowSpan={2} className={`${thDay} w-2 bg-gray-300`}></th>
                  <th rowSpan={2} className={thBase}>
                    Total
                  </th>
                  <th rowSpan={2} className={thBase}>
                    Observaciones
                  </th>
                  <th rowSpan={2} className={thBase}></th>
                </tr>
                <tr>
                  {DIAS.map((d) => (
                    <th key={`w1-${d}`} className={thDay}>
                      {d}
                    </th>
                  ))}
                  {DIAS.map((d) => (
                    <th key={`w2-${d}`} className={thDay}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosOrdenados.map((registro, idx) => (
                  <tr
                    key={registro.id}
                    className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className={`${tdBase} text-center`}>{idx + 1}</td>
                    <td className={tdBase}>
                      <input
                        type="text"
                        value={registro.nombre}
                        onChange={(e) => cambiarNombre(registro, e.target.value)}
                        className={`${inputBase} text-left`}
                      />
                    </td>
                    {CAMPOS_SEMANA_1.map((campo) => (
                      <td key={campo} className={tdBase}>
                        <DiaInput
                          valor={registro[campo]}
                          onClic={() => cambiarDia(registro, campo)}
                        />
                      </td>
                    ))}
                    <td className={`${tdBase} bg-gray-100`}></td>
                    {CAMPOS_SEMANA_2.map((campo) => (
                      <td key={campo} className={tdBase}>
                        <DiaInput
                          valor={registro[campo]}
                          onClic={() => cambiarDia(registro, campo)}
                        />
                      </td>
                    ))}
                    <td className={`${tdBase} bg-gray-100`}></td>
                    <td
                      className={`${tdBase} text-center font-bold text-slate-800`}
                    >
                      {formatTotal(registro.total)}
                    </td>
                    <td className={tdBase}>
                      <input
                        type="text"
                        value={registro.observaciones ?? ''}
                        placeholder="—"
                        onChange={(e) =>
                          cambiarObservaciones(registro, e.target.value)
                        }
                        className={`${inputBase} text-left`}
                      />
                    </td>
                    <td className={`${tdBase} text-center`}>
                      <button
                        title="Eliminar"
                        onClick={() => borrarTrabajador(registro)}
                        className="rounded px-1.5 text-red-500 hover:bg-red-100"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
                {registrosOrdenados.length === 0 && (
                  <tr>
                    <td colSpan={20} className="py-8 text-center text-slate-500">
                      Sin registros. Agrega un trabajador para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ---------- Vista móvil: tarjetas táctiles ---------- */}
          <div className="space-y-3 md:hidden">
            {registrosOrdenados.length === 0 && (
              <p className="rounded border border-gray-300 bg-white py-8 text-center text-slate-500 shadow-sm">
                Sin registros. Agrega un trabajador para comenzar.
              </p>
            )}
            {registrosOrdenados.map((registro, idx) => (
              <TarjetaTrabajador
                key={registro.id}
                registro={registro}
                numero={idx + 1}
                onCambiarDia={cambiarDia}
                onCambiarNombre={cambiarNombre}
                onCambiarObservaciones={cambiarObservaciones}
                onBorrar={borrarTrabajador}
              />
            ))}
          </div>
        </>
      )}

      <form
        onSubmit={agregarTrabajador}
        className="flex flex-col gap-2 rounded border border-gray-300 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
      >
        <label className="text-sm font-semibold text-slate-700">
          Nuevo trabajador:
        </label>
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre completo"
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}

function TarjetaTrabajador({
  registro,
  numero,
  onCambiarDia,
  onCambiarNombre,
  onCambiarObservaciones,
  onBorrar,
}: {
  registro: Asistencia;
  numero: number;
  onCambiarDia: (registro: Asistencia, campo: CampoDia) => void;
  onCambiarNombre: (registro: Asistencia, valor: string) => void;
  onCambiarObservaciones: (registro: Asistencia, valor: string) => void;
  onBorrar: (registro: Asistencia) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-700">
          {numero}
        </span>
        <input
          type="text"
          value={registro.nombre}
          onChange={(e) => onCambiarNombre(registro, e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="shrink-0 rounded bg-blue-600 px-2 py-1 text-sm font-bold text-white">
          {formatTotal(registro.total)}
        </span>
        <button
          title="Eliminar"
          onClick={() => onBorrar(registro)}
          className="shrink-0 rounded px-1.5 text-lg text-red-500 hover:bg-red-100"
        >
          🗑
        </button>
      </div>

      <SemanaDias
        titulo="Semana 1"
        registro={registro}
        campos={CAMPOS_SEMANA_1}
        onCambiarDia={onCambiarDia}
      />
      <SemanaDias
        titulo="Semana 2"
        registro={registro}
        campos={CAMPOS_SEMANA_2}
        onCambiarDia={onCambiarDia}
      />

      <input
        type="text"
        value={registro.observaciones ?? ''}
        placeholder="Observaciones"
        onChange={(e) => onCambiarObservaciones(registro, e.target.value)}
        className="mt-2 w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}

function SemanaDias({
  titulo,
  registro,
  campos,
  onCambiarDia,
}: {
  titulo: string;
  registro: Asistencia;
  campos: readonly CampoDia[];
  onCambiarDia: (registro: Asistencia, campo: CampoDia) => void;
}) {
  return (
    <div className="mt-1">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {campos.map((campo, i) => (
          <DiaCeldaMovil
            key={campo}
            dia={DIAS[i]}
            valor={registro[campo]}
            onClic={() => onCambiarDia(registro, campo)}
          />
        ))}
      </div>
    </div>
  );
}

function DiaCeldaMovil({
  dia,
  valor,
  onClic,
}: {
  dia: string;
  valor: number;
  onClic: () => void;
}) {
  const estado =
    valor >= 1
      ? 'bg-emerald-500 text-white'
      : valor >= 0.5
        ? 'bg-amber-400 text-amber-900'
        : 'bg-gray-100 text-slate-400 active:bg-gray-300';
  const etiqueta = valor >= 1 ? '✓' : valor >= 0.5 ? '½' : '';

  return (
    <button
      type="button"
      title="Clic para ciclar: 1 → ½ → 0"
      onClick={onClic}
      className={`${estado} flex aspect-square flex-col items-center justify-center rounded-md text-center transition-colors select-none`}
    >
      <span className="text-[10px] font-bold opacity-70">{dia}</span>
      <span className="text-sm font-bold leading-tight">{etiqueta}</span>
    </button>
  );
}

function DiaInput({
  valor,
  onClic,
}: {
  valor: number;
  onClic: () => void;
}) {
  const estado =
    valor >= 1
      ? 'bg-emerald-500 text-white font-bold'
      : valor >= 0.5
        ? 'bg-amber-400 text-amber-900 font-bold'
        : 'bg-gray-100 text-slate-400 hover:bg-gray-200';
  const etiqueta = valor >= 1 ? '✓' : valor >= 0.5 ? '½' : '';

  return (
    <button
      type="button"
      title="Clic para ciclar: 1 → ½ → 0"
      onClick={onClic}
      className={`${estado} w-full cursor-pointer rounded py-1 text-center transition-colors select-none`}
    >
      {etiqueta}
    </button>
  );
}