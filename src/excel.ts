import ExcelJS from 'exceljs';
import type { Asistencia } from './types';
import { TODOS_CAMPOS_DIA } from './types';

const DIAS = ['Lu', 'Ma', 'MI', 'Ju', 'Vi', 'Sa', 'Do'] as const;

const COLUMN_WIDTHS = [
  5.33, 35.55, 2.89, 3.55, 3.44, 3.0, 4.44, 2.89, 3.55, 1.55,
  2.89, 3.55, 4.55, 4.55, 3.0, 3.11, 3.33, 1.78, 5.22, 22.11,
];

const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

export async function exportarAExcel(records: Asistencia[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Planilla Asistencia';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Planilla', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      horizontalCentered: true,
      verticalCentered: true,
    },
  });

  COLUMN_WIDTHS.forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });

  // ---- Título (filas 2 y 3) ----
  ws.mergeCells(2, 1, 3, 20); // A2:T3
  const title = ws.getCell(2, 1);
  title.value = 'CONTROL DIARIO DE ASISTENCIA';
  title.font = { bold: true, size: 16, name: 'Calibri' };
  title.alignment = { horizontal: 'center', vertical: 'middle' };

  // ---- Fila 4: agrupación de semanas ----
  ws.mergeCells(4, 3, 4, 10); // C4:J4
  ws.mergeCells(4, 11, 4, 18); // K4:R4
  const semana1 = ws.getCell(4, 3);
  semana1.value = 'Semana 1';
  semana1.font = { bold: true, size: 12 };
  semana1.alignment = { horizontal: 'center', vertical: 'middle' };
  const semana2 = ws.getCell(4, 11);
  semana2.value = 'Semana 2';
  semana2.font = { bold: true, size: 12 };
  semana2.alignment = { horizontal: 'center', vertical: 'middle' };
  for (let col = 1; col <= 20; col++) {
    const cell = ws.getCell(4, col);
    cell.border = thinBorder;
  }

  // ---- Fila 5: cabeceras ----
  const headerCell = (row: number, col: number, value?: string) => {
    const cell = ws.getCell(row, col);
    if (value !== undefined) cell.value = value;
    cell.font = { bold: true, name: 'Calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDDEBF7' },
    };
  };

  headerCell(5, 1, 'N°');
  headerCell(5, 2, 'NOMBRE');
  for (let i = 0; i < 7; i++) {
    headerCell(5, 3 + i, DIAS[i]); // C..I (Semana 1)
    headerCell(5, 11 + i, DIAS[i]); // K..Q (Semana 2)
  }
  headerCell(5, 10); // J: columna vacía separadora
  headerCell(5, 18); // R: columna vacía separadora
  headerCell(5, 19, 'Total');
  headerCell(5, 20, 'Observaciones');

  ws.getRow(4).height = 22;
  ws.getRow(5).height = 20;

  // ---- Filas de datos ----
  records.forEach((record, index) => {
    const row = 6 + index;
    const values = TODOS_CAMPOS_DIA.map((campo) => record[campo]);

    const dataCell = (
      col: number,
      value: string | number,
      opts: { left?: boolean; bold?: boolean } = {},
    ) => {
      const cell = ws.getCell(row, col);
      cell.value = value;
      cell.alignment = opts.left
        ? { horizontal: 'left', vertical: 'middle' }
        : { horizontal: 'center', vertical: 'middle' };
      cell.font = { bold: !!opts.bold, name: 'Calibri' };
      cell.border = thinBorder;
    };

    dataCell(1, index + 1); // N°
    dataCell(2, record.nombre, { left: true });
    for (let i = 0; i < 7; i++) {
      dataCell(3 + i, values[i]); // Semana 1
      dataCell(11 + i, values[7 + i]); // Semana 2
    }
    ws.getCell(row, 10).border = thinBorder; // separador J
    ws.getCell(row, 18).border = thinBorder; // separador R
    dataCell(19, record.total, { bold: true }); // Total
    dataCell(20, record.observaciones ?? '', { left: true }); // Observaciones

    ws.getRow(row).height = 18;
  });

  // Repetir cabeceras al imprimir
  ws.views = [{ state: 'frozen', ySplit: 5 }];
  ws.pageSetup.printTitlesRow = '1:5';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME_XLSX });

  const filename = `CONTROL DIARIO DE ASISTENCIA ${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
