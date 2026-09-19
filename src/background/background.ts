import { getBrowser } from "../utils/helpers.js";
import { storage } from "../storage/storage.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { logger } from "../utils/logger.js";

const api = getBrowser();

api.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await storage.set({ [STORAGE_KEYS.SYNC_STATS]: true });
    logger.info("DSA-SyncFlow installed successfully. Stats sync enabled.");
  }
  await storage.syncLocalWithSync();
});

api.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request) return;

  if (request.closeWebPage === true && request.isSuccess === true) {
    (async () => {
      await storage.set({
        [STORAGE_KEYS.USERNAME]: request.username,
        [STORAGE_KEYS.TOKEN]: request.token,
        [STORAGE_KEYS.PIPE]: false,
      });

      api.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          api.tabs.remove(tabs[0].id);
        }
      });

      const welcomeUrl = api.runtime.getURL("src/welcome/welcome.html");
      api.tabs.create({ url: welcomeUrl, active: true });
    })();
    return true;
  }

  if (request.closeWebPage === true && request.isSuccess === false) {
    logger.error("Authentication failed during OAuth flow.");
    api.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        api.tabs.remove(tabs[0].id);
      }
    });
    return true;
  }

  if (request.type === "LEETCODE_SUBMISSION") {
    const listener = function (
      details: chrome.webNavigation.WebNavigationTransitionCallbackDetails
    ) {
      const match = details.url.match(/\/submissions\/(\d+)\//);
      if (match && match[1]) {
        sendResponse({ submissionId: match[1] });
        api.webNavigation.onHistoryStateUpdated.removeListener(listener);
      }
    };

    api.webNavigation.onHistoryStateUpdated.addListener(listener, {
      url: [{ hostSuffix: "leetcode.com" }, { pathContains: "submissions" }],
    });
    return true;
  }

  return true;
});

logger.info("DSA-SyncFlow background service worker active.");
