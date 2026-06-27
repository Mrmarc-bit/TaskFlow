import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement Push Notification Service' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Develop standard service worker listeners', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.TODO;

  @ApiProperty({ example: 2, required: false, description: 'ID of the user assigned to this task' })
  @IsInt()
  @IsOptional()
  assigneeId?: number;

  @ApiProperty({ example: '2026-07-10T12:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: '2026-07-09T09:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  reminderAt?: string;

  @ApiProperty({ example: 120, required: false, description: 'Estimated execution duration in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiProperty({ example: 0, required: false, description: 'Spent duration in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  spentMinutes?: number;

  @ApiProperty({ example: 0, required: false, description: 'Progress percentage (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number = 0;

  @ApiProperty({ example: '#6366f1', required: false })
  @IsString()
  @IsOptional()
  colorLabel?: string;

  @ApiProperty({ example: 1, required: false, description: 'Parent task ID' })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Category ID' })
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ example: [1, 2], isArray: true, required: false, description: 'Associated tag IDs' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  tagIds?: number[];
}
