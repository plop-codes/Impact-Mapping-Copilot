import type { Element } from './element';

type Bounds = { x: number; y: number; width: number; height: number };

export class Release {
  readonly releaseName: string;
  private readonly bounds: Bounds;

  private constructor(name: string, bounds: Bounds) {
    this.assertNameIsNotEmpty(name);

    this.releaseName = name;
    this.bounds = bounds;
  }

  private assertNameIsNotEmpty(name: string) {
    if (!name.trim()) throw new Error('Release name cannot be empty');
  }

  static identifyFromSection(section: {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }): Release | undefined {
    if (!this.hasNonEmptyName(section.name)) return undefined;
    if (this.isExcludedSection(section.name)) return undefined;

    return new Release(section.name, {
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
    });
  }

  private static hasNonEmptyName(name: string): boolean {
    return !!name.trim();
  }

  private static readonly EXCLUDED_SECTION_NAMES = ['backbone', 'vision produit', 'acteurs opérationnels', 'glossaire'];

  private static isExcludedSection(name: string): boolean {
    return this.EXCLUDED_SECTION_NAMES.includes(name.trim().toLowerCase());
  }

  assignToItems(elements: Element[], shapes: { id: string; x?: number; y?: number; width?: number; height?: number }[]): void {
    for (const element of elements) {
      const shape = shapes.find((s) => s.id === element.id);
      if (
        shape?.x !== undefined &&
        shape?.y !== undefined &&
        shape?.width !== undefined &&
        shape?.height !== undefined
      ) {
        if (this.isShapeContained(shape as Bounds)) {
          element.release = this.releaseName;
        }
      }
    }
  }

  private isShapeContained(shape: Bounds): boolean {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    return (
      centerX >= this.bounds.x &&
      centerX <= this.bounds.x + this.bounds.width &&
      centerY >= this.bounds.y &&
      centerY <= this.bounds.y + this.bounds.height
    );
  }
}
