const PREFIX = "[DSA-SyncFlow]";

export const logger = {
  info(...args: unknown[]): void {
    console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    console.error(PREFIX, ...args);
  },
  debug(...args: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(PREFIX, ...args);
    }
  },
};
