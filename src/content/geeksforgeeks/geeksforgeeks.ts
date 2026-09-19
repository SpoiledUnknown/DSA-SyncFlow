import { GFG_LANGUAGES } from "../../utils/constants.js";
import { logger } from "../../utils/logger.js";
import { syncGFGSubmission } from "../../sync/sync.js";

function findGfgLanguage(): string | null {
  const ele = document.getElementsByClassName("divider text")[0] as HTMLElement | null;
  if (!ele) return null;
  const lang = ele.innerText.split("(")[0].trim();
  return GFG_LANGUAGES[lang] || null;
}

function findTitle(): string {
  const ele = document.querySelector(
    '[class^="problems_header_content__title"] > h3'
  ) as HTMLElement | null;
  return ele ? ele.innerText.trim() : "";
}

function findDifficulty(): string {
  const eleList = document.querySelectorAll('[class^="problems_header_description"]');
  const ele = eleList[0]?.children[0] as HTMLElement | null;
  if (!ele) return "Easy";
  const trimmed = ele.innerText.trim();
  if (trimmed === "Basic" || trimmed === "School") {
    return "Easy";
  }
  return trimmed;
}

function getProblemStatement(): string {
  const ele = document.querySelector('[class^="problems_problem_content"]');
  return ele ? ele.outerHTML : "";
}

function getEditorCode(): string {
  try {
    const scriptContent = `
      (function() {
        var editor = window.ace ? window.ace.edit("ace-editor") : null;
        var code = editor ? editor.getValue() : "";
        var elem = document.createElement("div");
        elem.id = "dsa_gfg_code_container";
        elem.style.display = "none";
        elem.innerText = code;
        document.body.appendChild(elem);
      })();
    `;
    const script = document.createElement("script");
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    const container = document.getElementById("dsa_gfg_code_container");
    const code = container ? container.innerText : "";
    if (container) {
      container.remove();
    }
    script.remove();
    return code;
  } catch (err) {
    logger.error("Failed to extract code from Ace editor:", err);
    return "";
  }
}

let isMonitoring = true;

setInterval(() => {
  if (!window.location.href.includes("practice.geeksforgeeks.org/problems")) {
    return;
  }

  const submitBtn = document
    .evaluate(".//button[text()='Submit']", document.body, null, XPathResult.ANY_TYPE, null)
    ?.iterateNext() as HTMLElement | null;

  if (!submitBtn || submitBtn.dataset.dsaAttached) return;

  submitBtn.dataset.dsaAttached = "true";
  submitBtn.addEventListener("click", () => {
    isMonitoring = true;
    const checkSubmission = setInterval(async () => {
      const outputList = document.querySelectorAll('[class^="problems_content"]');
      const output = (outputList[0] as HTMLElement | null)?.innerText || "";

      if (output.includes("Problem Solved Successfully") && isMonitoring) {
        isMonitoring = false;
        clearInterval(checkSubmission);

        const title = findTitle();
        const difficulty = findDifficulty();
        const rawStatement = getProblemStatement();
        const code = getEditorCode();
        const languageExt = findGfgLanguage() || ".txt";

        const problemStatement = `# ${title}\n## ${difficulty}\n\n${rawStatement}`;

        try {
          await syncGFGSubmission({
            title,
            difficulty,
            problemStatement,
            code,
            languageExt,
          });
          logger.info(`GFG problem "${title}" synced successfully!`);
        } catch (err) {
          logger.error("Error syncing GFG submission:", err);
        }
      } else if (output.includes("Compilation Error")) {
        clearInterval(checkSubmission);
      }
    }, 1000);
  });
}, 1000);

logger.info("DSA-SyncFlow GeeksforGeeks content script initialized.");
