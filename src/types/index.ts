export type Difficulty = "Easy" | "Medium" | "Hard" | "Unknown";

export interface ProblemShas {
  [filename: string]: string | undefined;
  difficulty?: string;
}

export interface Stats {
  easy: number;
  medium: number;
  hard: number;
  solved: number;
  shas: Record<string, ProblemShas>;
}

export interface TopicTag {
  tagId?: string;
  slug: string;
  name: string;
}

export interface LeetCodeQuestion {
  questionId: string | number;
  questionFrontendId?: string | number;
  title: string;
  titleSlug: string;
  content: string;
  difficulty: string;
  topicTags?: TopicTag[];
}

export interface LeetCodeSubmissionDetails {
  runtime: number;
  runtimeDisplay: string;
  runtimePercentile: number;
  runtimeDistribution?: string;
  memory: number;
  memoryDisplay: string;
  memoryPercentile: number;
  memoryDistribution?: string;
  code: string;
  timestamp?: number;
  statusCode?: number;
  lang: {
    name: string;
    verboseName: string;
  };
  question: LeetCodeQuestion;
  notes?: string;
  topicTags?: TopicTag[];
  runtimeError?: string | null;
}

export interface GitHubFile {
  sha: string;
  content: string;
  json: Record<string, unknown>;
}

export interface GitHubRepoResponse {
  full_name: string;
  html_url: string;
  name: string;
  private: boolean;
}

export interface GitHubUser {
  login: string;
  id: number;
  html_url: string;
}

export interface GFGSubmissionPayload {
  title: string;
  difficulty: string;
  problemStatement: string;
  code: string;
  languageExt: string;
}
