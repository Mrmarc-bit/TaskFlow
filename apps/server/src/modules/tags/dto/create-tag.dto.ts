import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Bug', description: 'The unique tag name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '#f43f5e', description: 'Color label hex code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color must be a valid hex code (e.g. #ffffff)' })
  color!: string;
}
