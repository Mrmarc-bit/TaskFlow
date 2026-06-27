import { Controller, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add a comment or reply to a task' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(
    @CurrentUser('sub') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, taskId, dto);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Remove a comment' })
  async remove(
    @CurrentUser('sub') userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.remove(userId, commentId);
  }
}
