import api from './api';

const BASE = '/events';

export const PAYMENT_METHODS = ['efectivo', 'transferencia'];

/**
 * @typedef {Object} Event
 * @property {string} _id
 * @property {string} nameAndLastName
 * @property {boolean} isAssisted
 * @property {'efectivo'|'transferencia'} methodPayment
 * @property {number} totalPayment
 * @property {number} paidAmount
 * @property {string} creado
 * @property {string} actualizado
 */

/** GET /events */
export const getEvents = async (config) => {
  const { data } = await api.get(BASE, config);
  return data.data;
};

/** GET /events/:id */
export const getEventById = async (id, config) => {
  const { data } = await api.get(`${BASE}/${id}`, config);
  return data.data;
};

/** POST /events */
export const createEvent = async (event) => {
  const { data } = await api.post(BASE, event);
  return data.data;
};

/** PUT /events/:id (reemplazo) */
export const replaceEvent = async (id, event) => {
  const { data } = await api.put(`${BASE}/${id}`, event);
  return data.data;
};

/** PATCH /events/:id (actualización parcial) */
export const updateEvent = async (id, changes) => {
  const { data } = await api.patch(`${BASE}/${id}`, changes);
  return data.data;
};

/** PATCH /events/:id/attendance */
export const updateAttendance = async (id, isAssisted) => {
  const { data } = await api.patch(`${BASE}/${id}/attendance`, { isAssisted });
  return data.data;
};

/** PATCH /events/:id/payment */
export const updatePayment = async (id, { paidAmount, methodPayment } = {}) => {
  const body = {};
  if (paidAmount !== undefined) body.paidAmount = paidAmount;
  if (methodPayment !== undefined) body.methodPayment = methodPayment;
  const { data } = await api.patch(`${BASE}/${id}/payment`, body);
  return data.data;
};

/** DELETE /events/:id */
export const deleteEvent = async (id) => {
  await api.delete(`${BASE}/${id}`);
  return id;
};

/**
 * POST /events/import/excel
 * @param {File} file archivo .xlsx (máx. 5MB)
 * @returns {Promise<{ message: string, count: number, data: Event[] }>}
 */
export const importEventsFromExcel = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`${BASE}/import/excel`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return data;
};

const eventService = {
  getEvents,
  getEventById,
  createEvent,
  replaceEvent,
  updateEvent,
  updateAttendance,
  updatePayment,
  deleteEvent,
  importEventsFromExcel,
};

export default eventService;
