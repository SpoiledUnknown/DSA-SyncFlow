import { describe, it, expect } from "vitest";
import { mergeStats, countDifficulties } from "../../src/sync/statistics.js";

describe("statistics", () => {
  describe("mergeStats", () => {
    it("should correctly merge stats from two objects", () => {
      const obj1 = {
        easy: 1,
        hard: 0,
        medium: 1,
        shas: {
          "0003-longest-substring-without-repeating-characters": {
            "0003-longest-substring-without-repeating-characters.js":
              "2f4a1eba5c5c7cb86e115f10252c5afb3d1bf528",
            "README.md": "23fe8b26580352e70c75f4236710f6846864a455",
            difficulty: "medium",
          },
          "0021-merge-two-sorted-lists": {
            "0021-merge-two-sorted-lists.js": "f393d2c3b716a7f7196af020cd7c8f7e8c994759",
            "README.md": "859aec2842f4b0ee5bcbc96fb86ed1988c287b12",
            difficulty: "easy",
          },
        },
        solved: 2,
      };

      const obj2 = {
        easy: 1,
        hard: 1,
        medium: 0,
        shas: {
          "0021-merge-two-sorted-lists": {
            "0021-merge-two-sorted-lists.js": "a393d2c3b716a7f7196af020cd7c8f7e8c994759",
            "README.md": "959aec2842f4b0ee5bcbc96fb86ed1988c287b12",
            difficulty: "easy",
          },
          "0022-generate-parentheses": {
            "0022-generate-parentheses.js": "4e4a1eba5c5c7cb86e115f10252c5afb3d1bf529",
            "README.md": "33fe8b26580352e70c75f4236710f6846864a456",
            difficulty: "hard",
          },
          "0024-sample": {
            "0022-generate-parentheses.js": "4e4a1eba5c5c7cb86e115f10252c5afb3d1bf529",
            "README.md": "33fe8b26580352e70c75f4236710f6846864a456",
            difficulty: "hard",
          },
        },
        solved: 3,
      };

      const result = mergeStats(obj1, obj2);
      expect(result.easy).toBe(1);
      expect(result.medium).toBe(1);
      expect(result.hard).toBe(2);
      expect(result.solved).toBe(4);
      expect(result.shas["0003-longest-substring-without-repeating-characters"]).toBeDefined();
      expect(result.shas["0021-merge-two-sorted-lists"]).toBeDefined();
      expect(result.shas["0022-generate-parentheses"]).toBeDefined();
      expect(result.shas["0024-sample"]).toBeDefined();
    });

    it("should work when one object has empty stats", () => {
      const obj1 = {
        easy: 1,
        hard: 0,
        medium: 1,
        shas: {
          "0003-longest-substring": { difficulty: "medium" },
        },
        solved: 1,
      };
      const obj2 = { shas: {} };

      const result = mergeStats(obj1, obj2);
      expect(result.solved).toBe(1);
      expect(result.medium).toBe(1);
      expect(result.easy).toBe(0);
    });

    it("should handle empty objects cleanly", () => {
      const result = mergeStats({}, {});
      expect(result).toEqual({
        easy: 0,
        medium: 0,
        hard: 0,
        solved: 0,
        shas: {},
      });
    });

    it("should correctly count difficulties from duplicate shas", () => {
      const obj1 = {
        shas: {
          sha1: { difficulty: "easy" },
          sha2: { difficulty: "medium" },
        },
      };
      const obj2 = {
        shas: {
          sha1: { difficulty: "easy" },
          sha4: { difficulty: "easy" },
        },
      };

      const result = mergeStats(obj1, obj2);
      expect(result.easy).toBe(2);
      expect(result.medium).toBe(1);
      expect(result.hard).toBe(0);
      expect(result.solved).toBe(3);
    });
  });

  describe("countDifficulties", () => {
    it("should count correct difficulty breakdown", () => {
      const shas = {
        p1: { difficulty: "easy" },
        p2: { difficulty: "medium" },
        p3: { difficulty: "hard" },
        p4: { difficulty: "easy" },
      };
      const counts = countDifficulties(shas);
      expect(counts).toEqual({
        easy: 2,
        medium: 1,
        hard: 1,
        solved: 4,
      });
    });
  });
});
