import { ElementType } from '../boardAnalysis/element';
import type { HierarchizedElementJson } from '../boardAnalysis/impactMapping';
import type { ImageAttachment } from './createGitHubIssues/githubImageUploader';

const TYPES_REQUIRING_DESCENDANT_USER_STORY: ElementType[] = [
  ElementType.OBJECTIVE,
  ElementType.ACTOR,
  ElementType.IMPACT,
  ElementType.ACTION,
];

export class IssuableElement {
  readonly elementId: string;
  readonly title: string;
  readonly type: ElementType;
  readonly body: string;
  readonly testDrivers: string[];
  readonly attachments: ImageAttachment[];
  readonly boundedContext?: string;
  readonly domain?: string;
  readonly milestone?: string;
  readonly parentElementId?: string;

  private constructor(
    elementId: string,
    title: string,
    type: ElementType,
    body: string,
    testDrivers: string[],
    attachments: ImageAttachment[],
    boundedContext?: string,
    domain?: string,
    milestone?: string,
    parentElementId?: string,
  ) {
    this.elementId = elementId;
    this.title = title;
    this.type = type;
    this.body = body;
    this.testDrivers = testDrivers;
    this.attachments = attachments;
    this.boundedContext = boundedContext;
    this.domain = domain;
    this.milestone = milestone;
    this.parentElementId = parentElementId;
  }

  static fromHierarchizedElement(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
    attachmentsByElementId?: Record<string, ImageAttachment[]>,
  ): IssuableElement | undefined {
    if (this.isRule(node)) return undefined;

    if (
      TYPES_REQUIRING_DESCENDANT_USER_STORY.includes(node.type) &&
      !this.hasDescendantUserStory(node, allElements)
    ) {
      return undefined;
    }

    return new IssuableElement(
      node.id,
      node.title,
      node.type,
      this.buildBodyWithRules(node, allElements),
      node.testDrivers ?? [],
      attachmentsByElementId?.[node.id] ?? [],
      node.boundedContext,
      node.domain,
      this.computeMilestone(node, allElements),
      this.resolveParentElementId(node, allElements),
    );
  }

  private static buildBodyWithRules(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string {
    const parts: string[] = [];

    if (node.type === ElementType.USER_STORY) {
      const rules = node.childrenIds
        .map((id) => allElements.get(id))
        .filter((child): child is HierarchizedElementJson => child?.type === ElementType.RULE);

      if (rules.length > 0) {
        if (node.body) parts.push(node.body);
        parts.push('## Règles');
        for (const rule of rules) {
          const ruleText = rule.body ? `${rule.title}: ${rule.body}` : rule.title;
          parts.push(`- ${ruleText}`);
        }
      } else {
        if (node.body) parts.push(node.body);
      }
    } else {
      const body = node.body ?? this.extractBodyFromText(node);
      if (body) parts.push(body);
    }

    if (node.boundedContext) {
      parts.push('## Bounded Context');
      parts.push(node.boundedContext);
    }

    if (node.domain) {
      parts.push('## Domain');
      parts.push(node.domain);
    }

    return parts.join('\n');
  }

  private static extractBodyFromText(node: HierarchizedElementJson): string | undefined {
    if (!node.text) return undefined;
    const titleIndex = node.text.indexOf(node.title);
    if (titleIndex === -1) return node.text.trim() || undefined;
    const remaining = node.text.substring(titleIndex + node.title.length).trim();
    return remaining || undefined;
  }

  private static isRule(node: HierarchizedElementJson): boolean {
    return node.type === ElementType.RULE;
  }

  private static resolveParentElementId(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string | undefined {
    if (node.type === ElementType.SCENARIO) {
      return this.findUserStoryAncestor(node, allElements);
    }
    return node.parentId;
  }

  private static findUserStoryAncestor(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string | undefined {
    let current = node.parentId ? allElements.get(node.parentId) : undefined;
    while (current) {
      if (current.type === ElementType.USER_STORY) return current.id;
      current = current.parentId ? allElements.get(current.parentId) : undefined;
    }
    return undefined;
  }

  private static computeMilestone(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string | undefined {
    if (
      node.type === ElementType.USER_STORY ||
      node.type === ElementType.SCENARIO
    ) {
      return node.release;
    }
    return this.findFirstDescendantUserStoryRelease(node, allElements);
  }

  private static hasDescendantUserStory(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): boolean {
    if (node.type === ElementType.USER_STORY) return true;
    return node.childrenIds.some((id) => {
      const child = allElements.get(id);
      return child ? this.hasDescendantUserStory(child, allElements) : false;
    });
  }

  private static findFirstDescendantUserStoryRelease(
    node: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string | undefined {
    for (const id of node.childrenIds) {
      const child = allElements.get(id);
      if (!child) continue;
      if (child.type === ElementType.USER_STORY) return child.release;
      const release = this.findFirstDescendantUserStoryRelease(child, allElements);
      if (release) return release;
    }
    return undefined;
  }
}
