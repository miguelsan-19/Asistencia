export interface Asistencia {
  id: number;
  nombre: string;
  lu_1: number;
  ma_1: number;
  mi_1: number;
  ju_1: number;
  vi_1: number;
  sa_1: number;
  do_1: number;
  lu_2: number;
  ma_2: number;
  mi_2: number;
  ju_2: number;
  vi_2: number;
  sa_2: number;
  do_2: number;
  total: number;
  observaciones: string | null;
}

export const DIAS = ['Lu', 'Ma', 'MI', 'Ju', 'Vi', 'Sa', 'Do'] as const;

export const CAMPOS_SEMANA_1 = [
  'lu_1',
  'ma_1',
  'mi_1',
  'ju_1',
  'vi_1',
  'sa_1',
  'do_1',
] as const;

export const CAMPOS_SEMANA_2 = [
  'lu_2',
  'ma_2',
  'mi_2',
  'ju_2',
  'vi_2',
  'sa_2',
  'do_2',
] as const;

export type CampoDia = (typeof CAMPOS_SEMANA_1)[number] | (typeof CAMPOS_SEMANA_2)[number];

export const TODOS_CAMPOS_DIA: CampoDia[] = [...CAMPOS_SEMANA_1, ...CAMPOS_SEMANA_2];