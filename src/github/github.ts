import { config } from "../config/config.js";
import { DSAError, delay } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import { GitHubFile, GitHubUser } from "../types/index.js";

/**
 * Constructs a normalized repository path.
 */
export function getRepoPath(directory: string, filename?: string): string {
  if (!directory && !filename) return "";
  if (!directory) return filename || "";
  if (!filename) return directory;
  return `${directory}/${filename}`;
}

/**
 * Fetches a file from GitHub contents API.
 */
export async function getGitHubFile(
  token: string,
  hook: string,
  path: string
): Promise<GitHubFile> {
  const url = `${config.github.apiBaseUrl}/repos/${hook}/contents/${path}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const error = new DSAError(`GitHub API Error: ${response.status}`, { cause: response });
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  return {
    sha: json.sha,
    content: json.content,
    json,
  };
}

/**
 * Uploads/updates file content on GitHub.
 */
export async function uploadFile(
  token: string,
  hook: string,
  content: string,
  path: string,
  sha: string,
  message: string
): Promise<string> {
  const url = `${config.github.apiBaseUrl}/repos/${hook}/contents/${path}`;
  const body: { message: string; content: string; sha?: string } = {
    message,
    content,
  };
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new DSAError(String(response.status), { cause: response });
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  logger.info(`Committed ${path} to ${hook}`);
  return data.content.sha;
}

/**
 * Uploads a file with automatic retry on 409 Conflict.
 */
export async function uploadWith409Retry(
  token: string,
  hook: string,
  content: string,
  path: string,
  sha: string,
  message: string
): Promise<string> {
  try {
    return await uploadFile(token, hook, content, path, sha, message);
  } catch (err: any) {
    if (err.status === 409 || err.message === "409") {
      logger.warn(`409 Conflict for ${path}, fetching latest SHA and retrying...`);
      await delay(() => {}, config.timing.githubConflictRetryDelayMs);
      const latest = await getGitHubFile(token, hook, path);
      return await uploadFile(token, hook, content, path, latest.sha, message);
    }
    throw err;
  }
}

/**
 * Fetches authenticated user info from GitHub.
 */
export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const url = `${config.github.apiBaseUrl}/user`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const error = new DSAError(`Auth error: ${response.status}`, { cause: response });
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as GitHubUser;
}
