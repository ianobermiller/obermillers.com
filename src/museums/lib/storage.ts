import type { SearchFilters } from "../types/museum";

const STORAGE_KEY = "museum-finder-search-filters";

export function saveFilters(filters: SearchFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save filters:", error);
  }
}

export function loadFilters(): SearchFilters | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored) as SearchFilters;
    }
  } catch (error) {
    console.error("Failed to load filters:", error);
  }
  return null;
}

export function getDefaultFilters(): SearchFilters {
  return { citySearchRadius: 50 };
}
