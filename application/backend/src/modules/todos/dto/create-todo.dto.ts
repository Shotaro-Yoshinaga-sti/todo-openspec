import { IsString, IsEnum, IsOptional, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TodoStatus, TodoPriority } from '../entities/todo.entity';

export class CreateTodoDto {
  @ApiProperty({
    description: 'TODO title',
    maxLength: 200,
    example: 'Implement user authentication',
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'TODO description',
    maxLength: 2000,
    example: 'Add Google OAuth integration for user login',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'TODO status',
    enum: TodoStatus,
    example: TodoStatus.PENDING,
  })
  @IsEnum(TodoStatus)
  status: TodoStatus;

  @ApiPropertyOptional({
    description: 'TODO priority',
    enum: TodoPriority,
    default: TodoPriority.MEDIUM,
    example: TodoPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @ApiPropertyOptional({
    description: 'TODO due date',
    type: String,
    format: 'date-time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
