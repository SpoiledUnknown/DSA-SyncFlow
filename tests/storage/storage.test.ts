import { describe, it, expect } from "vitest";
import { STORAGE_KEYS } from "../../src/utils/constants.js";
import { DSAError, LeetHubError } from "../../src/utils/helpers.js";

describe("storage and errors", () => {
  it("should provide consistent storage keys", () => {
    expect(STORAGE_KEYS.TOKEN).toBe("leethub_token");
    expect(STORAGE_KEYS.HOOK).toBe("leethub_hook");
    expect(STORAGE_KEYS.STATS).toBe("stats");
    expect(STORAGE_KEYS.MODE).toBe("mode_type");
  });

  it("should instantiate custom error with correct name", () => {
    const err = new DSAError("Test error");
    expect(err.name).toBe("DSAError");
    expect(err.message).toBe("Test error");
  });

  it("should preserve LeetHubError alias for backwards compatibility", () => {
    const err = new LeetHubError("Legacy test");
    expect(err instanceof DSAError).toBe(true);
  });
});
