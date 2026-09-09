import { useSyncExternalStore } from "react";

let selectedCategoryID: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function useSelectedCategoryID() {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => selectedCategoryID,
  );
}

export function setSelectedCategoryID(id: string | null) {
  selectedCategoryID = id;
  emit();
}

export function getSelectedCategoryID() {
  return selectedCategoryID;
}
