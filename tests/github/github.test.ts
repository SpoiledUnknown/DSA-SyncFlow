import { describe, it, expect } from "vitest";
import { getRepoPath } from "../../src/github/github.js";
import { getCreateRepoErrorString, getLinkRepoErrorString } from "../../src/github/repository.js";

describe("github", () => {
  describe("getRepoPath", () => {
    it("should construct correct repo path", () => {
      expect(getRepoPath("0001-two-sum", "README.md")).toBe("0001-two-sum/README.md");
      expect(getRepoPath("0001-two-sum", "0001-two-sum.py")).toBe("0001-two-sum/0001-two-sum.py");
      expect(getRepoPath("", "README.md")).toBe("README.md");
      expect(getRepoPath("README.md", "")).toBe("README.md");
    });
  });

  describe("error message formatters", () => {
    it("should return human readable error for 422 Unprocessable Entity", () => {
      const msg = getCreateRepoErrorString(422, "my-repo");
      expect(msg).toContain("Repository may have already been created");
    });

    it("should return human readable error for 404 Not Found", () => {
      const msg = getLinkRepoErrorString(404, "my-repo");
      expect(msg).toContain("Resource not found");
    });
  });
});
