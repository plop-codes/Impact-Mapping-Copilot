import type { ImpactMappingContext } from '../../impactMappingContext.js';

export interface StoreImpactMappingContextDSL {
  givenTheServerIsRunning(): Promise<void>;
  whenThePluginSendsBoardData(data: ImpactMappingContext): Promise<void>;
  thenTheBoardDataIsStored(expected: ImpactMappingContext): Promise<void>;
}
