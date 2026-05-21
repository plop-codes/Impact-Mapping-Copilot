import type {
  GlossaryEntry,
  HierarchyNode,
  HierarchyRule,
  HierarchyUserStory,
} from '../generateScenarios/scenarioRequest.js';

export type IterationHierarchy = {
  userStory: HierarchyUserStory;
  rules: HierarchyRule[];
  section?: string;
  action?: HierarchyNode;
  impact?: HierarchyNode;
  actor?: HierarchyNode;
  objective?: HierarchyNode;
};

export type IterationUserStory = {
  hierarchy: IterationHierarchy;
  glossary: GlossaryEntry[];
};

export type IterationRefinementRequest = {
  section: string;
  userStories: IterationUserStory[];
};
