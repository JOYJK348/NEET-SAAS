import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TenantScopedQueryOptions {
  includeDeleted?: boolean;
  tenantId: string;
  branchId?: string;
}

type PrismaModel = {
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  delete: (args: unknown) => Promise<unknown>;
};

@Injectable()
export class TenantScopedPrisma {
  constructor(private readonly prisma: PrismaService) {}

  buildWhere(
    tenantId: string,
    extra: Record<string, unknown> = {},
    options?: { includeDeleted?: boolean },
  ): Record<string, unknown> {
    return {
      tenantId,
      ...(options?.includeDeleted ? {} : { deletedAt: null }),
      ...extra,
    };
  }

  async findUnique<T>(
    model: PrismaModel,
    id: string,
    tenantId: string,
    _options?: TenantScopedQueryOptions,
  ): Promise<T | null> {
    return model.findUnique({
      where: { tenantId_id: { tenantId, id } },
    }) as Promise<T | null>;
  }

  async findMany<T>(
    model: PrismaModel,
    tenantId: string,
    extraWhere: Record<string, unknown> = {},
    _options?: { includeDeleted?: boolean },
  ): Promise<T[]> {
    return model.findMany({
      where: this.buildWhere(tenantId, extraWhere, _options),
    }) as Promise<T[]>;
  }

  async count(
    model: PrismaModel,
    tenantId: string,
    extraWhere: Record<string, unknown> = {},
  ): Promise<number> {
    return model.count({
      where: this.buildWhere(tenantId, extraWhere),
    });
  }

  async create<T>(
    model: PrismaModel,
    data: Record<string, unknown>,
  ): Promise<T> {
    return model.create({ data }) as Promise<T>;
  }

  async update<T>(
    model: PrismaModel,
    id: string,
    tenantId: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    return model.update({
      where: { tenantId_id: { tenantId, id } },
      data,
    }) as Promise<T>;
  }

  async softDelete(
    model: PrismaModel,
    id: string,
    tenantId: string,
    deletedBy: string,
  ): Promise<unknown> {
    return model.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }
}
