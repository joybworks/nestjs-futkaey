import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { getAuditConfig, getHierarchyLevels, isRegularMode } from '../config/nestjs-futkaey.accessor';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (isRegularMode()) {
      return next();
    }

    let cls: { set: (k: string, v: string) => void } | null;
    try {
      const { ClsServiceManager } = require('nestjs-cls');
      cls = ClsServiceManager.getClsService();
    } catch {
      return next();
    }

    if (!cls) {
      return next();
    }

    // Extract hierarchy level headers
    const levels = getHierarchyLevels();
    for (const level of levels) {
      const headerValue = req.headers[level.headerName.toLowerCase()] as string | undefined;
      const clsKey = level.clsKey ?? level.headerName;
      if (headerValue) {
        cls.set(clsKey, headerValue);
      }
    }

    // Extract audit headers
    const auditConfig = getAuditConfig();

    const userIdHeader = auditConfig.userIdHeader ?? 'x-user-id';
    const userId = req.headers[userIdHeader.toLowerCase()] as string | undefined;
    if (userId) {
      cls.set(auditConfig.userIdClsKey ?? userIdHeader, userId);
    }

    const correlationIdHeader = auditConfig.correlationIdHeader ?? 'x-correlation-id';
    const correlationId = req.headers[correlationIdHeader.toLowerCase()] as string | undefined;
    if (correlationId) {
      cls.set(correlationIdHeader, correlationId);
    }

    next();
  }
}
