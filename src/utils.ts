import type { Asistencia, CampoDia } from './types';
import { TODOS_CAMPOS_DIA } from './types';

export function normalizarValor(raw: string | number): number {
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, Math.round(n * 2) / 2));
}

export function calcularTotal(
  registro: Pick<Asistencia, CampoDia> | Partial<Asistencia>,
): number {
  let t = 0;
  for (const campo of TODOS_CAMPOS_DIA) t += (registro[campo] as number) ?? 0;
  return Math.round(t * 2) / 2;
}

export function formatTotal(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export function nuevoRegistroVacio(): Asistencia {
  return {
    id: 0,
    nombre: '',
    lu_1: 0,
    ma_1: 0,
    mi_1: 0,
    ju_1: 0,
    vi_1: 0,
    sa_1: 0,
    do_1: 0,
    lu_2: 0,
    ma_2: 0,
    mi_2: 0,
    ju_2: 0,
    vi_2: 0,
    sa_2: 0,
    do_2: 0,
    total: 0,
    observaciones: null,
  };
}
