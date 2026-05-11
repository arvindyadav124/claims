/** Count items by numeric `status`, sorted by status ascending. */
export function aggregateByStatus<T extends { status: number }>(
  items: T[],
  labelForStatus: (status: number) => string,
): { status: number; count: number; label: string }[] {
  const map = new Map<number, number>()
  for (const item of items) {
    map.set(item.status, (map.get(item.status) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([status, count]) => ({ status, count, label: labelForStatus(status) }))
}
