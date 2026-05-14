export type { Fetcher, GithubConfig, Logger } from './types';
export type { Issuable, IssuableKind } from './issuable';
export type { ImpactMappingContext } from './aggregator';
export { aggregate } from './aggregator';
export { GithubClient } from './githubClient';
export type { ExistingIssue, IssueRef } from './githubClient';
export { Syncer } from './syncer';
export type { SyncSummary } from './syncer';
export { GithubApiError } from './githubApiError';
export {
  figjamIdMarker,
  extractFigjamId,
  wrapAutoBody,
  extractManualContent,
  formatBodyForMarkdown,
} from './bodyMarkers';
