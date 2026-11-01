// Minimal pub/sub so features can react to each other without importing each other's internals.

const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[events] ${event} handler failed`, err);
    }
  });
}
