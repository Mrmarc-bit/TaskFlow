import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@taskflow.dev', description: 'The registered email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @ApiProperty({ example: 'TaskFlowAdmin123!', description: 'The user password' })
  @IsString()
  password!: string;
}
