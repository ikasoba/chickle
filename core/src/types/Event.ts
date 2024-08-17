export type EventListener<E extends Event> =
  | { (evt: E): void }
  | { handleEvent(evt: E): void }

