/** "1 tool", "2 tools", "0 tools" — singular only for exactly one. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatToolCount(count: number): string {
  return pluralize(count, "tool");
}
