import { config } from "../config/config.js";
import { LANGUAGES } from "../utils/constants.js";
import { getDifficulty, formatStats, addLeadingZeros, DSAError } from "../utils/helpers.js";
import { LeetCodeSubmissionDetails } from "../types/index.js";

const SUBMISSION_DETAILS_QUERY = `
query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    runtime
    runtimeDisplay
    runtimePercentile
    runtimeDistribution
    memory
    memoryDisplay
    memoryPercentile
    memoryDistribution
    code
    timestamp
    statusCode
    lang {
      name
      verboseName
    }
    question {
      questionId
      title
      titleSlug
      content
      difficulty
      topicTags {
        name
        slug
      }
    }
    notes
    topicTags {
      tagId
      slug
      name
    }
    runtimeError
  }
}
`;

const QUESTION_DETAIL_QUERY = `
query questionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId
  }
}
`;

/**
 * Fetches submission details from LeetCode GraphQL API.
 */
export async function fetchLeetCodeSubmissionDetails(
  submissionId: number | string
): Promise<LeetCodeSubmissionDetails> {
  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(typeof document !== "undefined" && document.cookie ? { cookie: document.cookie } : {}),
    },
    body: JSON.stringify({
      query: SUBMISSION_DETAILS_QUERY,
      variables: { submissionId: Number(submissionId) },
      operationName: "submissionDetails",
    }),
  };

  const response = await fetch(config.leetcode.graphqlUrl, options);
  if (!response.ok) {
    throw new DSAError(`LeetCode GraphQL error: ${response.status}`);
  }

  const json = await response.json();
  const submissionData: LeetCodeSubmissionDetails = json?.data?.submissionDetails;
  if (!submissionData) {
    throw new DSAError("No submission details returned from LeetCode");
  }

  if (submissionData.question?.titleSlug) {
    try {
      const qOptions = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(typeof document !== "undefined" && document.cookie
            ? { cookie: document.cookie }
            : {}),
        },
        body: JSON.stringify({
          query: QUESTION_DETAIL_QUERY,
          variables: { titleSlug: submissionData.question.titleSlug },
          operationName: "questionDetail",
        }),
      };
      const qRes = await fetch(config.leetcode.graphqlUrl, qOptions);
      if (qRes.ok) {
        const qJson = await qRes.json();
        const frontendId = qJson?.data?.question?.questionFrontendId;
        if (frontendId) {
          submissionData.question.questionFrontendId = frontendId;
        }
      }
    } catch {
      submissionData.question.questionFrontendId = submissionData.question.questionId;
    }
  }

  return submissionData;
}

/**
 * Formats a problem slug (e.g. 0001-two-sum).
 */
export function getProblemSlug(submissionData: LeetCodeSubmissionDetails): string {
  const qNum = submissionData.question.questionFrontendId || submissionData.question.questionId;
  const slugTitle = submissionData.question.titleSlug;
  return addLeadingZeros(`${qNum}-${slugTitle}`);
}

/**
 * Extracts language file extension from submission details.
 */
export function getLanguageExtension(submissionData: LeetCodeSubmissionDetails): string {
  const langName = submissionData.lang?.verboseName || submissionData.lang?.name;
  return LANGUAGES[langName] || ".txt";
}

/**
 * Formats markdown for problem README.md.
 */
export function formatProblemReadme(submissionData: LeetCodeSubmissionDetails): string {
  const qNum = submissionData.question.questionFrontendId || submissionData.question.questionId;
  const qTitle = `${qNum}. ${submissionData.question.title}`;
  const difficulty = getDifficulty(submissionData.question.difficulty);
  const questionUrl = `${config.leetcode.baseUrl}/problems/${submissionData.question.titleSlug}/`;
  const qBody = submissionData.question.content || "";

  return `<h2><a href="${questionUrl}">${qTitle}</a></h2><h3>${difficulty}</h3><hr>${qBody}`;
}

/**
 * Formats commit message for solution code.
 */
export function formatBenchmarkStats(submissionData: LeetCodeSubmissionDetails): string {
  const runtimePercentile =
    Math.round(((submissionData.runtimePercentile || 0) + Number.EPSILON) * 100) / 100;
  const spacePercentile =
    Math.round(((submissionData.memoryPercentile || 0) + Number.EPSILON) * 100) / 100;

  return formatStats(
    submissionData.runtimeDisplay || `${submissionData.runtime} ms`,
    runtimePercentile,
    submissionData.memoryDisplay || `${submissionData.memory} MB`,
    spacePercentile
  );
}
