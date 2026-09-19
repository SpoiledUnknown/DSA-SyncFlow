import { storage } from "../storage/storage.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { getBrowser } from "../utils/helpers.js";
import { Stats } from "../types/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  const api = getBrowser();

  const repoUrlEl = document.getElementById("repo_url");
  const pSolvedEl = document.getElementById("p_solved");
  const pSolvedEasyEl = document.getElementById("p_solved_easy");
  const pSolvedMediumEl = document.getElementById("p_solved_medium");
  const pSolvedHardEl = document.getElementById("p_solved_hard");

  const resetStatsBtn = document.getElementById("reset_stats");
  const resetConfirmationEl = document.getElementById("reset_confirmation");
  const resetYesBtn = document.getElementById("reset_yes");
  const resetNoBtn = document.getElementById("reset_no");

  const welcomeUrlEl = document.getElementById("welcome_URL") as HTMLAnchorElement | null;
  const featureUrlEl = document.getElementById("feature_URL") as HTMLAnchorElement | null;

  if (welcomeUrlEl) {
    welcomeUrlEl.href = api.runtime.getURL("src/welcome/welcome.html");
  }
  if (featureUrlEl) {
    featureUrlEl.href = "https://github.com/SpoiledUnknown/DSA-SyncFlow/issues";
  }

  const data = await storage.get<{
    [STORAGE_KEYS.STATS]?: Stats;
    [STORAGE_KEYS.HOOK]?: string;
    [STORAGE_KEYS.TOKEN]?: string;
  }>([STORAGE_KEYS.STATS, STORAGE_KEYS.HOOK, STORAGE_KEYS.TOKEN]);

  const stats = data[STORAGE_KEYS.STATS];
  const hook = data[STORAGE_KEYS.HOOK];
  const token = data[STORAGE_KEYS.TOKEN];

  if (pSolvedEl) pSolvedEl.textContent = String(stats?.solved ?? 0);
  if (pSolvedEasyEl) pSolvedEasyEl.textContent = String(stats?.easy ?? 0);
  if (pSolvedMediumEl) pSolvedMediumEl.textContent = String(stats?.medium ?? 0);
  if (pSolvedHardEl) pSolvedHardEl.textContent = String(stats?.hard ?? 0);

  if (repoUrlEl) {
    if (hook) {
      repoUrlEl.innerHTML = `<a target="_blank" rel="noopener noreferrer" style="color: var(--accent); font-size: 0.85em;" href="https://github.com/${hook}">${hook}</a>`;
    } else if (!token) {
      repoUrlEl.innerHTML = `<a target="_blank" rel="noopener noreferrer" style="color: var(--accent);" href="${api.runtime.getURL("src/welcome/welcome.html")}">Click to Authenticate</a>`;
    } else {
      repoUrlEl.innerHTML = `<a target="_blank" rel="noopener noreferrer" style="color: var(--accent);" href="${api.runtime.getURL("src/welcome/welcome.html")}">Set up Repository</a>`;
    }
  }

  if (resetStatsBtn && resetConfirmationEl) {
    resetStatsBtn.addEventListener("click", () => {
      resetConfirmationEl.hidden = false;
    });

    resetYesBtn?.addEventListener("click", async () => {
      await storage.set({ [STORAGE_KEYS.STATS]: null });
      if (pSolvedEl) pSolvedEl.textContent = "0";
      if (pSolvedEasyEl) pSolvedEasyEl.textContent = "0";
      if (pSolvedMediumEl) pSolvedMediumEl.textContent = "0";
      if (pSolvedHardEl) pSolvedHardEl.textContent = "0";
      resetConfirmationEl.hidden = true;
    });

    resetNoBtn?.addEventListener("click", () => {
      resetConfirmationEl.hidden = true;
    });
  }
});
