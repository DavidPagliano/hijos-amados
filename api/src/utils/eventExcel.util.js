const ExcelJS = require('exceljs');

const normalizeHeader = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const excelDataError = (ErrorType, message) =>
  Object.assign(new ErrorType(message), { status: 400 });

const HEADER_ALIASES = {
  nameAndLastName: ['nombre y apellido', 'nombre apellido'],
  isAssisted: ['presente'],
  methodPayment: ['pagos', 'pago'],
  totalPayment: ['total'],
};

const findHeaderRow = (worksheet) => {
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const columns = {};

    row.eachCell((cell, columnNumber) => {
      const header = normalizeHeader(cell.text);
      for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        if (aliases.includes(header)) columns[field] = columnNumber;
      }
    });

    if (Object.keys(HEADER_ALIASES).every((field) => columns[field])) {
      return { rowNumber, columns };
    }
  }

  throw excelDataError(Error,
    'No se encontró una fila con los encabezados Nombre y Apellido, Presente, Pagos y Total.',
  );
};

const parseAttendance = (value, rowNumber) => {
  const normalized = normalizeHeader(value);
  if (value === null || value === undefined || normalized === '') return false;
  if ([true, 1].includes(value) || ['si', 's', 'x', '1', 'true', 'presente'].includes(normalized)) {
    return true;
  }
  if ([false, 0].includes(value) || ['no', 'n', '0', 'false', 'ausente'].includes(normalized)) {
    return false;
  }

  throw excelDataError(Error, `Valor de Presente inválido en la fila ${rowNumber}.`);
};

const parseAmount = (value, rowNumber) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;

  const normalized = String(value ?? '')
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:,|$))/g, '')
    .replace(',', '.');
  const amount = Number(normalized);

  if (!normalized || !Number.isFinite(amount) || amount < 0) {
    throw excelDataError(Error, `Total inválido en la fila ${rowNumber}.`);
  }

  return amount;
};

const getFillRgb = (cell) => {
  const color = cell.fill?.fgColor;
  if (color?.argb || color?.rgb) return (color.argb || color.rgb).slice(-6).toUpperCase();

  const indexedColors = {
    2: 'FF0000',
    3: '00FF00',
    4: '0000FF',
    5: 'FFFF00',
    6: 'FF00FF',
    7: '00FFFF',
  };
  if (color?.indexed !== undefined) return indexedColors[color.indexed] || null;

  return null;
};

const parsePaymentMethod = (cell, rowNumber) => {
  const rgb = getFillRgb(cell);
  if (!rgb) {
    throw excelDataError(Error,
      `No se pudo identificar el color de PAGOS en la fila ${rowNumber}; se esperaba verde (transferencia) o rojo (efectivo).`,
    );
  }

  const red = Number.parseInt(rgb.slice(0, 2), 16);
  const green = Number.parseInt(rgb.slice(2, 4), 16);
  const blue = Number.parseInt(rgb.slice(4, 6), 16);

  if (red >= 150 && red > green * 1.4 && red > blue * 1.4) return 'efectivo';
  if (green >= 100 && green > red * 1.15 && green > blue * 1.1) return 'transferencia';

  throw excelDataError(Error,
    `Color de PAGOS no reconocido en la fila ${rowNumber}; se esperaba verde (transferencia) o rojo (efectivo).`,
  );
};

const getCellValue = (row, columnNumber) => {
  const value = row.getCell(columnNumber).value;
  if (value && typeof value === 'object' && 'result' in value) return value.result;
  if (value && typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map(({ text }) => text).join('');
  }
  return value;
};

const parseEventsFromExcel = async (fileBuffer) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw excelDataError(TypeError, 'El archivo Excel debe recibirse como un buffer no vacío.');
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer);
  } catch (error) {
    throw excelDataError(Error, `No se pudo leer el archivo Excel: ${error.message}`);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw excelDataError(Error, 'El archivo Excel no contiene hojas de cálculo.');

  const { rowNumber: headerRowNumber, columns } = findHeaderRow(worksheet);
  const events = [];

  for (let currentRow = headerRowNumber + 1; currentRow <= worksheet.rowCount; currentRow += 1) {
    const row = worksheet.getRow(currentRow);
    const nameAndLastName = String(getCellValue(row, columns.nameAndLastName) ?? '').trim();
    if (!nameAndLastName) continue;

    events.push({
      nameAndLastName,
      isAssisted: parseAttendance(getCellValue(row, columns.isAssisted), currentRow),
      methodPayment: parsePaymentMethod(row.getCell(columns.methodPayment), currentRow),
      totalPayment: parseAmount(getCellValue(row, columns.totalPayment), currentRow),
      paidAmount: 0,
      rowNumber: currentRow,
    });
  }

  if (events.length === 0) {
    throw excelDataError(Error, 'El archivo Excel no contiene filas de eventos para importar.');
  }

  return events;
};

module.exports = { parseEventsFromExcel };
