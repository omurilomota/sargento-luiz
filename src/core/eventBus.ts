/**
 * Barramento de eventos genérico (publish/subscribe).
 * Permite que módulos se comuniquem de forma desacoplada
 * publicando e assinando eventos nomeados.
 */

/** Tipo da função de callback para tratamento de eventos */
type EventHandler = (data: unknown) => void;

/** Mapa de nomes de evento para listas de handlers registrados */
const handlers: Record<string, EventHandler[]> = {};

/**
 * Registra um handler para um evento específico.
 * @param event - nome do evento
 * @param handler - função callback a ser chamada quando o evento for emitido
 */
export function on(event: string, handler: EventHandler): void {
  if (!handlers[event]) handlers[event] = [];
  handlers[event].push(handler);
}

/**
 * Remove um handler previamente registrado para um evento.
 * @param event - nome do evento
 * @param handler - função callback a ser removida
 */
export function off(event: string, handler: EventHandler): void {
  if (!handlers[event]) return;
  handlers[event] = handlers[event].filter(h => h !== handler);
}

/**
 * Emite um evento, chamando todos os handlers registrados para ele.
 * @param event - nome do evento
 * @param data - dados opcionais a serem passados aos handlers
 */
export function emit(event: string, data?: unknown): void {
  if (!handlers[event]) return;
  for (const handler of handlers[event]) {
    handler(data);
  }
}

/**
 * Remove todos os handlers de todos os eventos.
 * Útil para resetar o estado ao reiniciar o jogo.
 */
export function clearAll(): void {
  for (const key in handlers) {
    handlers[key] = [];
  }
}
