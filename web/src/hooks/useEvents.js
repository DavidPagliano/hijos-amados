import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import eventService from '../services/event.service';

/**
 * Hook para gestionar la lista de eventos (inscriptos).
 *
 * @param {{ autoFetch?: boolean }} [options]
 */
export default function useEvents({ autoFetch = true } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEvents({ signal: controller.signal });
      setEvents(data);
      return data;
    } catch (err) {
      if (err?.name === 'CanceledError') return undefined;
      setError(err);
      throw err;
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, []);

  // Carga inicial (el estado solo se actualiza en callbacks asíncronos).
  useEffect(() => {
    if (!autoFetch) return undefined;
    const controller = new AbortController();
    abortRef.current = controller;

    eventService
      .getEvents({ signal: controller.signal })
      .then((data) => setEvents(data))
      .catch((err) => {
        if (err?.name !== 'CanceledError') setError(err);
      })
      .finally(() => {
        if (abortRef.current === controller) setLoading(false);
      });

    return () => controller.abort();
  }, [autoFetch]);

  // Ejecuta una mutación manejando loading/error de forma uniforme.
  const run = useCallback(async (action) => {
    setMutating(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setMutating(false);
    }
  }, []);

  const replaceInList = (updated) =>
    setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

  const createEvent = useCallback(
    (event) =>
      run(async () => {
        const created = await eventService.createEvent(event);
        setEvents((prev) => [...prev, created]);
        return created;
      }),
    [run],
  );

  const updateEvent = useCallback(
    (id, changes) =>
      run(async () => {
        const updated = await eventService.updateEvent(id, changes);
        replaceInList(updated);
        return updated;
      }),
    [run],
  );

  const updatePayment = useCallback(
    (id, payment) =>
      run(async () => {
        const updated = await eventService.updatePayment(id, payment);
        replaceInList(updated);
        return updated;
      }),
    [run],
  );

  // Optimista: cambia el estado al instante y revierte si falla.
  const toggleAttendance = useCallback(
    async (id, isAssisted) => {
      let previous;
      setEvents((prev) =>
        prev.map((e) => {
          if (e._id !== id) return e;
          previous = e;
          return { ...e, isAssisted };
        }),
      );
      try {
        const updated = await eventService.updateAttendance(id, isAssisted);
        replaceInList(updated);
        return updated;
      } catch (err) {
        if (previous) replaceInList(previous);
        setError(err);
        throw err;
      }
    },
    [],
  );

  const deleteEvent = useCallback(
    (id) =>
      run(async () => {
        await eventService.deleteEvent(id);
        setEvents((prev) => prev.filter((e) => e._id !== id));
        return id;
      }),
    [run],
  );

  const importFromExcel = useCallback(
    (file, onUploadProgress) =>
      run(async () => {
        const result = await eventService.importEventsFromExcel(file, onUploadProgress);
        setEvents((prev) => [...prev, ...result.data]);
        return result;
      }),
    [run],
  );

  const stats = useMemo(() => {
    const total = events.length;
    const present = events.filter((e) => e.isAssisted).length;
    const totalExpected = events.reduce((sum, e) => sum + (e.totalPayment || 0), 0);
    const totalPaid = events.reduce((sum, e) => sum + (e.paidAmount || 0), 0);
    return {
      total,
      present,
      absent: total - present,
      totalExpected,
      totalPaid,
      pending: totalExpected - totalPaid,
      fullyPaid: events.filter((e) => e.paidAmount >= e.totalPayment).length,
    };
  }, [events]);

  return {
    events,
    stats,
    loading,
    mutating,
    error,
    clearError: () => setError(null),
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    updatePayment,
    toggleAttendance,
    deleteEvent,
    importFromExcel,
  };
}
