export enum ElementType {
  OBJECTIVE = 'OBJECTIVE',
  ACTOR = 'ACTOR',
  IMPACT = 'IMPACT',
  ACTION = 'ACTION',
  USER_STORY = 'USER_STORY',
  RULE = 'RULE',
  SCENARIO = 'SCENARIO',
}

const VALID_SHAPE_TYPES = ['SQUARE', 'ROUNDED_RECTANGLE'];

export const HIERARCHY_ORDER: ElementType[] = [
  ElementType.OBJECTIVE,
  ElementType.ACTOR,
  ElementType.IMPACT,
  ElementType.ACTION,
  ElementType.USER_STORY,
  ElementType.RULE,
  ElementType.SCENARIO,
];

export const COLOR_TO_TYPE: Record<string, ElementType> = {
  '#1E3A8A': ElementType.OBJECTIVE,
  '#7C3AED': ElementType.ACTOR,
  '#16A34A': ElementType.IMPACT,
  '#EA580C': ElementType.ACTION,
  '#FACC15': ElementType.USER_STORY,
  '#64748B': ElementType.RULE,
  '#CBD5E1': ElementType.SCENARIO,
};

export const TYPE_TO_COLOR: Record<ElementType, string> = Object.fromEntries(
  Object.entries(COLOR_TO_TYPE).map(([color, type]) => [type, color]),
) as Record<ElementType, string>;

export const BOUNDED_CONTEXT_COLOR = '#1E1E1E';
export const DOMAIN_COLOR = '#CDF4D3';


export class Element {
  readonly id: string;
  readonly type: ElementType;
  readonly text: string;
  readonly title: string;
  readonly body?: string;
  readonly testDrivers: string[];
  release?: string;
  parentId?: string;
  childrenIds: string[] = [];

  private constructor(id: string, type: ElementType, text: string, boldText?: string) {
    this.assertIdIsNotEmpty(id);
    this.assertTextIsNotEmpty(text);
    this.assertElementIsKnownType(type);

    this.id = id;
    this.type = type;

    const { cleanedText, drivers } = Element.extractTestDrivers(text);
    this.testDrivers = drivers;
    this.text = cleanedText;

    if (boldText) {
      this.title = boldText.trim();
      this.body = this.extractBodyAfterBold(cleanedText, boldText);
    } else {
      this.title = cleanedText.trim();
      this.body = undefined;
    }
  }

  private static extractTestDrivers(text: string): { cleanedText: string; drivers: string[] } {
    const startMatch = text.match(/^\s*\[([^\]]*)\]\s*\n?/);
    if (startMatch) {
      const drivers = startMatch[1]
        .split(/[/,]/)
        .map((d) => d.trim().replace(/^['"]|['"]$/g, ''))
        .filter((d) => d.length > 0);
      const cleanedText = text.substring(startMatch[0].length).trimStart();
      return { cleanedText, drivers };
    }
    const endMatch = text.match(/\[([^\]]*)\]\s*$/);
    if (!endMatch) return { cleanedText: text, drivers: [] };
    const drivers = endMatch[1]
      .split(/[/,]/)
      .map((d) => d.trim().replace(/^['"]|['"]$/g, ''))
      .filter((d) => d.length > 0);
    const cleanedText = text.substring(0, endMatch.index!).trimEnd();
    return { cleanedText, drivers };
  }

  private extractBodyAfterBold(text: string, boldText: string): string | undefined {
    const index = text.indexOf(boldText);
    if (index === -1) return undefined;
    const remaining = text.substring(index + boldText.length).trim();
    return remaining || undefined;
  }

  private assertElementIsKnownType(type: ElementType) {
    if (!HIERARCHY_ORDER.includes(type)) throw new Error(`Unknown element type: ${type}`);
  }

  private assertTextIsNotEmpty(text: string) {
    if (!text.trim()) throw new Error('Element text cannot be empty');
  }

  private assertIdIsNotEmpty(id: string) {
    if (!id.trim()) throw new Error('Element id cannot be empty');
  }

  static generateFromRawShape(shape: {
    id: string;
    shapeType: string;
    fillColor: string;
    text: string;
    boldText?: string;
  }): Element | undefined {
    if (!this.isValidShapeType(shape.shapeType)) return undefined;
    if (!this.hasNonEmptyText(shape.text)) return undefined;

    const type = this.detectTypeFromColor(shape.fillColor);
    if (!type) return undefined;

    return new Element(shape.id, type, shape.text, shape.boldText);
  }

  private static detectTypeFromColor(fillColor: string): ElementType | undefined {
    return COLOR_TO_TYPE[fillColor.toUpperCase()];
  }

  private static isValidShapeType(shapeType: string): boolean {
    return VALID_SHAPE_TYPES.includes(shapeType);
  }

  private static hasNonEmptyText(text: string): boolean {
    return !!text.trim();
  }

  isScenario(): boolean {
    return this.type === ElementType.SCENARIO;
  }

  isRule(): boolean {
    return this.type === ElementType.RULE;
  }
}

