import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

@ApiTags('Tags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task tag' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  async create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags for the authenticated user' })
  async findAll(@CurrentUser('sub') userId: number) {
    return this.tagsService.findAll(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a tag' })
  async remove(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tagsService.remove(userId, id);
  }
}
