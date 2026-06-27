import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    // 1. Check if user already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    // 2. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Find default role (MEMBER)
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'MEMBER' },
    });
    if (!defaultRole) {
      throw new BadRequestException('System configuration error: default role not found');
    }

    // 4. Create user inside database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: defaultRole.id,
        settings: {
          create: {
            theme: 'SYSTEM',
            language: 'en',
            timezone: 'UTC',
          },
        },
      },
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

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

    // 5. Generate authentication tokens
    const tokens = await this.generateTokenPair(user.id, user.email, user.role.name, permissions);

    // 6. Save refresh token hash
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, ...userProfile } = user;

    return {
      user: {
        ...userProfile,
        permissions,
      },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    // 1. Retrieve user
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

    // 3. Generate token pairs
    const tokens = await this.generateTokenPair(user.id, user.email, user.role.name, permissions);

    // 4. Store refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, ...userProfile } = user;

    return {
      user: {
        ...userProfile,
        permissions,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      // 1. Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret') || process.env.JWT_REFRESH_SECRET,
      });

      const userId = payload.sub;
      const incomingHash = this.hashToken(refreshToken);

      // 2. Retrieve refresh token entry
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: incomingHash },
      });

      // 3. Reuse Detection
      if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
        if (tokenRecord) {
          // Token re-use detected! Revoke all tokens for this user for security breach protection
          await this.prisma.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
          });
        }
        throw new ForbiddenException('Security compromise: Refresh token re-use or expiry detected');
      }

      // 4. Retrieve complete user info to ensure user is still active and roles haven't changed
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

      // 5. Generate fresh new token pair
      const tokens = await this.generateTokenPair(user.id, user.email, user.role.name, permissions);
      const newHash = this.hashToken(tokens.refreshToken);

      // 6. Rotate tokens inside transaction
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days expiry

      await this.prisma.$transaction([
        // Revoke current token and save relation to new rotated token
        this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: {
            revoked: true,
            replacedByToken: newHash,
          },
        }),
        // Register new token hash
        this.prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: newHash,
            expiresAt: expirationDate,
          },
        }),
      ]);

      const { passwordHash: _, ...userProfile } = user;

      return {
        user: {
          ...userProfile,
          permissions,
        },
        tokens,
      };
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid session refresh request');
    }
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash },
      data: { revoked: true },
    }).catch(() => {});
  }

  private async generateTokenPair(
    userId: number,
    email: string,
    role: string,
    permissions: string[],
  ) {
    const accessTokenExp = this.configService.get<string>('jwt.accessExpiration') || '15m';
    const refreshTokenExp = this.configService.get<string>('jwt.refreshExpiration') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      // Access token
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          permissions,
          jti: crypto.randomUUID(),
        },
        {
          secret: this.configService.get<string>('jwt.accessSecret') || process.env.JWT_ACCESS_SECRET,
          expiresIn: accessTokenExp as any,
        },
      ),
      // Refresh token
      this.jwtService.signAsync(
        {
          sub: userId,
          jti: crypto.randomUUID(),
        },
        {
          secret: this.configService.get<string>('jwt.refreshSecret') || process.env.JWT_REFRESH_SECRET,
          expiresIn: refreshTokenExp as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: number, token: string) {
    const hash = this.hashToken(token);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days expiry

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: expirationDate,
      },
    });
  }
}
