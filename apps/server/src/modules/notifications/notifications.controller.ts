import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ─── In-app notifications ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all notifications for authenticated user' })
  async findAll(@CurrentUser('sub') userId: number) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('sub') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  // ─── Web Push Subscription Management ─────────────────────────────────────

  @Post('subscribe')
  @ApiOperation({ summary: 'Save browser push subscription for this user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['endpoint', 'keys'],
      properties: {
        endpoint: { type: 'string' },
        keys: {
          type: 'object',
          properties: {
            p256dh: { type: 'string' },
            auth: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Subscription saved successfully' })
  async subscribe(
    @CurrentUser('sub') userId: number,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.notificationsService.saveSubscription(userId, body);
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Remove browser push subscription for this user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['endpoint'],
      properties: {
        endpoint: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Subscription removed' })
  async unsubscribe(
    @CurrentUser('sub') userId: number,
    @Body('endpoint') endpoint: string,
  ) {
    return this.notificationsService.removeSubscription(userId, endpoint);
  }
}
