import { useState } from "react";

export enum PersistenceKey {
  InitialTree = "initial_tree",
  EditedTree = "edited_tree",
  Options = "options",
}

export const save = (key: PersistenceKey, value: string | undefined) => {
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};

export const saveJsonObject = <T>(key: PersistenceKey, value: T) => {
  if (value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(key);
  }
};

export const load = <T>(
  key: PersistenceKey,
  transform: (raw: string) => T,
): T | undefined => {
  const result = window.localStorage.getItem(key);

  if (result) {
    return transform(result);
  }
};

export const loadString = (key: PersistenceKey): string | undefined =>
  window.localStorage.getItem(key) ?? undefined;

export const loadJsonObject = <T>(key: PersistenceKey): T | undefined => {
  return load(key, value => JSON.parse(value));
};

export const usePersistent = <T>(
  key: PersistenceKey,
  initialState: T,
): [T, (value: ((prevState: T) => T) | T) => void] => {
  const [storedValue, setValue] = useState<T>(
    loadJsonObject(key) ?? initialState,
  );

  return [
    storedValue,
    value => {
      if (typeof value === "function") {
        const transform = value as (prev: T) => T;
        setValue(prevState => {
          const transformed = transform(prevState);
          saveJsonObject(key, transformed);
          return transformed;
        });
      } else {
        saveJsonObject(key, value);
        setValue(value);
      }
    },
  ];
};
