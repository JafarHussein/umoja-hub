/**
 * GitHub integration service using Octokit.
 * File: src/lib/integrations/githubService.ts
 *
 * Functions:
 *   searchRepositories — find beginner-friendly repos matching student profile
 *   getCommitHistory   — fetch commit metadata for audit purposes
 *   getRepoLanguages   — fetch detected languages for skill extraction
 */

import { logger } from '@/lib/utils';

const GITHUB_API_BASE = 'https://api.github.com';

function githubHeaders(): Record<string, string> {
  // Use the GitHub App token if available; fall back to unauthenticated
  const token = process.env['GITHUB_TOKEN'] ?? process.env['GITHUB_APP_PRIVATE_KEY'];
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface GithubRepo {
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  starCount: number;
  openIssueCount: number;
  hasReadme: boolean;
  hasContributing: boolean;
  pushedAt: string;
}

export interface CommitHistoryResult {
  commitCount: number;
  lastCommitHash: string;
  commitTimelineHash: string;
}

interface GithubRepoSearchItem {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
}

interface GithubSearchResponse {
  items?: GithubRepoSearchItem[];
}

interface GithubCommit {
  sha: string;
  commit?: { author?: { date?: string } };
}

/**
 * Search GitHub for beginner-friendly open-source repositories matching the student profile.
 * Filters: has open issues, last commit within 6 months, language matches tech stack.
 * Note: README/CONTRIBUTING presence is verified via separate API calls — cached in MongoDB by caller.
 */
export async function searchRepositories(params: {
  tier: string;
  interestArea: string;
  techStack: string[];
}): Promise<GithubRepo[]> {
  try {
    const { tier, techStack } = params;

    // Only search for repos with a matching language
    const language = techStack[0] ?? 'JavaScript';
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const since = sixMonthsAgo.toISOString().split('T')[0];

    // Good-first-issue labels — beginner-friendly signal
    const labelMap: Record<string, string> = {
      BEGINNER: 'good+first+issue',
      INTERMEDIATE: 'help+wanted',
      ADVANCED: 'help+wanted',
    };
    const label = labelMap[tier] ?? 'good+first+issue';

    const query = encodeURIComponent(
      `language:${language} label:${label} pushed:>${since} has:open-issues`
    );
    const url = `${GITHUB_API_BASE}/search/repositories?q=${query}&sort=updated&per_page=10`;

    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
      logger.error('githubService', 'GitHub search API failed', { status: res.status });
      return [];
    }

    const data = (await res.json()) as GithubSearchResponse;
    const items = data.items ?? [];

    return items.map((item) => ({
      fullName: item.full_name,
      htmlUrl: item.html_url,
      description: item.description,
      language: item.language,
      starCount: item.stargazers_count,
      openIssueCount: item.open_issues_count,
      hasReadme: true, // Assumed — repos surface via API generally have READMEs
      hasContributing: false, // Would need separate API call per repo; too expensive for search
      pushedAt: item.pushed_at,
    }));
  } catch (error) {
    logger.error('githubService', 'Unexpected error in searchRepositories', { error });
    return [];
  }
}

/**
 * Fetch commit history for a student's repository contribution.
 * Returns commit count, last commit hash, and a SHA-256 timeline hash for audit purposes.
 */
export async function getCommitHistory(
  repoFullName: string,
  githubUsername: string
): Promise<CommitHistoryResult | null> {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repoFullName}/commits?author=${githubUsername}&per_page=100`;
    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
      logger.error('githubService', 'GitHub commits API failed', {
        status: res.status,
        repo: repoFullName,
        user: githubUsername,
      });
      return null;
    }

    const commits = (await res.json()) as GithubCommit[];

    if (!Array.isArray(commits) || commits.length === 0) {
      return { commitCount: 0, lastCommitHash: '', commitTimelineHash: '' };
    }

    const { createHash } = await import('crypto');
    const shas = commits.map((c) => c.sha).join(',');
    const timelineHash = createHash('sha256').update(shas).digest('hex');

    return {
      commitCount: commits.length,
      lastCommitHash: commits[0]?.sha ?? '',
      commitTimelineHash: timelineHash,
    };
  } catch (error) {
    logger.error('githubService', 'Unexpected error in getCommitHistory', { error });
    return null;
  }
}

/**
 * Fetch language breakdown for a repository (used for skill extraction).
 * Returns an array of language names detected by GitHub.
 */
export async function getRepoLanguages(repoFullName: string): Promise<string[]> {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repoFullName}/languages`;
    const res = await fetch(url, { headers: githubHeaders() });

    if (!res.ok) {
      logger.error('githubService', 'GitHub languages API failed', {
        status: res.status,
        repo: repoFullName,
      });
      return [];
    }

    const data = (await res.json()) as Record<string, number>;
    return Object.keys(data);
  } catch (error) {
    logger.error('githubService', 'Unexpected error in getRepoLanguages', { error });
    return [];
  }
}

