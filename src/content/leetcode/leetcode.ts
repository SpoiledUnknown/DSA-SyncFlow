import { getBrowser, debounce } from "../../utils/helpers.js";
import { logger } from "../../utils/logger.js";
import { storage } from "../../storage/storage.js";
import { STORAGE_KEYS } from "../../utils/constants.js";
import { fetchLeetCodeSubmissionDetails } from "../../sync/submission.js";
import { syncLeetCodeSubmission } from "../../sync/sync.js";
import { config } from "../../config/config.js";

const SPINNER_ID = "dsa_syncflow_spinner";
const SPINNER_CLASS = "dsa_syncflow_spinner_elem";

function injectSpinnerStyle(): void {
  if (document.getElementById("dsa_syncflow_style")) return;
  const style = document.createElement("style");
  style.id = "dsa_syncflow_style";
  style.textContent = `
    .${SPINNER_CLASS} {
      pointer-events: none;
      width: 1.8em;
      height: 1.8em;
      border: 0.3em solid transparent;
      border-color: #eee;
      border-top-color: #ff6c0a;
      border-radius: 50%;
      animation: dsa_spin 1s linear infinite;
    }
    @keyframes dsa_spin {
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function startSpinner(): void {
  let elem = document.getElementById(SPINNER_ID);
  if (!elem) {
    elem = document.createElement("span");
    elem.id = SPINNER_ID;
    elem.style.cssText = "margin-right: 15px; display: inline-flex; align-items: center;";
  }
  elem.innerHTML = `<div class="${SPINNER_CLASS}"></div>`;

  const target =
    document.querySelector('[data-e2e-locator="submission-result"]')?.parentElement ||
    document.querySelector(".action__38Xc");

  if (target) {
    target.appendChild(elem);
  }
}

function markUploaded(): void {
  const elem = document.getElementById(SPINNER_ID);
  if (elem) {
    elem.innerHTML = `
      <span style="display: inline-block; transform: rotate(45deg); height: 18px; width: 9px; border-bottom: 4px solid #5cb85c; border-right: 4px solid #5cb85c;"></span>
    `;
  }
}

function markUploadFailed(): void {
  const elem = document.getElementById(SPINNER_ID);
  if (elem) {
    elem.innerHTML = `
      <span style="color: #e05252; font-weight: bold; font-size: 16px;">✕</span>
    `;
  }
}

function isSubmissionSuccessful(): boolean {
  const v2Result = document.querySelector(
    '[data-e2e-locator="submission-result"]'
  ) as HTMLElement | null;
  if (v2Result && v2Result.innerText.includes("Accepted")) {
    return true;
  }

  const v1Success = document.querySelector(".success__3Ai7") as HTMLElement | null;
  if (v1Success && v1Success.innerText.trim() === "Success") {
    return true;
  }

  const exploreSuccess = document.getElementById("result-state");
  if (exploreSuccess && exploreSuccess.innerText === "Accepted") {
    return true;
  }

  return false;
}

async function listenForSubmissionId(): Promise<string | undefined> {
  const api = getBrowser();
  const response = await api.runtime.sendMessage({
    type: "LEETCODE_SUBMISSION",
  });
  return response?.submissionId;
}

async function handleSubmissionSync(submissionId: string | number): Promise<void> {
  let attempts = 0;
  injectSpinnerStyle();

  const interval = setInterval(async () => {
    try {
      if (!isSubmissionSuccessful()) {
        attempts++;
        if (attempts > config.timing.submissionPollingMaxAttempts) {
          clearInterval(interval);
          logger.warn("Submission was not successful or timed out waiting for Accepted status.");
        }
        return;
      }

      clearInterval(interval);
      startSpinner();

      logger.info(`Fetching details for submission ID: ${submissionId}`);
      const submissionData = await fetchLeetCodeSubmissionDetails(submissionId);
      await syncLeetCodeSubmission(submissionData);

      markUploaded();
      logger.info("Successfully synced LeetCode solution!");
    } catch (err) {
      clearInterval(interval);
      markUploadFailed();
      logger.error("Failed to sync LeetCode submission:", err);
    }
  }, config.timing.submissionPollingIntervalMs);
}

function setupKeyboardAndClickListeners(): void {
  const submitBtn = document.querySelector(
    '[data-e2e-locator="console-submit-button"]'
  ) as HTMLElement | null;
  const textareaList = document.getElementsByTagName("textarea");
  const textarea = textareaList.length > 0 ? textareaList[textareaList.length - 1] : null;

  async function triggerSubmit(event: Event | KeyboardEvent) {
    const isEnter = "key" in event && event.key === "Enter";
    const isMac = navigator.userAgent.includes("Mac");
    const isShortcut =
      isEnter && (isMac ? (event as KeyboardEvent).metaKey : (event as KeyboardEvent).ctrlKey);

    if (event.type === "click" || isShortcut) {
      const { [STORAGE_KEYS.TOKEN]: token, [STORAGE_KEYS.HOOK]: hook } = await storage.get<{
        [key: string]: string;
      }>([STORAGE_KEYS.TOKEN, STORAGE_KEYS.HOOK]);

      if (!token || !hook) {
        logger.warn("DSA-SyncFlow not authenticated or repo not linked.");
        return;
      }

      const submissionId = await listenForSubmissionId();
      if (submissionId) {
        handleSubmissionSync(submissionId);
      }
    }
  }

  if (submitBtn && !submitBtn.dataset.dsaAttached) {
    submitBtn.dataset.dsaAttached = "true";
    submitBtn.addEventListener("click", triggerSubmit);
  }

  if (textarea && !textarea.dataset.dsaAttached) {
    textarea.dataset.dsaAttached = "true";
    textarea.addEventListener("keydown", triggerSubmit);
  }
}

function addManualSubmitButton(): void {
  const container = document.querySelector(
    ".flex.flex-none.gap-2:not(.justify-center):not(.justify-between)"
  );
  if (!container || container.querySelector("#dsa-manual-sync-btn")) return;

  const btn = document.createElement("button");
  btn.id = "dsa-manual-sync-btn";
  btn.innerText = "Sync w/ DSA-SyncFlow";
  btn.className =
    "group whitespace-nowrap focus:outline-none text-white bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium";
  btn.style.cssText = "background-color: #ff6c0a; color: #fff; cursor: pointer;";

  btn.addEventListener(
    "click",
    debounce(
      async () => {
        const match = window.location.href.match(/leetcode\.com\/.*\/submissions\/(\d+)/);
        if (match && match[1]) {
          handleSubmissionSync(match[1]);
        } else {
          logger.warn("No submission ID found in URL for manual sync.");
        }
      },
      config.timing.manualSubmitDebounceMs,
      true
    )
  );

  container.appendChild(btn);
}

const observer = new MutationObserver(() => {
  setupKeyboardAndClickListeners();

  if (window.location.href.includes("/submissions/")) {
    addManualSubmitButton();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

logger.info("DSA-SyncFlow LeetCode content script initialized.");
