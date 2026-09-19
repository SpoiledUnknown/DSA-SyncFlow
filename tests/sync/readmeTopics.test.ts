import { describe, it, expect } from "vitest";
import { appendProblemToReadme, sortTopicsInReadme } from "../../src/sync/sync.js";

describe("readmeTopics", () => {
  describe("appendProblemToReadme", () => {
    it("should correctly append to previous readme which has start and end tags", () => {
      const sampleText =
        "# LeetCode Topics\n### Extra Hard questions\nThese are notes I want for extra hard problems\n\n# About me\nThis a repo I had that I wished to do xyz with\n\n<!---LeetCode Topics Start-->\n# LeetCode Topics\n\n## Hash Table\n|  |\n| ------- |\n| [0020-fake-problem](https://github.com/any/tree/master/0020-fake-problem) |\n\n<!---LeetCode Topics End-->";
      const output = appendProblemToReadme(
        "Hash Table",
        sampleText,
        "any",
        "0013-roman-to-integer"
      );
      const expected =
        "# LeetCode Topics\n### Extra Hard questions\nThese are notes I want for extra hard problems\n\n# About me\nThis a repo I had that I wished to do xyz with\n\n<!---LeetCode Topics Start-->\n# LeetCode Topics\n\n## Hash Table\n|  |\n| ------- |\n| [0020-fake-problem](https://github.com/any/tree/master/0020-fake-problem) |\n| [0013-roman-to-integer](https://github.com/any/tree/master/0013-roman-to-integer) |\n\n\n\n<!---LeetCode Topics End-->";
      expect(output).toBe(expected);
    });

    it("should not append duplicate problem", () => {
      const sampleText =
        "<!---LeetCode Topics Start-->\n# LeetCode Topics\n\n## Hash Table\n|  |\n| ------- |\n| [0013-roman-to-integer](https://github.com/any/tree/master/0013-roman-to-integer) |\n\n<!---LeetCode Topics End-->";
      const output = appendProblemToReadme(
        "Hash Table",
        sampleText,
        "any",
        "0013-roman-to-integer"
      );
      expect(output).toBe(sampleText);
    });
  });

  describe("sortTopicsInReadme", () => {
    it("should correctly sort topics in readme numerically", () => {
      const sampleText =
        "<!---LeetCode Topics Start-->\n# LeetCode Topics\n## Hash Table\n|  |\n| ------- |\n| [0020-fake-problem](https://github.com/any/tree/master/0020-fake-problem) |\n| [0002-fake-problem](https://github.com/any/tree/master/0002-fake-problem) |\n<!---LeetCode Topics End-->";
      const output = sortTopicsInReadme(sampleText);
      expect(output).toContain("0002-fake-problem");
      const idx2 = output.indexOf("0002-fake-problem");
      const idx20 = output.indexOf("0020-fake-problem");
      expect(idx2).toBeLessThan(idx20);
    });
  });
});
