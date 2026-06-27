import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(userId: number, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: {
        userId_name: { userId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException(`A category with name '${dto.name}' already exists`);
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }
    return category;
  }

  async update(userId: number, id: number, dto: CreateCategoryDto) {
    // Validate ownership
    await this.findOne(userId, id);

    // Validate name uniqueness on update
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictException(`Another category with name '${dto.name}' already exists`);
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
