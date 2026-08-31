const WARNING_INTERVAL_MS = 60_000;

/**
 * Keeps the last successful database result in the current server instance.
 * The fallback is only returned when there is neither a valid Next.js cache
 * entry nor a previous successful read in this process.
 */
export const createResilientContentReader = <T>(
  label: string,
  fallback: () => T,
): ((read: () => Promise<T>) => Promise<T>) => {
  let lastKnownGood: T | undefined;
  let lastWarningAt = 0;

  return async (read: () => Promise<T>): Promise<T> => {
    try {
      const value = await read();
      lastKnownGood = value;
      return value;
    } catch (error) {
      const now = Date.now();

      if (now - lastWarningAt >= WARNING_INTERVAL_MS) {
        lastWarningAt = now;
        const message = error instanceof Error ? error.message : "Unknown database read error";
        console.error(
          `[${label}] MongoDB no está disponible; se conserva la última lectura válida. ${message}`,
        );
      }

      return lastKnownGood ?? fallback();
    }
  };
};
