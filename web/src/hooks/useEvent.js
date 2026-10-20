import { useCallback, useEffect, useState } from 'react';
import eventService from '../services/event.service';

/**
 * Hook para obtener un único evento por id.
 * @param {string|null|undefined} id
 */
export default function useEvent(id) {
  const [state, setState] = useState({ id: null, version: -1, event: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();

    eventService
      .getEventById(id, { signal: controller.signal })
      .then((event) => setState({ id, version, event, error: null }))
      .catch((error) => {
        if (error?.name === 'CanceledError') return;
        setState({ id, version, event: null, error });
      });

    return () => controller.abort();
  }, [id, version]);

  const sameId = Boolean(id) && state.id === id;

  const setEvent = useCallback(
    (updater) =>
      setState((prev) => ({
        ...prev,
        event: typeof updater === 'function' ? updater(prev.event) : updater,
      })),
    [],
  );

  return {
    event: sameId ? state.event : null,
    error: sameId ? state.error : null,
    loading: Boolean(id) && !(sameId && state.version === version),
    setEvent,
    refetch: () => setVersion((v) => v + 1),
  };
}
