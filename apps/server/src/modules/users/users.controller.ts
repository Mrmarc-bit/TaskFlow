import { Controller, Get, Body, Put, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '../../decorators/current-user.decorator';

class UpdateSettingsDto {
  theme!: string;
  language!: string;
  timezone!: string;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and permissions' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser('sub') userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings (theme, language, timezone)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @CurrentUser('sub') userId: number,
    @Body() body: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(userId, body.theme, body.language, body.timezone);
  }
}
