export type HierarchyNode = { id: string; title: string };
export type HierarchyRule = { id: string; title: string; body?: string };
export type HierarchyUserStory = {
  id: string;
  title: string;
  body?: string;
  boundedContext?: string;
  domain?: string;
};

export type HierarchyContext = {
  rule: HierarchyRule;
  userStory?: HierarchyUserStory;
  action?: HierarchyNode;
  impact?: HierarchyNode;
  actor?: HierarchyNode;
  objective?: HierarchyNode;
};

export type GlossaryEntry = {
  term: string;
  definitions: Record<string, string>;
};

export type ScenarioRequest = {
  ruleId: string;
  ruleTitle: string;
  hierarchy?: HierarchyContext;
  glossary?: GlossaryEntry[];
};
