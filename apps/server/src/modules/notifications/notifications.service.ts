import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { NotificationsGateway } from './notifications.gateway';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: DatabaseService,
    private readonly gateway: NotificationsGateway,
    private readonly config: ConfigService,
  ) {
    // Initialize VAPID details for web-push
    const subject = this.config.get<string>('vapid.subject');
    const publicKey = this.config.get<string>('vapid.publicKey');
    const privateKey = this.config.get<string>('vapid.privateKey');

    if (subject && publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log('Web Push VAPID details initialized successfully');
    } else {
      this.logger.warn('VAPID keys are missing — Web Push will not function');
    }
  }

  // ─── Push Subscription Management ─────────────────────────────────────────

  async saveSubscription(
    userId: number,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    // Upsert: update existing subscription or create a new one
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async removeSubscription(userId: number, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { message: 'Push subscription removed' };
  }

  // ─── Internal: send native web push to all user devices ───────────────────

  private async sendWebPush(userId: number, title: string, body: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `taskflow-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        ),
      ),
    );

    // Clean up expired/invalid subscriptions (HTTP 410 Gone)
    const expiredEndpoints: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const err = result.reason as any;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(subscriptions[index].endpoint);
        } else {
          this.logger.warn(`Web Push failed: ${err?.message || err}`);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
      this.logger.log(
        `Cleaned up ${expiredEndpoints.length} expired push subscription(s)`,
      );
    }
  }

  // ─── Create notification (in-app + WebSocket + Web Push) ──────────────────

  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    // 1. Real-time WebSocket notification (in-app)
    this.gateway.sendNotificationToUser(userId, 'notification', notification);

    // 2. Native Web Push notification (browser system notification)
    this.sendWebPush(userId, title, message).catch((err) =>
      this.logger.error(`sendWebPush error: ${err?.message || err}`),
    );

    return notification;
  }

  // ─── Query & mutation helpers ──────────────────────────────────────────────

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async markAsRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }
}
