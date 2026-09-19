import { storage } from "../storage/storage.js";
import {
  STORAGE_KEYS,
  FILENAMES,
  COMMIT_MESSAGES,
  LEETCODE_TOPIC_DELIMITERS,
  DEFAULT_REPO_README,
} from "../utils/constants.js";
import { encode, decode, delay, DSAError } from "../utils/helpers.js";
import { logger } from "../utils/logger.js";
import { getGitHubFile, uploadWith409Retry, getRepoPath } from "../github/github.js";
import {
  getProblemSlug,
  getLanguageExtension,
  formatProblemReadme,
  formatBenchmarkStats,
} from "./submission.js";
import { incrementStats, setPersistentStats, getAndInitializeStats } from "./statistics.js";
import { config } from "../config/config.js";
import { LeetCodeSubmissionDetails, GFGSubmissionPayload, TopicTag } from "../types/index.js";

/**
 * Appends a problem link into the corresponding topic section of the root README.md.
 */
export function appendProblemToReadme(
  topic: string,
  markdownFile: string,
  hook: string,
  problem: string
): string {
  const url = `https://github.com/${hook}/tree/master/${problem}`;
  const topicHeader = `## ${topic}`;
  const topicTableHeader = `\n${topicHeader}\n|  |\n| ------- |\n`;
  const newRow = `| [${problem}](${url}) |`;

  const { START, HEADER, END } = LEETCODE_TOPIC_DELIMITERS;

  const startIndex = markdownFile.indexOf(START);
  if (startIndex === -1) {
    markdownFile += "\n" + [START, HEADER, END].join("\n");
  }

  const beforeSection = markdownFile.slice(0, markdownFile.indexOf(START));
  const afterSection = markdownFile.slice(markdownFile.indexOf(END) + END.length);

  let leetCodeSection = markdownFile.slice(
    markdownFile.indexOf(START) + START.length,
    markdownFile.indexOf(END)
  );

  let topicIndex = leetCodeSection.indexOf(topicHeader);
  if (topicIndex === -1) {
    leetCodeSection += topicTableHeader;
    topicIndex = leetCodeSection.indexOf(topicHeader);
  }

  const endTopicString = leetCodeSection.slice(topicIndex).match(/\|\n[^|]/)?.[0];
  const endTopicIndex =
    endTopicString != null ? leetCodeSection.indexOf(endTopicString, topicIndex + 1) : -1;
  let topicTable =
    endTopicIndex === -1
      ? leetCodeSection.slice(topicIndex)
      : leetCodeSection.slice(topicIndex, endTopicIndex + 1);
  topicTable = topicTable.trim();

  if (topicTable.includes(problem)) {
    return markdownFile;
  }

  topicTable = [topicTable, newRow, "\n"].join("\n");

  leetCodeSection =
    leetCodeSection.slice(0, topicIndex) +
    topicTable +
    (endTopicIndex === -1 ? "" : leetCodeSection.slice(endTopicIndex + 1));

  return [beforeSection, START, leetCodeSection, END, afterSection].join("");
}

/**
 * Sorts problem entries inside each topic table chronologically by problem number.
 */
export function sortTopicsInReadme(markdownFile: string): string {
  const { START, HEADER, END } = LEETCODE_TOPIC_DELIMITERS;

  let beforeSection = markdownFile.slice(0, markdownFile.indexOf(START));
  const afterSection = markdownFile.slice(markdownFile.indexOf(END) + END.length);

  const match = markdownFile.match(new RegExp(`${START}([\\s\\S]*)${END}`));
  if (!match) throw new DSAError("LeetCodeTopicSectionNotFound");

  const leetCodeSection = match[1];
  let topics = leetCodeSection.trim().split("## ");
  topics.shift();

  topics = topics.map((section) => {
    const lines = section.trim().split("\n");
    const topic = lines.shift();

    const topicHeaderIndex = markdownFile.indexOf(`## ${topic}`);
    const leetCodeSectionStartIndex = markdownFile.indexOf(START);

    if (topicHeaderIndex < leetCodeSectionStartIndex && topicHeaderIndex !== -1) {
      const endTopicString = markdownFile.slice(topicHeaderIndex).match(/\|\n[^|]/)?.[0];
      if (endTopicString) {
        const endTopicIndex = markdownFile.indexOf(endTopicString, topicHeaderIndex + 1);
        const topicSection = markdownFile.slice(topicHeaderIndex, endTopicIndex + 1);
        const problemsToMerge = topicSection.trim().split("\n").slice(3);

        lines.push(...problemsToMerge);
        beforeSection =
          markdownFile.slice(0, topicHeaderIndex) +
          markdownFile.slice(endTopicIndex + 1, markdownFile.indexOf(START));
      }
    }

    const problemLines = lines.slice(2);
    const uniqueLines = [...new Set(problemLines)];

    uniqueLines.sort((a, b) => {
      const numA = parseInt(a.match(/\/(\d+)-/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/\/(\d+)-/)?.[1] || "0", 10);
      return numA - numB;
    });

    return ["## " + topic, "|  |", "| ------- |", ...uniqueLines].join("\n");
  });

  return beforeSection + [START, HEADER, ...topics, END].join("\n") + afterSection;
}

/**
 * Updates root README.md with topic tags for solved problem.
 */
export async function updateReadmeTopicTagsWithProblem(
  token: string,
  hook: string,
  topicTags: TopicTag[],
  problemName: string
): Promise<void> {
  if (!topicTags || topicTags.length === 0) return;

  let readmeContent: string;
  let readmeSha = "";

  try {
    const file = await getGitHubFile(token, hook, FILENAMES.README);
    readmeContent = decode(file.content);
    readmeSha = file.sha;
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes("404")) {
      readmeContent = DEFAULT_REPO_README;
    } else {
      throw err;
    }
  }

  for (const topic of topicTags) {
    readmeContent = appendProblemToReadme(topic.name, readmeContent, hook, problemName);
  }
  readmeContent = sortTopicsInReadme(readmeContent);

  await delay(() => {}, config.timing.githubConflictRetryDelayMs);
  await uploadWith409Retry(
    token,
    hook,
    encode(readmeContent),
    FILENAMES.README,
    readmeSha,
    COMMIT_MESSAGES.UPDATE_README
  );
}

/**
 * Checks if a problem has already been uploaded previously.
 */
export async function isProblemAlreadyCompleted(problemName: string): Promise<boolean> {
  const { [STORAGE_KEYS.STATS]: stats } = await storage.get<{ [key: string]: any }>(
    STORAGE_KEYS.STATS
  );
  if (!stats?.shas?.[problemName]) return false;

  for (const file of Object.keys(stats.shas[problemName])) {
    if (file.includes(problemName)) return true;
  }
  return false;
}

/**
 * Coordinates upload of solution files, notes, README, topic tags, and stats update.
 */
export async function syncLeetCodeSubmission(
  submissionData: LeetCodeSubmissionDetails
): Promise<void> {
  const { [STORAGE_KEYS.TOKEN]: token, [STORAGE_KEYS.HOOK]: hook } = await storage.get<{
    [key: string]: string;
  }>([STORAGE_KEYS.TOKEN, STORAGE_KEYS.HOOK]);

  if (!token || !hook) {
    throw new DSAError("GitHub credentials or repository hook missing");
  }

  const problemName = getProblemSlug(submissionData);
  const langExt = getLanguageExtension(submissionData);
  const solutionFileName = `${problemName}${langExt}`;
  const codePath = getRepoPath(problemName, solutionFileName);
  const readmePath = getRepoPath(problemName, FILENAMES.README);
  const notesPath = getRepoPath(problemName, FILENAMES.NOTES);

  const stats = await getAndInitializeStats(problemName);
  const existingCodeSha = stats.shas?.[problemName]?.[solutionFileName] || "";
  const existingReadmeSha = stats.shas?.[problemName]?.[FILENAMES.README] || "";
  const existingNotesSha = stats.shas?.[problemName]?.[FILENAMES.NOTES] || "";

  const problemMarkdown = formatProblemReadme(submissionData);
  const benchmarkCommitMsg = formatBenchmarkStats(submissionData);
  const codeContent = submissionData.code || "";
  const notesContent = submissionData.notes || "";

  // 1. Upload Problem README if not present
  if (!existingReadmeSha) {
    const newReadmeSha = await uploadWith409Retry(
      token,
      hook,
      encode(problemMarkdown),
      readmePath,
      existingReadmeSha,
      COMMIT_MESSAGES.README
    );
    stats.shas[problemName][FILENAMES.README] = newReadmeSha;
  }

  // 2. Upload Notes if available
  if (notesContent.trim().length > 0) {
    const newNotesSha = await uploadWith409Retry(
      token,
      hook,
      encode(notesContent),
      notesPath,
      existingNotesSha,
      COMMIT_MESSAGES.NOTES
    );
    stats.shas[problemName][FILENAMES.NOTES] = newNotesSha;
  }

  // 3. Upload Solution Code
  const newCodeSha = await uploadWith409Retry(
    token,
    hook,
    encode(codeContent),
    codePath,
    existingCodeSha,
    benchmarkCommitMsg
  );
  stats.shas[problemName][solutionFileName] = newCodeSha;
  await storage.set({ [STORAGE_KEYS.STATS]: stats });

  // 4. Update Topic Tags in root README
  const topicTags = submissionData.question?.topicTags || submissionData.topicTags;
  if (topicTags && topicTags.length > 0) {
    await updateReadmeTopicTagsWithProblem(token, hook, topicTags, problemName);
  }

  // 5. Update local and remote statistics
  const alreadyCompleted = await isProblemAlreadyCompleted(problemName);
  if (!alreadyCompleted) {
    const updatedStats = await incrementStats(submissionData.question.difficulty, problemName);
    await setPersistentStats(updatedStats, token, hook);
  }

  logger.info(`Successfully synced submission for ${problemName}`);
}

/**
 * Synchronizes GeeksforGeeks submission.
 */
export async function syncGFGSubmission({
  title,
  difficulty,
  problemStatement,
  code,
  languageExt,
}: GFGSubmissionPayload): Promise<void> {
  const { [STORAGE_KEYS.TOKEN]: token, [STORAGE_KEYS.HOOK]: hook } = await storage.get<{
    [key: string]: string;
  }>([STORAGE_KEYS.TOKEN, STORAGE_KEYS.HOOK]);

  if (!token || !hook) {
    throw new DSAError("GitHub credentials or repository hook missing");
  }

  const probName = `${title} - GFG`;
  const fileName = `${title.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-")}${languageExt}`;
  const codePath = getRepoPath(probName, fileName);
  const readmePath = getRepoPath(probName, FILENAMES.README);

  const stats = await getAndInitializeStats(probName);
  const existingCodeSha = stats.shas?.[probName]?.[fileName] || "";
  const existingReadmeSha = stats.shas?.[probName]?.[FILENAMES.README] || "";

  // 1. Upload README
  if (!existingReadmeSha) {
    const readmeSha = await uploadWith409Retry(
      token,
      hook,
      encode(problemStatement),
      readmePath,
      existingReadmeSha,
      COMMIT_MESSAGES.README
    );
    stats.shas[probName][FILENAMES.README] = readmeSha;
  }

  // 2. Upload Code
  if (code) {
    const codeSha = await uploadWith409Retry(
      token,
      hook,
      encode(code),
      codePath,
      existingCodeSha,
      COMMIT_MESSAGES.GFG_SUBMIT
    );
    stats.shas[probName][fileName] = codeSha;
  }

  await storage.set({ [STORAGE_KEYS.STATS]: stats });
  const alreadyCompleted = await isProblemAlreadyCompleted(probName);
  if (!alreadyCompleted) {
    const updatedStats = await incrementStats(difficulty, probName);
    await setPersistentStats(updatedStats, token, hook);
  }

  logger.info(`Successfully synced GFG submission for ${title}`);
}
