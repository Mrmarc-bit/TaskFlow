import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(userId: number, dto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: {
        userId_name: { userId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException(`A tag with name '${dto.name}' already exists`);
    }

    return this.prisma.tag.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });

    if (!tag) {
      throw new NotFoundException(`Tag not found`);
    }
    return tag;
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
