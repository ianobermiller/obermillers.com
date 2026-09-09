/**
 * Afternoon colour is only a split when it is a *different* place from the
 * morning. The same id on both halves is a whole day, not a travel day.
 */
export function effectiveHalfCategoryId(
  categoryId: string | null | undefined,
  halfCategoryId: string | null | undefined,
): string | undefined {
  if (halfCategoryId == null || halfCategoryId === "" || halfCategoryId === categoryId) {
    return undefined;
  }
  return halfCategoryId;
}

/** Stored form: empty half instead of repeating the morning place. */
export function collapsedHalfCategoryId(
  categoryId: string | null | undefined,
  halfCategoryId: string | null | undefined,
): string | null {
  return effectiveHalfCategoryId(categoryId, halfCategoryId) ?? null;
}
