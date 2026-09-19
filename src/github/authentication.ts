import { config } from "../config/config.js";
import { storage } from "../storage/storage.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { getBrowser, DSAError } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import { getAuthenticatedUser } from "./github.js";

/**
 * Initiates the GitHub OAuth flow.
 */
export async function beginOAuth(): Promise<void> {
  const { clientId, authorizationUrl, redirectUrl, scopes } = config.github;
  const scopeStr = scopes.join("%20");
  const url = `${authorizationUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${scopeStr}`;

  await storage.set({ [STORAGE_KEYS.PIPE]: true });
  const api = getBrowser();
  api.tabs.create({ url, active: true });
}

/**
 * Parses access code from GitHub redirect URL.
 */
export function parseAccessCode(url: string): string | null {
  const match = url.match(/[?&]code=([\w/-]+)/);
  return match ? match[1] : null;
}

/**
 * Requests GitHub OAuth access token using code.
 */
export async function requestAccessToken(code: string): Promise<string> {
  const { clientId, clientSecret, accessTokenUrl } = config.github;
  const formData = new FormData();
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);
  formData.append("code", code);

  const response = await fetch(accessTokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new DSAError(`Failed to exchange token: ${response.status}`);
  }

  const data = await response.json();
  if (data.error || !data.access_token) {
    throw new DSAError(data.error_description || "No access token returned");
  }

  return data.access_token;
}

/**
 * Completes authentication flow: fetches user, sends message to background worker.
 */
export async function finishAuthentication(token: string): Promise<void> {
  const user = await getAuthenticatedUser(token);
  const api = getBrowser();
  api.runtime.sendMessage({
    closeWebPage: true,
    isSuccess: true,
    token,
    username: user.login,
  });
}

/**
 * Handles callback when injected on github.com.
 */
export async function handleOAuthCallback(): Promise<void> {
  if (typeof window === "undefined" || window.location.host !== "github.com") {
    return;
  }

  const { [STORAGE_KEYS.PIPE]: pipeOpen } = await storage.get<{ [key: string]: boolean }>([
    STORAGE_KEYS.PIPE,
  ]);
  if (!pipeOpen) {
    return;
  }

  const currentUrl = window.location.href;
  if (currentUrl.includes("error=")) {
    logger.error("OAuth authorization returned error");
    const api = getBrowser();
    api.runtime.sendMessage({
      closeWebPage: true,
      isSuccess: false,
    });
    return;
  }

  const code = parseAccessCode(currentUrl);
  if (code) {
    try {
      const token = await requestAccessToken(code);
      await finishAuthentication(token);
    } catch (err) {
      logger.error("Error completing OAuth callback:", err);
      const api = getBrowser();
      api.runtime.sendMessage({
        closeWebPage: true,
        isSuccess: false,
      });
    }
  }
}

// Auto-run when injected as a content script on github.com
if (typeof window !== "undefined" && window.location && window.location.host === "github.com") {
  handleOAuthCallback();
}
