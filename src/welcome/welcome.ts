import { storage } from "../storage/storage.js";
import { STORAGE_KEYS } from "../utils/constants.js";
import { createRepository, linkRepository, unlinkRepository } from "../github/repository.js";
import { beginOAuth } from "../github/authentication.js";
import { Stats } from "../types/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  const pSolvedEl = document.getElementById("p_solved");
  const pSolvedEasyEl = document.getElementById("p_solved_easy");
  const pSolvedMediumEl = document.getElementById("p_solved_medium");
  const pSolvedHardEl = document.getElementById("p_solved_hard");

  const typeSelect = document.getElementById("type") as HTMLSelectElement | null;
  const nameInput = document.getElementById("name") as HTMLInputElement | null;
  const hookButton = document.getElementById("hook_button") as HTMLButtonElement | null;

  const errorEl = document.getElementById("error");
  const successEl = document.getElementById("success");
  const unlinkEl = document.getElementById("unlink");
  const unlinkAnchor = unlinkEl?.querySelector("a");

  function showError(msg: string): void {
    if (successEl) successEl.hidden = true;
    if (errorEl) {
      errorEl.innerHTML = msg;
      errorEl.hidden = false;
    }
  }

  function showSuccess(msg: string): void {
    if (errorEl) errorEl.hidden = true;
    if (successEl) {
      successEl.innerHTML = msg;
      successEl.hidden = false;
    }
  }

  function updateStatsDisplay(stats?: Stats | null): void {
    if (pSolvedEl) pSolvedEl.textContent = String(stats?.solved ?? 0);
    if (pSolvedEasyEl) pSolvedEasyEl.textContent = String(stats?.easy ?? 0);
    if (pSolvedMediumEl) pSolvedMediumEl.textContent = String(stats?.medium ?? 0);
    if (pSolvedHardEl) pSolvedHardEl.textContent = String(stats?.hard ?? 0);
  }

  const { [STORAGE_KEYS.STATS]: initialStats, [STORAGE_KEYS.HOOK]: currentHook } =
    await storage.get<{
      [STORAGE_KEYS.STATS]?: Stats;
      [STORAGE_KEYS.HOOK]?: string;
    }>([STORAGE_KEYS.STATS, STORAGE_KEYS.HOOK]);
  updateStatsDisplay(initialStats);

  if (currentHook && unlinkEl) {
    unlinkEl.hidden = false;
    showSuccess(
      `Currently linked to <a target="_blank" href="https://github.com/${currentHook}">${currentHook}</a>`
    );
  }

  typeSelect?.addEventListener("change", () => {
    if (hookButton) {
      hookButton.disabled = !typeSelect.value;
    }
  });

  hookButton?.addEventListener("click", async () => {
    const option = typeSelect?.value;
    const repoName = nameInput?.value.trim();

    if (!option) {
      showError("No option selected - Pick an option from the dropdown menu!");
      return;
    }

    if (!repoName) {
      showError("No repository name added - Enter the name of your repository!");
      nameInput?.focus();
      return;
    }

    showSuccess("Attempting to connect repository... Please wait.");

    const { [STORAGE_KEYS.TOKEN]: token, [STORAGE_KEYS.USERNAME]: username } = await storage.get<{
      [STORAGE_KEYS.TOKEN]?: string;
      [STORAGE_KEYS.USERNAME]?: string;
    }>([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USERNAME]);

    if (!token) {
      showError(
        'Authorization error - Please authorize DSA-SyncFlow with your GitHub account. <button id="auth_inline_btn" style="margin-top:8px; display:block; padding:4px 10px; background:var(--accent); color:#fff; border-radius:4px; cursor:pointer;">Authorize GitHub</button>'
      );
      document.getElementById("auth_inline_btn")?.addEventListener("click", () => {
        beginOAuth();
      });
      return;
    }

    try {
      if (option === "new") {
        const repo = await createRepository(token, repoName);
        showSuccess(
          `Successfully created <a target="_blank" href="${repo.html_url}">${repo.full_name}</a>. Happy LeetCoding!`
        );
      } else {
        const targetFullName = repoName.includes("/") ? repoName : `${username}/${repoName}`;
        const result = await linkRepository(token, targetFullName);
        showSuccess(
          `Successfully linked <a target="_blank" href="${result.html_url}">${result.full_name}</a> to DSA-SyncFlow.`
        );
        updateStatsDisplay(result.stats);
      }

      if (unlinkEl) unlinkEl.hidden = false;
    } catch (err: any) {
      showError(err.message || "Failed to set up repository.");
    }
  });

  unlinkAnchor?.addEventListener("click", async (e) => {
    e.preventDefault();
    await unlinkRepository();
    if (unlinkEl) unlinkEl.hidden = true;
    showSuccess("Successfully unlinked repository. Please create or link a new repository.");
    updateStatsDisplay(null);
  });
});
