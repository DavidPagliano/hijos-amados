const assert = require('node:assert/strict');
const test = require('node:test');
const ExcelJS = require('exceljs');
const Event = require('../models/Event');
const eventService = require('./event.service');

const createWorkbookBuffer = async ({ paymentColor = 'FFFF0000', headers = true } = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Entradas');
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'ENTRADAS';

  if (headers) {
    worksheet.addRow(['Nombre y Apellido', 'Presente', 'Pagos', 'Total']);
  }

  const transferRow = worksheet.addRow(['MARI GIMENEZ', '', 'TRANSFERENCIA', 20000]);
  transferRow.getCell(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00B050' },
  };

  const cashRow = worksheet.addRow(['ISAIAS', 'SI', 'EFECTIVO - SILVI', '$ 20.000,00']);
  cashRow.getCell(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: paymentColor },
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

test('imports events through the service and stores paidAmount as zero', async (t) => {
  const originalInsertMany = Event.insertMany;
  Event.insertMany = async (events) => events;
  t.after(() => {
    Event.insertMany = originalInsertMany;
  });

  const events = await eventService.importEventsFromExcel(await createWorkbookBuffer());

  assert.deepEqual(
    events.map(({ nameAndLastName, isAssisted, methodPayment, totalPayment, paidAmount }) => ({
      nameAndLastName,
      isAssisted,
      methodPayment,
      totalPayment,
      paidAmount,
    })),
    [
      {
        nameAndLastName: 'MARI GIMENEZ',
        isAssisted: false,
        methodPayment: 'transferencia',
        totalPayment: 20000,
        paidAmount: 0,
      },
      {
        nameAndLastName: 'ISAIAS',
        isAssisted: true,
        methodPayment: 'efectivo',
        totalPayment: 20000,
        paidAmount: 0,
      },
    ],
  );
});

test('rejects unrecognized payment colors without inserting rows', async (t) => {
  let insertAttempted = false;
  const originalInsertMany = Event.insertMany;
  Event.insertMany = async () => {
    insertAttempted = true;
  };
  t.after(() => {
    Event.insertMany = originalInsertMany;
  });

  await assert.rejects(
    eventService.importEventsFromExcel(await createWorkbookBuffer({ paymentColor: 'FFFFFF00' })),
    /Color de PAGOS no reconocido en la fila 4/,
  );
  assert.equal(insertAttempted, false);
});

test('rejects workbooks without the required headers', async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Entradas').addRow(['Nombre', 'Presente', 'Pagos', 'Total']);

  await assert.rejects(
    eventService.importEventsFromExcel(Buffer.from(await workbook.xlsx.writeBuffer())),
    /No se encontró una fila con los encabezados/,
  );
});

test('creates an event with no payments registered by default', async (t) => {
  let savedEvent;
  const originalSave = Event.prototype.save;
  Event.prototype.save = async function save() {
    savedEvent = this;
    return this;
  };
  t.after(() => {
    Event.prototype.save = originalSave;
  });

  const event = await eventService.createEvent({
    nameAndLastName: 'MIA',
    isAssisted: false,
    methodPayment: 'transferencia',
    totalPayment: 20000,
  });

  assert.equal(event.paidAmount, 0);
  assert.equal(savedEvent.nameAndLastName, 'MIA');
});

test('rejects initial payments greater than the event total', async () => {
  await assert.rejects(
    eventService.createEvent({
      nameAndLastName: 'MIA',
      isAssisted: false,
      methodPayment: 'transferencia',
      totalPayment: 20000,
      paidAmount: 25000,
    }),
    /entre cero y el total/,
  );
});

test('updates presence only with a boolean value', async (t) => {
  let update;
  const originalFindByIdAndUpdate = Event.findByIdAndUpdate;
  Event.findByIdAndUpdate = async (...args) => {
    update = args;
    return { _id: args[0], ...args[1] };
  };
  t.after(() => {
    Event.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  assert.deepEqual(await eventService.updateAttendance('event-id', true), {
    _id: 'event-id',
    isAssisted: true,
  });
  assert.deepEqual(update, ['event-id', { isAssisted: true }, { new: true, runValidators: true }]);
  await assert.rejects(eventService.updateAttendance('event-id', 'si'), /debe ser booleano/);
});

test('updates partial payments and rejects amounts greater than the total', async (t) => {
  const originalFindById = Event.findById;
  const originalFindByIdAndUpdate = Event.findByIdAndUpdate;
  Event.findById = async () => ({
    totalPayment: 20000,
    paidAmount: 0,
    methodPayment: 'efectivo',
  });
  Event.findByIdAndUpdate = async (_id, update) => update;
  t.after(() => {
    Event.findById = originalFindById;
    Event.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  assert.deepEqual(await eventService.updatePayment('event-id', { paidAmount: 10000 }), {
    paidAmount: 10000,
  });
  await assert.rejects(
    eventService.updatePayment('event-id', { paidAmount: 25000 }),
    /entre cero y el total/,
  );
});
