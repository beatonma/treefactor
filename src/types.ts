export type StateUpdate<T> = (update: (prev: T) => T) => void;
