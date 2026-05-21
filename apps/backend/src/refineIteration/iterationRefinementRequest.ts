import type { GlossaryEntry, HierarchyContext } from '../generateScenarios/scenarioRequest.js';

export type IterationUserStory = {
  hierarchy: HierarchyContext;
  glossary: GlossaryEntry[];
};

export type IterationRefinementRequest = {
  section: string;
  userStories: IterationUserStory[];
};
