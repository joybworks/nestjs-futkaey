/* eslint-disable @typescript-eslint/no-explicit-any */
import { FindOperator } from 'typeorm';

/**
 * Custom Regex operator for MongoDB regex queries.
 */
export function Regex<T>(value: RegExp | string): FindOperator<T> {
  return new FindOperator('equal' as any, value as any, false, false);
}

// Re-export all standard TypeORM operators
export {
  And,
  Or,
  Any,
  Between,
  Equal,
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Raw,
  ArrayContains,
  ArrayContainedBy,
  ArrayOverlap,
  FindOperator,
} from 'typeorm';
