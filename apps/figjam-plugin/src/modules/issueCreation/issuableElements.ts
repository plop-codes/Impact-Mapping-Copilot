import { ElementType } from '../boardAnalysis/element';
import type { HierarchizedElementJson } from '../boardAnalysis/impactMapping';
import { IssuableElement } from './issuableElement';
import type { ImageAttachment } from './createGitHubIssues/githubImageUploader';

export class IssuableElements {
  readonly items: IssuableElement[];

  private constructor(items: IssuableElement[]) {
    this.items = items;
  }

  static fromHierarchizedElements(
    hierarchizedElements: HierarchizedElementJson[],
    attachmentsByElementId?: Record<string, ImageAttachment[]>,
  ): IssuableElements {
    const allElements = new Map(
      hierarchizedElements.map((e) => [e.id, e]),
    );

    const items = hierarchizedElements
      .map((node) => IssuableElement.fromHierarchizedElement(node, allElements, attachmentsByElementId))
      .filter((item): item is IssuableElement => item !== undefined);

    return new IssuableElements(items);
  }

  static fromSelectedElements(
    selectedIds: string[],
    allHierarchizedElements: HierarchizedElementJson[],
    attachmentsByElementId?: Record<string, ImageAttachment[]>,
  ): IssuableElements {
    const allElements = new Map(
      allHierarchizedElements.map((e) => [e.id, e]),
    );

    const resolvedIds = this.resolveSelectedIds(selectedIds, allElements);

    const selectedElements = allHierarchizedElements
      .filter((e) => resolvedIds.has(e.id));

    const items = selectedElements
      .map((node) => IssuableElement.fromHierarchizedElement(node, allElements, attachmentsByElementId))
      .filter((item): item is IssuableElement => item !== undefined);

    return new IssuableElements(items);
  }

  private static resolveSelectedIds(
    selectedIds: string[],
    allElements: Map<string, HierarchizedElementJson>,
  ): Set<string> {
    const resolved = new Set<string>();
    for (const id of selectedIds) {
      const element = allElements.get(id);
      if (!element) continue;

      if (element.type === ElementType.RULE) {
        const userStoryId = this.findUserStoryAncestor(element, allElements);
        if (userStoryId) {
          resolved.add(userStoryId);
          const userStory = allElements.get(userStoryId);
          if (userStory) this.collectDescendantScenarios(userStory, allElements, resolved);
        }
      } else {
        resolved.add(id);
        if (element.type === ElementType.USER_STORY) {
          this.collectDescendantScenarios(element, allElements, resolved);
        }
      }
    }
    return resolved;
  }

  private static collectDescendantScenarios(
    element: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
    resolved: Set<string>,
  ): void {
    for (const childId of element.childrenIds) {
      const child = allElements.get(childId);
      if (!child) continue;
      if (child.type === ElementType.SCENARIO) {
        resolved.add(child.id);
      } else {
        this.collectDescendantScenarios(child, allElements, resolved);
      }
    }
  }

  private static findUserStoryAncestor(
    element: HierarchizedElementJson,
    allElements: Map<string, HierarchizedElementJson>,
  ): string | undefined {
    let current = element.parentId ? allElements.get(element.parentId) : undefined;
    while (current) {
      if (current.type === ElementType.USER_STORY) return current.id;
      current = current.parentId ? allElements.get(current.parentId) : undefined;
    }
    return undefined;
  }
}
