import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: DatabaseService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Sanitize user by removing sensitive info
    const { passwordHash, ...rest } = user;
    
    // Flatten permissions list
    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);
    
    return {
      ...rest,
      permissions,
    };
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      include: {
        role: true,
      },
    });
  }

  async updateSettings(userId: number, theme: string, language: string, timezone: string) {
    return this.prisma.userSetting.upsert({
      where: { userId },
      update: { theme, language, timezone },
      create: { userId, theme, language, timezone },
    });
  }
}
