/** Returns `items` without any whose id appears in `exclude`, preserving order. */
export function excludeTools<T extends { id: string }>(items: T[], exclude: { id: string }[]): T[] {
  const ids = new Set(exclude.map((t) => t.id));
  return items.filter((t) => !ids.has(t.id));
}
