import { Injectable } from '@nestjs/common';
import { getAuditConfig, getHierarchyLevels, getSystemUserId } from '../config/nestjs-futkaey.accessor';
import { HierarchyLevel } from '../config/nestjs-futkaey.interfaces';
import { IContextProvider } from './context.interface';

@Injectable()
export class ClsContextProvider implements IContextProvider {
  private getClsService() {
    try {
      const { ClsServiceManager } = require('nestjs-cls');
      return ClsServiceManager.getClsService();
    } catch {
      return null;
    }
  }

  get(fieldName: string): string | undefined {
    const cls = this.getClsService();
    if (!cls) return undefined;

    const levels = getHierarchyLevels();
    const level = levels.find(l => l.fieldName === fieldName);
    if (!level) return undefined;

    const clsKey = level.clsKey ?? level.headerName;
    return cls.get(clsKey) ?? undefined;
  }

  getAll(): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    const levels = getHierarchyLevels();
    for (const level of levels) {
      result[level.fieldName] = this.get(level.fieldName);
    }
    return result;
  }

  getUserId(): string | undefined {
    const cls = this.getClsService();
    if (!cls) return undefined;
    const auditConfig = getAuditConfig();
    const key = auditConfig.userIdClsKey ?? auditConfig.userIdHeader ?? 'x-user-id';
    return cls.get(key) ?? undefined;
  }

  getCorrelationId(): string | undefined {
    const cls = this.getClsService();
    if (!cls) return undefined;
    const auditConfig = getAuditConfig();
    return cls.get(auditConfig.correlationIdHeader ?? 'x-correlation-id') ?? undefined;
  }

  getHierarchyLevels(): HierarchyLevel[] {
    return getHierarchyLevels();
  }

  getSystemUserId(): string {
    return getSystemUserId();
  }
}
