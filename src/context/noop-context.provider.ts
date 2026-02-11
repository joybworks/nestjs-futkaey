import { SYSTEM_USER_ID_DEFAULT } from '../config/nestjs-futkaey.constants';
import { HierarchyLevel } from '../config/nestjs-futkaey.interfaces';
import { IContextProvider } from './context.interface';

export class NoopContextProvider implements IContextProvider {
  get(_fieldName: string): string | undefined {
    return undefined;
  }

  getAll(): Record<string, string | undefined> {
    return {};
  }

  getUserId(): string | undefined {
    return undefined;
  }

  getCorrelationId(): string | undefined {
    return undefined;
  }

  getHierarchyLevels(): HierarchyLevel[] {
    return [];
  }

  getSystemUserId(): string {
    return SYSTEM_USER_ID_DEFAULT;
  }
}
