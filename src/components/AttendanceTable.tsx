import { useCallback, useEffect, useRef, useState } from 'react';
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
import { normalizarValor, calcularTotal, formatTotal } from '../utils';
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

  const actualizarRegistro = useCallback((nuevo: Asistencia) => {
    setRegistros((prev) =>
      prev.map((r) => (r.id === nuevo.id ? nuevo : r)),
    );
    actualizarAsistencia(nuevo.id, nuevo);
  }, []);

  const cambiarDia = (registro: Asistencia, campo: CampoDia, raw: string) => {
    const valor = normalizarValor(raw);
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
      await exportarAExcel(registros);
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
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-800">
          CONTROL DIARIO DE ASISTENCIA
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-600">
            Los cambios se guardan en este navegador. Exporta el Excel para respaldar en disco.
          </span>
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
            className="rounded bg-slate-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-slate-700 disabled:opacity-60"
          >
            {importando ? 'Importando…' : 'Importar Excel'}
          </button>
          <button
            onClick={exportar}
            disabled={exportando}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {exportando ? 'Generando…' : 'Exportar a Excel'}
          </button>
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
        <div className="overflow-x-auto rounded border border-gray-400 shadow-sm">
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
              {registros.map((registro, idx) => (
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
                        onChange={(raw) => cambiarDia(registro, campo, raw)}
                      />
                    </td>
                  ))}
                  <td className={`${tdBase} bg-gray-100`}></td>
                  {CAMPOS_SEMANA_2.map((campo) => (
                    <td key={campo} className={tdBase}>
                      <DiaInput
                        valor={registro[campo]}
                        onChange={(raw) => cambiarDia(registro, campo, raw)}
                      />
                    </td>
                  ))}
                  <td className={`${tdBase} bg-gray-100`}></td>
                  <td className={`${tdBase} text-center font-bold text-slate-800`}>
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
              {registros.length === 0 && (
                <tr>
                  <td colSpan={20} className="py-8 text-center text-slate-500">
                    Sin registros. Agrega un trabajador para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={agregarTrabajador}
        className="flex items-center gap-2 rounded border border-gray-300 bg-white p-3 shadow-sm"
      >
        <label className="text-sm font-semibold text-slate-700">
          Nuevo trabajador:
        </label>
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre completo"
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

function DiaInput({
  valor,
  onChange,
}: {
  valor: number;
  onChange: (raw: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={1}
      step={0.5}
      value={formatTotal(valor)}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.currentTarget.select()}
      className={inputBase}
    />
  );
}