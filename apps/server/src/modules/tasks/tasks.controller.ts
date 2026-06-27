import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter tasks for authenticated user' })
  async findAll(
    @CurrentUser('sub') userId: number,
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed task attributes' })
  async findOne(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task properties' })
  async update(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a task' })
  async remove(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.remove(userId, id);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted task' })
  async restore(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tasksService.restore(userId, id);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload file attachment to a task (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `attachment-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
      fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
        // Validate MIME type against standard formats
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
        const mime = allowedTypes.test(file.mimetype);
        const ext = allowedTypes.test(extname(file.originalname).toLowerCase());
        
        if (mime && ext) {
          return callback(null, true);
        }
        callback(new BadRequestException('Invalid file type uploaded. Allowed: Images, PDF, Docs, Zip, and Plain Text.'), false);
      },
    }),
  )
  async uploadAttachment(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No attachment file provided');
    }
    return this.tasksService.addAttachment(userId, id, file);
  }

  @Delete('attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete a task file attachment' })
  async removeAttachment(
    @CurrentUser('sub') userId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    return this.tasksService.removeAttachment(userId, attachmentId);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Create a new subtask checklist item' })
  async addSubTask(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) taskId: number,
    @Body('title') title: string,
  ) {
    return this.tasksService.addSubTask(userId, taskId, title);
  }

  @Put('subtasks/:subtaskId')
  @ApiOperation({ summary: 'Toggle subtask completion state' })
  async toggleSubTask(
    @CurrentUser('sub') userId: number,
    @Param('subtaskId', ParseIntPipe) subTaskId: number,
    @Body('isDone') isDone: boolean,
  ) {
    return this.tasksService.toggleSubTask(userId, subTaskId, isDone);
  }

  @Delete('subtasks/:subtaskId')
  @ApiOperation({ summary: 'Delete a subtask' })
  async removeSubTask(
    @CurrentUser('sub') userId: number,
    @Param('subtaskId', ParseIntPipe) subTaskId: number,
  ) {
    return this.tasksService.removeSubTask(userId, subTaskId);
  }
}
