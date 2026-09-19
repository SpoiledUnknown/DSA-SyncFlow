import { Difficulty } from "../types/index.js";

/**
 * Supported programming languages on LeetCode mapped to file extensions.
 */
export const LANGUAGES: Readonly<Record<string, string>> = Object.freeze({
  C: ".c",
  "C++": ".cpp",
  "C#": ".cs",
  Dart: ".dart",
  Elixir: ".ex",
  Erlang: ".erl",
  Go: ".go",
  Java: ".java",
  JavaScript: ".js",
  Javascript: ".js",
  Kotlin: ".kt",
  MySQL: ".sql",
  "MS SQL Server": ".sql",
  Oracle: ".sql",
  Pandas: ".py",
  PHP: ".php",
  Python: ".py",
  Python3: ".py",
  Racket: ".rkt",
  Ruby: ".rb",
  Rust: ".rs",
  Scala: ".scala",
  Swift: ".swift",
  TypeScript: ".ts",
  Bash: ".sh",
});

/**
 * Supported programming languages on GeeksForGeeks mapped to file extensions.
 */
export const GFG_LANGUAGES: Readonly<Record<string, string>> = Object.freeze({
  C: ".c",
  "C++": ".cpp",
  Java: ".java",
  Python: ".py",
  Python3: ".py",
  Javascript: ".js",
  JavaScript: ".js",
  "C#": ".cs",
});

/**
 * Problem difficulty levels.
 */
export const DIFFICULTY: Readonly<Record<string, Difficulty>> = Object.freeze({
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  UNKNOWN: "Unknown",
});

/**
 * Standard commit messages.
 */
export const COMMIT_MESSAGES = Object.freeze({
  README: "Create README - DSA-SyncFlow",
  UPDATE_README: "Update README - Topic Tags",
  UPDATE_STATS: "Updated stats",
  DISCUSSION: "Prepend discussion post - DSA-SyncFlow",
  NOTES: "Attach NOTES - DSA-SyncFlow",
  GFG_SUBMIT: "Added solution - DSA-SyncFlow",
  GFG_UPDATE: "Updated solution - DSA-SyncFlow",
});

/**
 * Common filenames.
 */
export const FILENAMES = Object.freeze({
  README: "README.md",
  STATS: "stats.json",
  NOTES: "NOTES.md",
});

/**
 * Default README template for newly created/initialized repositories.
 */
export const DEFAULT_REPO_README =
  "A collection of LeetCode & GeeksforGeeks questions to ace the coding interview! - Created using [DSA-SyncFlow](https://github.com/SpoiledUnknown/DSA-SyncFlow)";

/**
 * Storage keys used in chrome.storage.local / chrome.storage.sync.
 */
export const STORAGE_KEYS = Object.freeze({
  TOKEN: "leethub_token",
  USERNAME: "leethub_username",
  HOOK: "leethub_hook",
  MODE: "mode_type",
  STATS: "stats",
  SYNC_STATS: "sync_stats",
  PIPE: "pipe_leethub",
  IS_SYNC: "isSync",
});

export const LEETCODE_TOPIC_DELIMITERS = Object.freeze({
  START: "<!---LeetCode Topics Start-->",
  HEADER: "# LeetCode Topics",
  END: "<!---LeetCode Topics End-->",
});
