import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Backend', description: 'The unique name of the category' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '#6366f1', description: 'Color label hex code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color must be a valid hex code (e.g. #ffffff)' })
  color!: string;

  @ApiProperty({ example: 'Database and API logic', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
