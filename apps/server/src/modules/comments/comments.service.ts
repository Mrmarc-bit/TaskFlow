import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: number, taskId: number, dto: CreateCommentDto) {
    // 1. Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.isDeleted) {
      throw new NotFoundException(`Task not found`);
    }

    // 2. Verify parent comment if provided
    let parentComment: any = null;
    if (dto.parentId) {
      parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException(`Parent comment not found`);
      }
      if (parentComment.taskId !== taskId) {
        throw new BadRequestException(`Parent comment belongs to a different task`);
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      // 3. Create comment
      const createdComment = await tx.comment.create({
        data: {
          content: dto.content,
          taskId,
          userId,
          parentId: dto.parentId || null,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          userId,
          actionType: 'CREATE',
          entityType: 'COMMENT',
          entityId: createdComment.id,
          description: `User posted a comment on task '${task.title}'`,
        },
      });

      return createdComment;
    });

    // Notify thread members after transaction commits
    try {
      if (parentComment && parentComment.userId !== userId) {
        await this.notificationsService.createNotification(
          parentComment.userId,
          'Reply to your comment',
          `Someone replied to your comment on task: "${task.title}"`,
          'COMMENT_POSTED',
        );
      } else if (task.assigneeId && task.assigneeId !== userId) {
        await this.notificationsService.createNotification(
          task.assigneeId,
          'New Task Comment',
          `A new comment was posted on your assigned task: "${task.title}"`,
          'COMMENT_POSTED',
        );
      } else if (task.creatorId !== userId) {
        await this.notificationsService.createNotification(
          task.creatorId,
          'New Task Comment',
          `A new comment was posted on task: "${task.title}"`,
          'COMMENT_POSTED',
        );
      }
    } catch (err) {}

    return comment;
  }

  async remove(userId: number, id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!comment) {
      throw new NotFoundException(`Comment not found`);
    }

    // Check authorization (only comment owner or task creator or admin can delete)
    if (comment.userId !== userId && comment.task.creatorId !== userId) {
      throw new ForbiddenException(`Access denied: you do not have permission to delete this comment`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id },
      });

      await tx.activityLog.create({
        data: {
          userId,
          actionType: 'DELETE',
          entityType: 'COMMENT',
          entityId: id,
          description: `User deleted a comment on task '${comment.task.title}'`,
        },
      });

      return { message: 'Comment deleted successfully' };
    });
  }
}
