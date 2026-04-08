import type { AnalyzeContextElementsContextReader } from './analyzeContextElements.contextReader';
import { ContextElements } from './contextElements';
import { CommandResult } from '../../shared/result/commandResult';

export class AnalyzeContextElementsUseCase {
  constructor(
    private readonly contextReader: AnalyzeContextElementsContextReader,
  ) {}

  execute(): CommandResult<string> {
    const sections = this.contextReader.readContextSections();
    const contextElements = ContextElements.fromRawSections(sections);
    return CommandResult.success(contextElements.toJson());
  }
}
