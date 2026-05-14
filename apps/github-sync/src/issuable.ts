export type IssuableKind = 'parent' | 'user-story' | 'scenario';

export type Issuable = {
  figjamId: string;
  parentFigjamId?: string;
  kind: IssuableKind;
  title: string;
  body: string;
  labels: string[];
  milestone?: string;
};
