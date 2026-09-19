export const config = Object.freeze({
  github: {
    clientId: "0114dd35b156d4729fac",
    clientSecret: "cfc3301d9745530bf1b31e92528ad9c31fd3f995",
    authorizationUrl: "https://github.com/login/oauth/authorize",
    accessTokenUrl: "https://github.com/login/oauth/access_token",
    redirectUrl: "https://github.com/",
    apiBaseUrl: "https://api.github.com",
    scopes: ["repo"],
  },
  leetcode: {
    graphqlUrl: "https://leetcode.com/graphql/",
    baseUrl: "https://leetcode.com",
  },
  timing: {
    githubConflictRetryDelayMs: 500,
    manualSubmitDebounceMs: 5000,
    submissionPollingIntervalMs: 1000,
    submissionPollingMaxAttempts: 10,
  },
});
