import { config } from "../config/config.js";
import { storage } from "../storage/storage.js";
import { STORAGE_KEYS, DEFAULT_REPO_README } from "../utils/constants.js";
import { DSAError } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import { syncStats } from "../sync/statistics.js";
import { GitHubRepoResponse, Stats } from "../types/index.js";

/**
 * Maps repository creation HTTP status code to error message.
 */
export function getCreateRepoErrorString(statusCode: number, name: string): string {
  const errorStrings: Record<number, string> = {
    304: `Error creating ${name} - Unable to modify repository. Try again later!`,
    400: `Error creating ${name} - Bad POST request, make sure you're not overriding existing scripts`,
    401: `Error creating ${name} - Unauthorized access to repo. Try again later!`,
    403: `Error creating ${name} - Forbidden access to repository. Try again later!`,
    422: `Error creating ${name} - Unprocessable Entity. Repository may have already been created. Try Linking instead (select 2nd option).`,
  };
  return errorStrings[statusCode] || `Error creating ${name} (Status code: ${statusCode}).`;
}

/**
 * Maps repository linking HTTP status code to error message.
 */
export function getLinkRepoErrorString(statusCode: number, name: string): string {
  const errorStrings: Record<number, string> = {
    301: `Error linking ${name} to DSA-SyncFlow. This repository has been moved permanently.`,
    403: `Error linking ${name} to DSA-SyncFlow. Forbidden action. Please make sure you have write access.`,
    404: `Error linking ${name} to DSA-SyncFlow. Resource not found. Make sure you entered the correct repository name.`,
  };
  return errorStrings[statusCode] || `Error linking ${name} (Status code: ${statusCode}).`;
}

/**
 * Creates a new private repository on GitHub.
 */
export async function createRepository(token: string, name: string): Promise<GitHubRepoResponse> {
  const url = `${config.github.apiBaseUrl}/user/repos`;
  const data = {
    name,
    private: true,
    auto_init: true,
    description: DEFAULT_REPO_README,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = getCreateRepoErrorString(response.status, name);
    const error = new DSAError(message);
    error.status = response.status;
    throw error;
  }

  const result = (await response.json()) as GitHubRepoResponse;
  await storage.set({
    [STORAGE_KEYS.MODE]: "commit",
    [STORAGE_KEYS.HOOK]: result.full_name,
  });
  await storage.remove(STORAGE_KEYS.STATS);

  logger.info(`Successfully created repository ${result.full_name}`);
  return result;
}

/**
 * Verifies existence and access to an existing repository on GitHub.
 */
export async function checkRepository(
  token: string,
  repoFullName: string
): Promise<GitHubRepoResponse> {
  const url = `${config.github.apiBaseUrl}/repos/${repoFullName}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const message = getLinkRepoErrorString(response.status, repoFullName);
    const error = new DSAError(message);
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as GitHubRepoResponse;
}

/**
 * Links an existing repository and syncs its stats.
 */
export async function linkRepository(
  token: string,
  repoFullName: string
): Promise<GitHubRepoResponse & { stats: Stats }> {
  const repoData = await checkRepository(token, repoFullName);

  await storage.set({
    [STORAGE_KEYS.MODE]: "commit",
    [STORAGE_KEYS.HOOK]: repoData.full_name,
    repo: repoData.html_url,
  });

  const stats = await syncStats(token, repoData.full_name);

  logger.info(`Successfully linked repository ${repoData.full_name}`);
  return {
    ...repoData,
    stats,
  };
}

/**
 * Unlinks current repository.
 */
export async function unlinkRepository(): Promise<void> {
  await storage.set({
    [STORAGE_KEYS.MODE]: "hook",
    [STORAGE_KEYS.HOOK]: null,
    [STORAGE_KEYS.SYNC_STATS]: true,
    [STORAGE_KEYS.STATS]: null,
  });
  logger.info("Unlinked repository and reset local stats");
}
