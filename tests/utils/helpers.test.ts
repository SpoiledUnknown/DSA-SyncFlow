import { describe, it, expect } from "vitest";
import {
  convertToSlug,
  addLeadingZeros,
  getDifficulty,
  formatStats,
  encode,
  decode,
  isEmptyObject,
} from "../../src/utils/helpers.js";

describe("helpers", () => {
  describe("convertToSlug", () => {
    it("should convert problem names to valid kebab-case slugs", () => {
      expect(convertToSlug("Two Sum")).toBe("two-sum");
      expect(convertToSlug("Add Two Numbers")).toBe("add-two-numbers");
      expect(convertToSlug("Longest Substring Without Repeating Characters")).toBe(
        "longest-substring-without-repeating-characters"
      );
    });

    it("should replace special characters and accents", () => {
      expect(convertToSlug("Café & Restaurant")).toBe("cafe-and-restaurant");
      expect(convertToSlug("foo---bar")).toBe("foo-bar");
    });
  });

  describe("addLeadingZeros", () => {
    it("should pad single and multiple digit problem numbers to 4 digits", () => {
      expect(addLeadingZeros("1-two-sum")).toBe("0001-two-sum");
      expect(addLeadingZeros("21-merge-two-sorted-lists")).toBe("0021-merge-two-sorted-lists");
      expect(addLeadingZeros("300-longest-increasing-subsequence")).toBe(
        "0300-longest-increasing-subsequence"
      );
      expect(addLeadingZeros("1234-some-problem")).toBe("1234-some-problem");
    });
  });

  describe("getDifficulty", () => {
    it("should return PascalCase difficulty", () => {
      expect(getDifficulty("easy")).toBe("Easy");
      expect(getDifficulty("MEDIUM")).toBe("Medium");
      expect(getDifficulty("hard")).toBe("Hard");
      expect(getDifficulty("invalid")).toBe("Unknown");
      expect(getDifficulty(null)).toBe("Unknown");
    });
  });

  describe("formatStats", () => {
    it("should format stats string correctly", () => {
      const stats = formatStats("45 ms", "89.5", "16.4 MB", "75.2");
      expect(stats).toBe("Time: 45 ms (89.5%), Space: 16.4 MB (75.2%) - DSA-SyncFlow");
    });
  });

  describe("encode and decode", () => {
    it("should correctly encode and decode unicode text in base64", () => {
      const original = "Hello World! 🚀 Café München π ≠ 42";
      const encoded = encode(original);
      const decoded = decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe("isEmptyObject", () => {
    it("should return true for empty objects or non-objects", () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject(null)).toBe(true);
      expect(isEmptyObject(undefined)).toBe(true);
    });

    it("should return false for non-empty objects", () => {
      expect(isEmptyObject({ a: 1 })).toBe(false);
    });
  });
});
