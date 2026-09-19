import { DIFFICULTY } from "./constants.js";
import { Difficulty } from "../types/index.js";

/**
 * Custom error class for DSA-SyncFlow.
 */
export class DSAError extends Error {
  status?: number;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DSAError";
  }
}

// Backwards compatibility alias
export const LeetHubError = DSAError;

/**
 * Checks if an object has no own enumerable properties.
 */
export function isEmptyObject(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return true;
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

/**
 * Asserts truthiness, throws DSAError otherwise.
 */
export function assert(truthy: unknown, msg: string): asserts truthy {
  if (!truthy) {
    throw new DSAError(msg);
  }
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  invokeBeforeTimeout = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!invokeBeforeTimeout) func(...args);
    };
    const callNow = invokeBeforeTimeout && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Delays the execution of a function by the specified time (in ms).
 */
export function delay<T>(func: (...args: any[]) => T, wait: number, ...args: any[]): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(func(...args)), wait));
}

/**
 * Retrieves the WebExtension browser API instance (chrome or browser).
 */
export function getBrowser(): typeof chrome {
  if (typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined") {
    return chrome;
  } else if (
    typeof (globalThis as any).browser !== "undefined" &&
    typeof (globalThis as any).browser.runtime !== "undefined"
  ) {
    return (globalThis as any).browser;
  } else {
    throw new DSAError("BrowserNotSupported");
  }
}

/**
 * Normalizes difficulty string to PascalCase ("Easy", "Medium", "Hard", "Unknown").
 */
export function getDifficulty(difficulty: string | null | undefined): Difficulty {
  if (!difficulty) return DIFFICULTY.UNKNOWN;
  const upper = difficulty.toUpperCase().trim();
  return DIFFICULTY[upper] ?? DIFFICULTY.UNKNOWN;
}

/**
 * Checks if an HTML collection or array exists and has elements.
 */
export function checkElem(elem: any): boolean {
  return Boolean(elem && elem.length > 0);
}

/**
 * Converts a string into a clean kebab-case URL/folder slug.
 */
export function convertToSlug(string: string): string {
  if (!string) return "";
  const a = "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b = "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Pads problem number prefix to 4 digits (e.g. 1-two-sum -> 0001-two-sum).
 */
export function addLeadingZeros(title: string): string {
  if (!title) return "";
  const maxTitlePrefixLength = 4;
  const parts = title.split("-");
  const len = parts[0].length;
  if (len < maxTitlePrefixLength && /^\d+$/.test(parts[0])) {
    return "0".repeat(maxTitlePrefixLength - len) + title;
  }
  return title;
}

/**
 * Formats runtime and memory statistics for commit message.
 */
export function formatStats(
  time: string | number,
  timePercentile: string | number,
  space: string | number,
  spacePercentile: string | number
): string {
  return `Time: ${time} (${timePercentile}%), Space: ${space} (${spacePercentile}%) - DSA-SyncFlow`;
}

/**
 * Encodes a string into UTF-8 safe base64.
 */
export function encode(data: string): string {
  return btoa(unescape(encodeURIComponent(data)));
}

/**
 * Decodes a base64 string into UTF-8.
 */
export function decode(data: string): string {
  return decodeURIComponent(escape(atob(data)));
}
