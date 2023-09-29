import { useState } from "react";
import { Tree } from "src/tree";

type Serializer<T> = (obj: T) => string | undefined;
type Parser<T> = (repr: string) => T;
interface PersistenceTransforms<T> {
  serialize: Serializer<T>;
  parse: Parser<T>;
}

export enum PersistenceKey {
  InitialTree = "initial_tree",
  EditedTree = "edited_tree",
  Options = "options",
}

export const isSaved = (key: PersistenceKey): boolean =>
  window.localStorage.getItem(key) !== null;

export const removeSaved = (key: PersistenceKey) =>
  window.localStorage.removeItem(key);

export const usePersistentObject = <T extends object>(
  key: PersistenceKey,
  initialState: T,
) =>
  usePersistent<T>(key, initialState, {
    serialize: JSON.stringify,
    parse: it => JSON.parse(it) as T,
  });

export const usePersistentString = (
  key: PersistenceKey,
  initialState: string,
) =>
  usePersistent<string>(key, initialState, {
    serialize: it => it,
    parse: it => it,
  });

export const usePersistentTree = (key: PersistenceKey, initialState: Tree) =>
  usePersistent<Tree>(key, initialState, {
    serialize: tree => tree?.stringify(),
    parse: Tree.parse,
  });

const load = <T>(key: PersistenceKey, transform: Parser<T>): T | undefined => {
  const result = window.localStorage.getItem(key);
  if (result) {
    return transform(result);
  }
};

const save = (key: PersistenceKey, value: string | undefined) => {
  if (value) {
    window.localStorage.setItem(key, value);
  } else {
    window.localStorage.removeItem(key);
  }
};

const saveInitial = <T>(
  key: PersistenceKey,
  value: T,
  transform: Serializer<T>,
): T => {
  save(key, transform(value));
  return value;
};

const usePersistent = <T>(
  key: PersistenceKey,
  initialState: T,
  transforms: PersistenceTransforms<T>,
): [T, (value: ((prevState: T) => T) | T) => void] => {
  const [storedValue, setValue] = useState<T>(
    // Load a previous value, or save the initialState to storage.
    load(key, transforms.parse) ??
      saveInitial(key, initialState, transforms.serialize),
  );

  return [
    storedValue,
    newValue => {
      if (typeof newValue === "function") {
        const updateFunc = newValue as (prev: T) => T;
        setValue(prevState => {
          const updated = updateFunc(prevState);
          save(key, transforms.serialize(updated));
          return updated;
        });
      } else {
        setValue(newValue);
        save(key, transforms.serialize(newValue));
      }
    },
  ];
};
