import { SetMetadata } from '@nestjs/common';
import { MetadataKeys } from '../config/nestjs-futkaey.constants';

export type ContextRequirement = 'full' | 'user-only' | 'none' | 'system';

/** Mark a route as public - bypasses tenant context validation */
export const Public = () => SetMetadata(MetadataKeys.PublicRoute, true);

/** Require specific context level on a route */
export const RequiresContext = (level: ContextRequirement) =>
  SetMetadata(MetadataKeys.RequiresContext, level);

/** Alias for @RequiresContext('full') */
export const TenantScoped = () => RequiresContext('full');
