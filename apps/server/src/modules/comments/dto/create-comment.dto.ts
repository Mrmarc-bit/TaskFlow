import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'I have finished setting up the refresh token endpoints.', description: 'The text content of the comment' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ example: 1, required: false, description: 'The parent comment ID (for nesting replies)' })
  @IsInt()
  @IsOptional()
  parentId?: number;
}
