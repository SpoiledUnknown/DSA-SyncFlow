import { getBrowser } from "../utils/helpers.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { logger } from "../utils/logger.js";

/**
 * Promise-based storage helper for WebExtensions.
 */
export const storage = {
  /**
   * Gets item(s) from chrome.storage.local.
   */
  async get<T = Record<string, any>>(keys: string | string[] | Record<string, any>): Promise<T> {
    const api = getBrowser();
    return new Promise((resolve) => {
      api.storage.local.get(keys, (result) => {
        resolve((result || {}) as T);
      });
    });
  },

  /**
   * Sets item(s) into chrome.storage.local.
   */
  async set(items: Record<string, any>): Promise<void> {
    const api = getBrowser();
    return new Promise((resolve) => {
      api.storage.local.set(items, () => {
        resolve();
      });
    });
  },

  /**
   * Removes key(s) from chrome.storage.local.
   */
  async remove(keys: string | string[]): Promise<void> {
    const api = getBrowser();
    return new Promise((resolve) => {
      api.storage.local.remove(keys, () => {
        resolve();
      });
    });
  },

  /**
   * Clears all items in chrome.storage.local.
   */
  async clear(): Promise<void> {
    const api = getBrowser();
    return new Promise((resolve) => {
      api.storage.local.clear(() => {
        resolve();
      });
    });
  },

  /**
   * Migrates/synchronizes chrome.storage.sync into chrome.storage.local if needed.
   */
  async syncLocalWithSync(): Promise<void> {
    const api = getBrowser();
    const { [STORAGE_KEYS.IS_SYNC]: isSync } = await this.get<{ [key: string]: boolean }>([
      STORAGE_KEYS.IS_SYNC,
    ]);
    if (!isSync && api.storage.sync) {
      const keys = [
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USERNAME,
        STORAGE_KEYS.PIPE,
        STORAGE_KEYS.STATS,
        STORAGE_KEYS.HOOK,
        STORAGE_KEYS.MODE,
      ];
      await new Promise<void>((resolve) => {
        api.storage.sync.get(keys, async (data) => {
          if (data) {
            await this.set(data);
          }
          await this.set({ [STORAGE_KEYS.IS_SYNC]: true });
          logger.info("Local storage synced with sync storage");
          resolve();
        });
      });
    }
  },
};
