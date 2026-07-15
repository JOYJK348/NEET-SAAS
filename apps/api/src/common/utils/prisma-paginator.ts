import { PaginatedResult, QueryParamsDto } from '../dto/query-params.dto';

export interface PrismaPaginateArgs {
  model: {
    count: (args: unknown) => Promise<number>;
    findMany: (args: unknown) => Promise<unknown[]>;
  };
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  query: QueryParamsDto;
  tenantId: string;
}

export async function paginate<T>(
  args: PrismaPaginateArgs,
): Promise<PaginatedResult<T>> {
  const { model, where = {}, orderBy, include, select, query, tenantId } = args;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const defaultOrderBy = {
    [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
  } as Record<string, 'asc' | 'desc'>;

  const baseWhere = { ...where, tenantId, deletedAt: null };

  const [total, data] = await Promise.all([
    model.count({ where: baseWhere }),
    model.findMany({
      where: baseWhere,
      orderBy: orderBy || defaultOrderBy,
      skip,
      take: limit,
      ...(include ? { include } : {}),
      ...(select ? { select } : {}),
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as T[],
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export function buildPrismaOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  return { [sortBy || 'createdAt']: sortOrder || 'desc' };
}

export function buildPrismaSearch(
  search: string | undefined,
  fields: string[],
): Record<string, unknown> | undefined {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}
