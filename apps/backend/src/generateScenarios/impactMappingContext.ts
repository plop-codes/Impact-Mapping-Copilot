export type ElementType =
  | 'OBJECTIVE'
  | 'ACTOR'
  | 'IMPACT'
  | 'ACTION'
  | 'USER_STORY'
  | 'RULE'
  | 'SCENARIO';

export type HierarchizedElementJson = {
  id: string;
  type: ElementType;
  title: string;
  parentId?: string;
  release?: string;
  text?: string;
  body?: string;
  testDrivers?: string[];
  attachmentNodeIds?: string[];
  boundedContext?: string;
  domain?: string;
  childrenIds: string[];
};

export type GlossaryEntry = {
  term: string;
  definitions: Record<string, string>;
};

export type ImpactMappingContext = {
  elements: HierarchizedElementJson[];
  warnings: string[];
  productVision?: string[];
  operationalActors?: string[];
  glossary?: GlossaryEntry[];
};
