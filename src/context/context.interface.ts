import { HierarchyLevel } from '../config/nestjs-futkaey.interfaces';

export interface IContextProvider {
  /** Get a specific context value by its configured field name */
  get(fieldName: string): string | undefined;
  /** Get all configured hierarchy field values */
  getAll(): Record<string, string | undefined>;
  /** Get user ID from context */
  getUserId(): string | undefined;
  /** Get correlation ID */
  getCorrelationId(): string | undefined;
  /** Get the configured hierarchy levels */
  getHierarchyLevels(): HierarchyLevel[];
  /** Get the system user ID */
  getSystemUserId(): string;
}
