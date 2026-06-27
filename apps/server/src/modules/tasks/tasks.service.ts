import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: number, dto: CreateTaskDto) {
    const { categoryId, tagIds, ...taskData } = dto;

    const task = await this.prisma.$transaction(async (tx) => {
      // 1. Create task
      const task = await tx.task.create({
        data: {
          ...taskData,
          creatorId: userId,
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null,
          completedAt: dto.status === TaskStatus.DONE ? new Date() : null,
        },
      });

      // 2. Link category if provided
      if (categoryId) {
        await tx.taskCategory.create({
          data: {
            taskId: task.id,
            categoryId,
          },
        });
      }

      // 3. Link tags if provided
      if (tagIds && tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: tagIds.map((tagId) => ({
            taskId: task.id,
            tagId,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          userId,
          actionType: 'CREATE',
          entityType: 'TASK',
          entityId: task.id,
          description: `Task '${task.title}' was created`,
        },
      });

      return task;
    });

    // Notify assignee about assignment after database transaction commits
    const assigneeId = dto.assigneeId;
    if (assigneeId && assigneeId !== userId) {
      try {
        await this.notificationsService.createNotification(
          assigneeId,
          'New Task Assignment',
          `You have been assigned the task: "${task.title}"`,
          'TASK_ASSIGNMENT',
        );
      } catch (err) {}
    }

    return task;
  }

  async findAll(userId: number, query: QueryTasksDto) {
    const { search, status, priority, categoryId, tagId, sortBy, sortOrder, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      creatorId: userId,
      isDeleted: false,
    };

    // Filter by search string
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filter by status/priority
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    // Filter by category relation
    if (categoryId) {
      where.taskCategories = {
        some: { categoryId },
      };
    }

    // Filter by tag relation
    if (tagId) {
      where.taskTags = {
        some: { tagId },
      };
    }

    // Order mapping
    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          taskCategories: {
            include: {
              category: true,
            },
          },
          taskTags: {
            include: {
              tag: true,
            },
          },
          attachments: true,
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    // Flatten category & tags for client mapping ease
    const formattedTasks = tasks.map((t) => {
      const { taskCategories, taskTags, ...rest } = t;
      return {
        ...rest,
        category: taskCategories[0]?.category || null,
        tags: taskTags.map((tt) => tt.tag),
      };
    });

    return {
      tasks: formattedTasks,
      total,
      page,
      limit,
    };
  }

  async findOne(userId: number, id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, creatorId: userId, isDeleted: false },
      include: {
        taskCategories: {
          include: {
            category: true,
          },
        },
        taskTags: {
          include: {
            tag: true,
          },
        },
        attachments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        subTasks: {
          where: { isDeleted: false },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const { taskCategories, taskTags, ...rest } = task;
    return {
      ...rest,
      category: taskCategories[0]?.category || null,
      tags: taskTags.map((tt) => tt.tag),
    };
  }

  async update(userId: number, id: number, dto: UpdateTaskDto) {
    const currentTask = await this.findOne(userId, id);
    const { categoryId, tagIds, ...taskData } = dto;

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      // 1. Calculate status and completed date updates
      const updatedFields: Prisma.TaskUpdateInput = {
        ...taskData,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
      };

      if (dto.status && dto.status !== currentTask.status) {
        updatedFields.completedAt = dto.status === TaskStatus.DONE ? new Date() : null;
      }

      // 2. Perform task update
      const updatedTask = await tx.task.update({
        where: { id },
        data: updatedFields,
      });

      // 3. Update Category link if defined
      if (categoryId !== undefined) {
        await tx.taskCategory.deleteMany({ where: { taskId: id } });
        if (categoryId !== null) {
          await tx.taskCategory.create({
            data: { taskId: id, categoryId },
          });
        }
      }

      // 4. Update Tag links if defined
      if (tagIds !== undefined) {
        await tx.taskTag.deleteMany({ where: { taskId: id } });
        if (tagIds && tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: tagIds.map((tagId) => ({ taskId: id, tagId })),
          });
        }
      }

      // 5. Build activity log auditing description
      let actionType = 'UPDATE';
      let auditDescription = `Task '${updatedTask.title}' was modified`;

      if (dto.status && dto.status !== currentTask.status) {
        actionType = 'STATUS_CHANGE';
        auditDescription = `Task '${updatedTask.title}' status shifted from ${currentTask.status} to ${updatedTask.status}`;
      }

      await tx.activityLog.create({
        data: {
          userId,
          actionType,
          entityType: 'TASK',
          entityId: id,
          description: auditDescription,
        },
      });

      return updatedTask;
    });

    // Trigger updates notifications after transaction commits successfully
    const assigneeId = dto.assigneeId;
    if (assigneeId && assigneeId !== currentTask.assigneeId && assigneeId !== userId) {
      try {
        await this.notificationsService.createNotification(
          assigneeId,
          'Task Assignment Update',
          `You have been assigned the task: "${updatedTask.title}"`,
          'TASK_ASSIGNMENT',
        );
      } catch (err) {}
    }

    if (dto.status === 'DONE' && currentTask.status !== 'DONE' && updatedTask.creatorId !== userId) {
      try {
        await this.notificationsService.createNotification(
          updatedTask.creatorId,
          'Task Completed',
          `Task "${updatedTask.title}" was marked as completed.`,
          'TASK_UPDATE',
        );
      } catch (err) {}
    }

    return updatedTask;
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    return this.prisma.$transaction(async (tx) => {
      const deletedTask = await tx.task.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          actionType: 'DELETE',
          entityType: 'TASK',
          entityId: id,
          description: `Task '${deletedTask.title}' was soft-deleted`,
        },
      });

      return deletedTask;
    });
  }

  async restore(userId: number, id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, creatorId: userId, isDeleted: true },
    });

    if (!task) {
      throw new NotFoundException(`Soft-deleted task with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const restoredTask = await tx.task.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          actionType: 'UPDATE',
          entityType: 'TASK',
          entityId: id,
          description: `Task '${restoredTask.title}' was restored from archive`,
        },
      });

      return restoredTask;
    });
  }

  async addAttachment(userId: number, taskId: number, file: any) {
    // Verify task ownership
    await this.findOne(userId, taskId);

    return this.prisma.attachment.create({
      data: {
        taskId,
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
      },
    });
  }

  async removeAttachment(userId: number, attachmentId: number) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: true },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment not found`);
    }

    if (attachment.task.creatorId !== userId) {
      throw new ForbiddenException(`Access denied: you do not own this task`);
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Remove from local disk storage
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(process.cwd(), 'uploads', path.basename(attachment.filePath));
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {}
    }

    return { message: 'Attachment deleted successfully' };
  }

  async addSubTask(userId: number, taskId: number, title: string) {
    // Verify task ownership
    await this.findOne(userId, taskId);

    return this.prisma.task.create({
      data: {
        title,
        creatorId: userId,
        parentId: taskId,
        status: 'TODO',
        priority: 'MEDIUM',
        progress: 0,
      },
    });
  }

  async toggleSubTask(userId: number, subTaskId: number, isDone: boolean) {
    const subTask = await this.prisma.task.findUnique({
      where: { id: subTaskId },
    });

    if (!subTask) {
      throw new NotFoundException(`Subtask not found`);
    }

    if (subTask.creatorId !== userId) {
      throw new ForbiddenException(`Access denied: you do not own this subtask`);
    }

    return this.prisma.task.update({
      where: { id: subTaskId },
      data: {
        status: isDone ? 'DONE' : 'TODO',
        progress: isDone ? 100 : 0,
        completedAt: isDone ? new Date() : null,
      },
    });
  }

  async removeSubTask(userId: number, subTaskId: number) {
    const subTask = await this.prisma.task.findUnique({
      where: { id: subTaskId },
    });

    if (!subTask) {
      throw new NotFoundException(`Subtask not found`);
    }

    if (subTask.creatorId !== userId) {
      throw new ForbiddenException(`Access denied: you do not own this subtask`);
    }

    return this.prisma.task.update({
      where: { id: subTaskId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
