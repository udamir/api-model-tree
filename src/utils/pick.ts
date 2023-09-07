export function pick(target: any, keys: readonly (string | number)[]) {
  const source: Record<string | number, unknown> = {}

  for (const key of keys) {
    if (key in target) {
      source[key] = target[key]
    }
  }

  return source
}
