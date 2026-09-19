import { storage } from "../storage/storage.js";
import { STORAGE_KEYS, DIFFICULTY, FILENAMES, COMMIT_MESSAGES } from "../utils/constants.js";
import { getDifficulty, isEmptyObject, encode, decode, delay } from "../utils/helpers.js";
import { getGitHubFile, uploadWith409Retry } from "../github/github.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/config.js";
import { Stats, ProblemShas } from "../types/index.js";

function isObject(obj: unknown): obj is Record<string, any> {
  return Boolean(obj && typeof obj === "object" && !Array.isArray(obj));
}

export function mergeDeep(target: Record<string, any>, source: Record<string, any>): void {
  for (const key in source) {
    if (isObject(source[key])) {
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      mergeDeep(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
}

export function countDifficulties(shas: Record<string, ProblemShas>): {
  easy: number;
  medium: number;
  hard: number;
  solved: number;
} {
  const difficulties = { easy: 0, medium: 0, hard: 0, solved: 0 };
  for (const problem in shas) {
    if (shas[problem] && "difficulty" in shas[problem]) {
      const difficulty = shas[problem].difficulty?.toLowerCase() as keyof typeof difficulties;
      if (difficulty in difficulties && difficulty !== "solved") {
        difficulties[difficulty]++;
      }
    }
  }
  difficulties.solved = difficulties.easy + difficulties.medium + difficulties.hard;
  return difficulties;
}

/**
 * Merges two stats objects and recalculates total counts.
 */
export function mergeStats(obj1: Partial<Stats> = {}, obj2: Partial<Stats> = {}): Stats {
  const merged: Record<string, any> = {};
  mergeDeep(merged, obj1 as Record<string, any>);
  mergeDeep(merged, obj2 as Record<string, any>);

  const shas = (merged.shas || {}) as Record<string, ProblemShas>;
  const diffs = countDifficulties(shas);

  return {
    easy: diffs.easy,
    medium: diffs.medium,
    hard: diffs.hard,
    solved: diffs.solved,
    shas,
  };
}

/**
 * Retrieves existing local stats or initializes with default schema.
 */
export async function getAndInitializeStats(problem?: string): Promise<Stats> {
  const { [STORAGE_KEYS.STATS]: existingStats } = await storage.get<{ [key: string]: Stats }>([
    STORAGE_KEYS.STATS,
  ]);
  let stats = existingStats;

  if (!stats || isEmptyObject(stats)) {
    stats = {
      shas: {},
      solved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
    };
  }

  if (!stats.shas) {
    stats.shas = {};
  }

  if (problem && !stats.shas[problem]) {
    stats.shas[problem] = {};
  }

  return stats;
}

/**
 * Increments difficulty solved count and records problem difficulty.
 */
export async function incrementStats(difficulty: string, problem?: string): Promise<Stats> {
  const diff = getDifficulty(difficulty);
  const stats = await getAndInitializeStats(problem);

  stats.solved = (stats.solved || 0) + 1;
  stats.easy = (stats.easy || 0) + (diff === DIFFICULTY.EASY ? 1 : 0);
  stats.medium = (stats.medium || 0) + (diff === DIFFICULTY.MEDIUM ? 1 : 0);
  stats.hard = (stats.hard || 0) + (diff === DIFFICULTY.HARD ? 1 : 0);

  if (problem) {
    stats.shas[problem].difficulty = diff.toLowerCase();
  }

  await storage.set({ [STORAGE_KEYS.STATS]: stats });
  return stats;
}

/**
 * Synchronizes local stats with remote stats.json in the repository.
 */
export async function syncStats(token: string, hook: string): Promise<Stats> {
  const { [STORAGE_KEYS.SYNC_STATS]: shouldSync } = await storage.get<{ [key: string]: boolean }>([
    STORAGE_KEYS.SYNC_STATS,
  ]);
  if (shouldSync === false) {
    const { [STORAGE_KEYS.STATS]: currentStats } = await storage.get<{ [key: string]: Stats }>([
      STORAGE_KEYS.STATS,
    ]);
    return currentStats || { easy: 0, medium: 0, hard: 0, solved: 0, shas: {} };
  }

  try {
    const file = await getGitHubFile(token, hook, FILENAMES.STATS);
    const parsed = JSON.parse(decode(file.content));
    const remoteLeetcodeStats: Stats = parsed.leetcode || {
      easy: 0,
      medium: 0,
      hard: 0,
      solved: 0,
      shas: {},
    };

    await storage.set({
      [STORAGE_KEYS.STATS]: remoteLeetcodeStats,
      [STORAGE_KEYS.SYNC_STATS]: false,
    });
    logger.info("Successfully synced local stats with remote GitHub stats");
    return remoteLeetcodeStats;
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("404")) {
      await storage.set({ [STORAGE_KEYS.SYNC_STATS]: false });
      logger.info("No remote stats.json found, starting fresh");
      return { easy: 0, medium: 0, hard: 0, solved: 0, shas: {} };
    }
    logger.error("Failed to sync remote stats:", err);
    throw err;
  }
}

/**
 * Commits updated stats to remote GitHub repository with conflict handling.
 */
export async function setPersistentStats(
  localStats: Stats,
  token: string,
  hook: string
): Promise<string> {
  const pStats = { leetcode: localStats };
  const encoded = encode(JSON.stringify(pStats, null, 2));
  const sha = localStats?.shas?.[FILENAMES.STATS]?.[""] || "";

  try {
    return await uploadWith409Retry(
      token,
      hook,
      encoded,
      FILENAMES.STATS,
      sha,
      COMMIT_MESSAGES.UPDATE_STATS
    );
  } catch (err: any) {
    if (err.status === 409 || err.message === "409") {
      const file = await getGitHubFile(token, hook, FILENAMES.STATS);
      const remotePStats = JSON.parse(decode(file.content));
      const merged = mergeStats(remotePStats.leetcode || {}, localStats);
      const mergedEncoded = encode(JSON.stringify({ leetcode: merged }, null, 2));

      await storage.set({ [STORAGE_KEYS.STATS]: merged });
      await delay(() => {}, config.timing.githubConflictRetryDelayMs);

      return await uploadWith409Retry(
        token,
        hook,
        mergedEncoded,
        FILENAMES.STATS,
        file.sha,
        COMMIT_MESSAGES.UPDATE_STATS
      );
    }
    throw err;
  }
}
