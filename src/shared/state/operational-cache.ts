type OperationalInvalidationListener = (queryKey: readonly unknown[]) => void;

const listeners = new Set<OperationalInvalidationListener>();

export function subscribeOperationalInvalidation(listener: OperationalInvalidationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function invalidateOperationalQueries(queryKey: readonly unknown[]) {
  for (const listener of listeners) {
    listener(queryKey);
  }
}

export function queryKeyMatches(prefix: readonly unknown[], queryKey: readonly unknown[]) {
  if (prefix.length > queryKey.length) {
    return false;
  }

  return prefix.every((segment, index) => queryKey[index] === segment);
}
