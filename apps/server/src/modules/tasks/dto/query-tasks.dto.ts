import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from './create-task.dto';

export enum TaskSortField {
  CREATED_AT = 'createdAt',
  DEADLINE = 'deadline',
  PRIORITY = 'priority',
  STATUS = 'status',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryTasksDto {
  @ApiProperty({ required: false, description: 'Search term for matching task titles and descriptions' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ enum: TaskPriority, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ required: false, description: 'Filter tasks by category ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false, description: 'Filter tasks by tag ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  tagId?: number;

  @ApiProperty({ enum: TaskSortField, default: TaskSortField.CREATED_AT, required: false })
  @IsEnum(TaskSortField)
  @IsOptional()
  sortBy?: TaskSortField = TaskSortField.CREATED_AT;

  @ApiProperty({ enum: SortOrder, default: SortOrder.DESC, required: false })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({ default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ default: 10, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
