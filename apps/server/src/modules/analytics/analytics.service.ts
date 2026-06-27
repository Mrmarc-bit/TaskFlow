import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getDashboardData(userId: number) {
    const [
      statusStats,
      priorityStats,
      recentActivities,
      allTasks,
    ] = await Promise.all([
      // 1. Task counts grouped by status
      this.prisma.task.groupBy({
        by: ['status'],
        where: { creatorId: userId, isDeleted: false },
        _count: { id: true },
      }),
      // 2. Task counts grouped by priority
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { creatorId: userId, isDeleted: false },
        _count: { id: true },
      }),
      // 3. Recent activity logs
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      // 4. Load tasks with categories to display in "Today's Tasks" list
      this.prisma.task.findMany({
        where: { creatorId: userId, isDeleted: false },
        orderBy: { deadline: 'asc' },
        take: 6,
        include: {
          taskCategories: {
            include: {
              category: true,
            },
          },
        },
      }),
    ]);

    // 5. Calculate Weekly completed tasks trend (last 7 days)
    const weeklyTrend = await this.calculateWeeklyTrend(userId);

    // 6. Calculate Monthly completed tasks trend (last 6 months)
    const monthlyTrend = await this.calculateMonthlyTrend(userId);

    // Format Status Counts mapping
    const statusCounts = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
      ARCHIVED: 0,
    };
    statusStats.forEach((stat) => {
      if (stat.status in statusCounts) {
        statusCounts[stat.status as keyof typeof statusCounts] = stat._count.id;
      }
    });

    // Format Priority Counts mapping
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    priorityStats.forEach((stat) => {
      if (stat.priority in priorityCounts) {
        priorityCounts[stat.priority as keyof typeof priorityCounts] = stat._count.id;
      }
    });

    // Format Task Details
    const todayTasks = allTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.taskCategories[0]?.category.name || 'Unassigned',
      progress: t.progress,
    }));

    return {
      statusCounts,
      priorityCounts,
      weeklyTrend,
      monthlyTrend,
      recentActivities,
      todayTasks,
    };
  }

  private async calculateWeeklyTrend(userId: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const completedTasks = await this.prisma.task.findMany({
      where: {
        creatorId: userId,
        status: 'DONE',
        isDeleted: false,
        completedAt: { gte: sevenDaysAgo },
      },
      select: { completedAt: true },
    });

    // Map last 7 days date strings
    const trendMap: { [dateKey: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short' });
      trendMap[dateString] = 0;
    }

    // Accumulate completed task counts
    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const dayString = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (dayString in trendMap) {
          trendMap[dayString]++;
        }
      }
    });

    return Object.keys(trendMap).map((day) => ({
      name: day,
      completed: trendMap[day],
    }));
  }

  private async calculateMonthlyTrend(userId: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const completedTasks = await this.prisma.task.findMany({
      where: {
        creatorId: userId,
        status: 'DONE',
        isDeleted: false,
        completedAt: { gte: sixMonthsAgo },
      },
      select: { completedAt: true },
    });

    // Map last 6 months
    const trendMap: { [monthKey: string]: number } = {};
    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(date.getMonth() + i);
      const monthString = date.toLocaleDateString('en-US', { month: 'short' });
      trendMap[monthString] = 0;
    }

    // Accumulate completed task counts
    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const monthString = new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short' });
        if (monthString in trendMap) {
          trendMap[monthString]++;
        }
      }
    });

    return Object.keys(trendMap).map((month) => ({
      name: month,
      completed: trendMap[month],
    }));
  }
}
