type EventHandler = (data: any) => void;

const handlers: Record<string, EventHandler[]> = {};

export function on(event: string, handler: EventHandler): void {
  if (!handlers[event]) handlers[event] = [];
  handlers[event].push(handler);
}

export function off(event: string, handler: EventHandler): void {
  if (!handlers[event]) return;
  handlers[event] = handlers[event].filter(h => h !== handler);
}

export function emit(event: string, data?: any): void {
  if (!handlers[event]) return;
  for (const handler of handlers[event]) {
    handler(data);
  }
}

export function clearAll(): void {
  for (const key in handlers) {
    handlers[key] = [];
  }
}
