export function pick<T extends object>(target: any, keys: readonly (keyof T)[]): Partial<T> {
  const source: Partial<T> = {}

  for (const key of keys) {
    if (key in target) {
      source[key] = target[key]
    }
  }

  return source
}
