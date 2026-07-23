import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';
import { QueryRoomDto } from '../dto/query-room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryRoomDto) {
    const { branchId, roomType, isActive, search } = query;

    const rooms = await this.prisma.rooms.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(branchId && { branchId }),
        ...(roomType && { roomType }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    });

    return rooms;
  }

  async findOne(tenantId: string, id: string) {
    const room = await this.prisma.rooms.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async create(tenantId: string, userId: string, dto: CreateRoomDto) {
    // Check for duplicate code within branch
    const existing = await this.prisma.rooms.findFirst({
      where: {
        tenantId,
        branchId: dto.branchId,
        code: dto.code,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A room with code "${dto.code}" already exists in this branch`,
      );
    }

    return this.prisma.rooms.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        name: dto.name,
        code: dto.code,
        capacity: dto.capacity ?? 40,
        roomType: dto.roomType,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateRoomDto,
  ) {
    await this.findOne(tenantId, id);
    return this.prisma.rooms.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  async remove(tenantId: string, id: string, userId: string) {
    await this.findOne(tenantId, id);
    return this.prisma.rooms.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
      },
    });
  }
}
