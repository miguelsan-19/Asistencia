import type { Asistencia } from './types';
import { calcularTotal } from './utils';

const STORAGE_KEY = 'planilla_asistencia_registros';

function cargarRegistros(): Asistencia[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarRegistros(registros: Asistencia[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

export function listarAsistencias(): Asistencia[] {
  return cargarRegistros();
}

export function crearAsistencia(
  data: Partial<Asistencia>,
): Asistencia {
  const registros = cargarRegistros();
  const id = registros.length
    ? Math.max(...registros.map((r) => r.id)) + 1
    : 1;
  const creado: Asistencia = {
    id,
    nombre: data.nombre ?? '',
    lu_1: data.lu_1 ?? 0,
    ma_1: data.ma_1 ?? 0,
    mi_1: data.mi_1 ?? 0,
    ju_1: data.ju_1 ?? 0,
    vi_1: data.vi_1 ?? 0,
    sa_1: data.sa_1 ?? 0,
    do_1: data.do_1 ?? 0,
    lu_2: data.lu_2 ?? 0,
    ma_2: data.ma_2 ?? 0,
    mi_2: data.mi_2 ?? 0,
    ju_2: data.ju_2 ?? 0,
    vi_2: data.vi_2 ?? 0,
    sa_2: data.sa_2 ?? 0,
    do_2: data.do_2 ?? 0,
    total: calcularTotal(data),
    observaciones: data.observaciones ?? null,
  };
  registros.push(creado);
  guardarRegistros(registros);
  return creado;
}

export function actualizarAsistencia(
  id: number,
  data: Partial<Asistencia>,
): Asistencia {
  const registros = cargarRegistros();
  const index = registros.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Registro no encontrado');
  const actualizado: Asistencia = { ...registros[index], ...data, total: calcularTotal({ ...registros[index], ...data }) };
  registros[index] = actualizado;
  guardarRegistros(registros);
  return actualizado;
}

export function eliminarAsistencia(id: number): void {
  const registros = cargarRegistros().filter((r) => r.id !== id);
  guardarRegistros(registros);
}

export function reemplazarAsistencias(nuevos: Asistencia[]): Asistencia[] {
  const conIds = nuevos.map((r, i) => ({ ...r, id: i + 1 }));
  guardarRegistros(conIds);
  return conIds;
}

