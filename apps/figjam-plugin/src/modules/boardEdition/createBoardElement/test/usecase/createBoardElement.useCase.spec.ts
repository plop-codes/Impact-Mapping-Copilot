import { describe, it, expect, beforeEach } from 'vitest';
import { ElementType, TYPE_TO_COLOR } from '../../../../boardAnalysis/element';
import { CreateBoardElementUseCase } from '../../createBoardElement.useCase';
import { InMemoryBoardWriter } from '../createBoardElement.inMemoryBoardWriter';
import type { ParentInfo } from '../../createBoardElement.boardElement';

describe('CreateBoardElementUseCase', () => {
  let boardWriter: InMemoryBoardWriter;
  let useCase: CreateBoardElementUseCase;
  const viewportCenter = { x: 500, y: 300 };

  beforeEach(() => {
    boardWriter = new InMemoryBoardWriter();
    useCase = new CreateBoardElementUseCase(boardWriter);
  });

  function aParent(type: ElementType, overrides?: Partial<ParentInfo>): ParentInfo {
    return { id: 'parent-1', type, x: 100, y: 200, height: 100, ...overrides };
  }

  describe('sans parent sélectionné', () => {
    it('crée un shape au centre du viewport', () => {
      const result = useCase.execute({
        elementType: ElementType.USER_STORY,
        parent: null,
        viewportCenter,
      });

      expect(result.isSuccess()).toBe(true);
      expect(boardWriter.shapes).toHaveLength(1);
      expect(boardWriter.shapes[0].x).toBe(500);
      expect(boardWriter.shapes[0].y).toBe(300);
      expect(boardWriter.shapes[0].hexColor).toBe(TYPE_TO_COLOR[ElementType.USER_STORY]);
      expect(boardWriter.connectors).toHaveLength(0);
    });
  });

  describe('avec parent valide', () => {
    it('crée un shape enfant connecté en dessous du parent', () => {
      const result = useCase.execute({
        elementType: ElementType.ACTOR,
        parent: aParent(ElementType.OBJECTIVE),
        viewportCenter,
      });

      expect(result.isSuccess()).toBe(true);
      expect(boardWriter.shapes).toHaveLength(1);
      expect(boardWriter.shapes[0].x).toBe(100);
      expect(boardWriter.shapes[0].y).toBe(420); // 200 + 100 + 120
      expect(boardWriter.connectors).toHaveLength(1);
      expect(boardWriter.connectors[0].startNodeId).toBe('parent-1');
      expect(boardWriter.connectors[0].endNodeId).toBe(boardWriter.shapes[0].id);
    });

    it('crée une règle sous une user story', () => {
      const result = useCase.execute({
        elementType: ElementType.RULE,
        parent: aParent(ElementType.USER_STORY),
        viewportCenter,
      });

      expect(result.isSuccess()).toBe(true);
      expect(boardWriter.shapes[0].hexColor).toBe(TYPE_TO_COLOR[ElementType.RULE]);
    });

    it('crée un scénario sous une règle', () => {
      const result = useCase.execute({
        elementType: ElementType.SCENARIO,
        parent: aParent(ElementType.RULE),
        viewportCenter,
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('avec parent invalide', () => {
    it('refuse de créer une user story sous un impact (skip un niveau)', () => {
      const result = useCase.execute({
        elementType: ElementType.USER_STORY,
        parent: aParent(ElementType.IMPACT),
        viewportCenter,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Impossible');
      expect(boardWriter.shapes).toHaveLength(0);
    });

    it('refuse de créer un objectif sous un acteur (remonter la hiérarchie)', () => {
      const result = useCase.execute({
        elementType: ElementType.OBJECTIVE,
        parent: aParent(ElementType.ACTOR),
        viewportCenter,
      });

      expect(result.isFailure()).toBe(true);
      expect(boardWriter.shapes).toHaveLength(0);
    });

    it('refuse de créer un enfant sous un scénario (dernier niveau)', () => {
      const result = useCase.execute({
        elementType: ElementType.RULE,
        parent: aParent(ElementType.SCENARIO),
        viewportCenter,
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('ne peut pas avoir d\'enfant');
      expect(boardWriter.shapes).toHaveLength(0);
    });

    it('refuse de créer un élément du même niveau que le parent', () => {
      const result = useCase.execute({
        elementType: ElementType.ACTION,
        parent: aParent(ElementType.ACTION),
        viewportCenter,
      });

      expect(result.isFailure()).toBe(true);
      expect(boardWriter.shapes).toHaveLength(0);
    });
  });
});
